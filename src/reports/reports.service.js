const { Op } = require("sequelize");
const db = require("../../models");
const { sequelize } = require("../../models");

// Machine Management Reports
const getMachineUtilization = async (filters = {}) => {
  const { startDate, endDate, siteId, machineId, status } = filters;

  const whereClause = {};
  if (siteId) whereClause.siteId = siteId;
  if (machineId) whereClause.machineId = machineId;
  if (startDate && endDate) {
    whereClause.date = {
      [Op.between]: [startDate, endDate],
    };
  }

  const logbookEntries = await db.LogbookEntry.findAll({
    where: whereClause,
    include: [
      {
        model: db.Machinery,
        as: "machine",
        include: [{ model: db.Site, as: "site" }],
      },
    ],
    order: [["date", "DESC"]],
  });

  // Calculate utilization metrics
  const utilizationData = logbookEntries.map((entry) => {
    const runningHours = entry.totalRunHrsMeter || 0;
    const runningKM = entry.totalRunKM || 0;
    const dieselConsumption = entry.dieselIssue || 0;
    const efficiency = runningHours > 0 ? runningKM / runningHours : 0;

    return {
      date: entry.date,
      machine: entry.machine,
      runningHours,
      runningKM,
      dieselConsumption,
      efficiency,
      dieselAvgKM: entry.dieselAvgKM || 0,
      dieselAvgHrsMeter: entry.dieselAvgHrsMeter || 0,
    };
  });

  return {
    data: utilizationData,
    summary: {
      totalEntries: logbookEntries.length,
      totalRunningHours: utilizationData.reduce(
        (sum, item) => sum + item.runningHours,
        0
      ),
      totalRunningKM: utilizationData.reduce(
        (sum, item) => sum + item.runningKM,
        0
      ),
      totalDieselConsumption: utilizationData.reduce(
        (sum, item) => sum + item.dieselConsumption,
        0
      ),
      averageEfficiency:
        utilizationData.length > 0
          ? utilizationData.reduce((sum, item) => sum + item.efficiency, 0) /
            utilizationData.length
          : 0,
    },
  };
};

const getMachineMaintenanceReport = async (filters = {}) => {
  const { startDate, endDate, siteId, machineId, status, type } = filters;

  const whereClause = {};
  if (machineId) whereClause.machineId = machineId;
  if (status) whereClause.status = status;
  if (type) whereClause.type = type;
  if (startDate && endDate) {
    whereClause.date = {
      [Op.between]: [startDate, endDate],
    };
  }

  const maintenanceLogs = await db.MaintenanceLog.findAll({
    where: whereClause,
    include: [
      {
        model: db.Machinery,
        as: "machine",
        include: [{ model: db.Site, as: "site" }],
        where: siteId ? { siteId } : {},
      },
    ],
    order: [["date", "DESC"]],
  });

  const summary = {
    totalMaintenance: maintenanceLogs.length,
    totalCost: maintenanceLogs.reduce(
      (sum, log) => sum + (parseFloat(log.cost) || 0),
      0
    ),
    completedMaintenance: maintenanceLogs.filter(
      (log) => log.status === "completed"
    ).length,
    pendingMaintenance: maintenanceLogs.filter(
      (log) => log.status === "in_progress"
    ).length,
    scheduledMaintenance: maintenanceLogs.filter(
      (log) => log.status === "scheduled"
    ).length,
    byType: {},
  };

  // Group by maintenance type
  maintenanceLogs.forEach((log) => {
    const type = log.type || "Unknown";
    if (!summary.byType[type]) {
      summary.byType[type] = { count: 0, cost: 0 };
    }
    summary.byType[type].count++;
    summary.byType[type].cost += parseFloat(log.cost) || 0;
  });

  return {
    data: maintenanceLogs,
    summary,
  };
};

const getMachineTransferReport = async (filters = {}) => {
  const {
    startDate,
    endDate,
    machineId,
    currentSiteId,
    destinationSiteId,
    status,
    requestType,
  } = filters;

  const whereClause = {};
  if (machineId) whereClause.machineId = machineId;
  if (currentSiteId) whereClause.currentSiteId = currentSiteId;
  if (destinationSiteId) whereClause.destinationSiteId = destinationSiteId;
  if (status) whereClause.status = status;
  if (requestType) whereClause.requestType = requestType;
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [startDate, endDate],
    };
  }

  const transfers = await db.MachineTransfer.findAll({
    where: whereClause,
    include: [
      { model: db.Machinery, as: "machine" },
      { model: db.Site, as: "currentSite" },
      { model: db.Site, as: "destinationSite" },
      { model: db.User, as: "requester" },
      { model: db.User, as: "approver" },
    ],
    order: [["createdAt", "DESC"]],
  });

  const summary = {
    totalTransfers: transfers.length,
    byStatus: {},
    byType: {},
    averageProcessingTime: 0,
  };

  transfers.forEach((transfer) => {
    // Group by status
    const status = transfer.status;
    if (!summary.byStatus[status]) summary.byStatus[status] = 0;
    summary.byStatus[status]++;

    // Group by type
    const type = transfer.requestType;
    if (!summary.byType[type]) summary.byType[type] = 0;
    summary.byType[type]++;
  });

  return {
    data: transfers,
    summary,
  };
};

const getMachineComplianceReport = async (filters = {}) => {
  const { siteId, expiring_within_days = 30 } = filters;

  const whereClause = {};
  if (siteId) whereClause.siteId = siteId;

  const currentDate = new Date();
  const futureDate = new Date();
  futureDate.setDate(currentDate.getDate() + parseInt(expiring_within_days));

  const machines = await db.Machinery.findAll({
    where: whereClause,
    include: [{ model: db.Site, as: "site" }],
  });

  const complianceData = machines.map((machine) => {
    const compliance = {
      machine,
      expiring: [],
      expired: [],
    };

    // Check various compliance dates
    const complianceFields = [
      "fitnessCertificateExpiry",
      "motorVehicleTaxDue",
      "permitExpiryDate",
      "nationalPermitExpiry",
      "insuranceExpiry",
      "pollutionCertificateExpiry",
    ];

    complianceFields.forEach((field) => {
      const expiryDate = machine[field];
      if (expiryDate) {
        const expiry = new Date(expiryDate);
        if (expiry < currentDate) {
          compliance.expired.push({
            type: field,
            date: expiryDate,
            daysOverdue: Math.floor(
              (currentDate - expiry) / (1000 * 60 * 60 * 24)
            ),
          });
        } else if (expiry <= futureDate) {
          compliance.expiring.push({
            type: field,
            date: expiryDate,
            daysUntilExpiry: Math.floor(
              (expiry - currentDate) / (1000 * 60 * 60 * 24)
            ),
          });
        }
      }
    });

    return compliance;
  });

  const summary = {
    totalMachines: machines.length,
    machinesWithExpiredDocs: complianceData.filter(
      (item) => item.expired.length > 0
    ).length,
    machinesWithExpiringDocs: complianceData.filter(
      (item) => item.expiring.length > 0
    ).length,
    totalExpiredDocs: complianceData.reduce(
      (sum, item) => sum + item.expired.length,
      0
    ),
    totalExpiringDocs: complianceData.reduce(
      (sum, item) => sum + item.expiring.length,
      0
    ),
  };

  return {
    data: complianceData,
    summary,
  };
};

const getLogbookReport = async (filters = {}) => {
  const { startDate, endDate, siteId, machineId } = filters;

  const whereClause = {};
  if (siteId) whereClause.siteId = siteId;
  if (machineId) whereClause.machineId = machineId;
  if (startDate && endDate) {
    whereClause.date = {
      [Op.between]: [startDate, endDate],
    };
  }

  const logbookEntries = await db.LogbookEntry.findAll({
    where: whereClause,
    include: [
      { model: db.Machinery, as: "machine" },
      { model: db.Site, as: "site" },
      { model: db.User, as: "creater" },
    ],
    order: [["date", "DESC"]],
  });

  const summary = {
    totalEntries: logbookEntries.length,
    totalDieselConsumed: logbookEntries.reduce(
      (sum, entry) => sum + (entry.dieselIssue || 0),
      0
    ),
    totalKMRun: logbookEntries.reduce(
      (sum, entry) => sum + (entry.totalRunKM || 0),
      0
    ),
    totalHoursRun: logbookEntries.reduce(
      (sum, entry) => sum + (entry.totalRunHrsMeter || 0),
      0
    ),
    averageDieselEfficiency: 0,
  };

  const validEntries = logbookEntries.filter(
    (entry) => entry.totalRunKM > 0 && entry.dieselIssue > 0
  );
  if (validEntries.length > 0) {
    summary.averageDieselEfficiency =
      validEntries.reduce(
        (sum, entry) => sum + entry.totalRunKM / entry.dieselIssue,
        0
      ) / validEntries.length;
  }

  return {
    data: logbookEntries,
    summary,
  };
};

// Inventory Management Reports
const getInventoryStockReport = async (filters = {}) => {
  const { siteId, itemId, status, lowStock = false } = filters;

  const whereClause = {};
  if (siteId) whereClause.siteId = siteId;
  if (itemId) whereClause.itemId = itemId;
  if (status) whereClause.status = status;
  if (lowStock) {
    whereClause[Op.and] = [
      sequelize.where(
        sequelize.col("quantity"),
        Op.lte,
        sequelize.col("minimumLevel")
      ),
    ];
  }

  const inventory = await db.SiteInventory.findAll({
    where: whereClause,
    include: [
      { model: db.Site },
      {
        model: db.Item,
        include: [{ model: db.ItemGroup }, { model: db.Unit }],
      },
    ],
  });

  const summary = {
    totalItems: inventory.length,
    lowStockItems: inventory.filter(
      (item) => item.quantity <= item.minimumLevel
    ).length,
    outOfStockItems: inventory.filter((item) => item.quantity === 0).length,
    totalValue: 0, // Would need item prices to calculate
    byStatus: {},
  };

  inventory.forEach((item) => {
    const status = item.status;
    if (!summary.byStatus[status]) summary.byStatus[status] = 0;
    summary.byStatus[status]++;
  });

  return {
    data: inventory,
    summary,
  };
};

const getInventoryConsumptionReport = async (filters = {}) => {
  const { startDate, endDate, siteId, itemId } = filters;

  const whereClause = {
    type: "OUT",
  };
  if (siteId) whereClause.siteId = siteId;
  if (itemId) whereClause.itemId = itemId;
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [startDate, endDate],
    };
  }

  const consumptionLogs = await db.StockLog.findAll({
    where: whereClause,
    include: [
      { model: db.Site },
      {
        model: db.Item,
        include: [{ model: db.ItemGroup }, { model: db.Unit }],
      },
      { model: db.User },
    ],
    order: [["createdAt", "DESC"]],
  });

  // Group by item and calculate totals
  const consumptionByItem = {};
  consumptionLogs.forEach((log) => {
    const itemId = log.itemId;
    if (!consumptionByItem[itemId]) {
      consumptionByItem[itemId] = {
        item: log.Item,
        totalConsumed: 0,
        transactions: [],
      };
    }
    consumptionByItem[itemId].totalConsumed += Math.abs(log.change);
    consumptionByItem[itemId].transactions.push(log);
  });

  const summary = {
    totalTransactions: consumptionLogs.length,
    totalItemsConsumed: Object.keys(consumptionByItem).length,
    totalQuantityConsumed: consumptionLogs.reduce(
      (sum, log) => sum + Math.abs(log.change),
      0
    ),
  };

  return {
    data: consumptionLogs,
    byItem: consumptionByItem,
    summary,
  };
};

const getInventoryTransferReport = async (filters = {}) => {
  const { startDate, endDate, siteId, otherSiteId, status } = filters;

  const whereClause = {
    issueType: "Site Transfer",
  };
  if (siteId) whereClause.siteId = siteId;
  if (otherSiteId) whereClause.otherSiteId = otherSiteId;
  if (status) whereClause.status = status;
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [startDate, endDate],
    };
  }

  const transfers = await db.MaterialIssue.findAll({
    where: whereClause,
    include: [
      { model: db.Site, as: "fromSite" },
      { model: db.Site, as: "toSite" },
      {
        model: db.MaterialIssueItem,
        as: "items",
        include: [
          {
            model: db.Item,
            include: [{ model: db.ItemGroup }, { model: db.Unit }],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  const summary = {
    totalTransfers: transfers.length,
    byStatus: {},
    totalItemsTransferred: 0,
  };

  transfers.forEach((transfer) => {
    const status = transfer.status;
    if (!summary.byStatus[status]) summary.byStatus[status] = 0;
    summary.byStatus[status]++;

    summary.totalItemsTransferred += transfer.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  });

  return {
    data: transfers,
    summary,
  };
};

const getInventoryValuationReport = async (filters = {}) => {
  const { siteId, itemGroupId } = filters;

  const whereClause = {};
  if (siteId) whereClause.siteId = siteId;

  const inventory = await db.SiteInventory.findAll({
    where: whereClause,
    include: [
      {
        model: db.Item,
        include: [
          {
            model: db.ItemGroup,
            where: itemGroupId ? { id: itemGroupId } : {},
          },
          { model: db.Unit },
        ],
      },
      { model: db.Site },
    ],
  });

  // Note: This would need item prices from procurement or a separate price table
  // For now, returning quantity-based valuation
  const valuationData = inventory.map((item) => ({
    site: item.Site,
    item: item.Item,
    quantity: item.quantity,
    minimumLevel: item.minimumLevel,
    status: item.status,
    // estimatedValue: item.quantity * (item.Item.lastPurchasePrice || 0)
  }));

  const summary = {
    totalItems: inventory.length,
    totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0),
    // totalValue: valuationData.reduce((sum, item) => sum + item.estimatedValue, 0),
    lowStockValue: valuationData.filter(
      (item) => item.quantity <= item.minimumLevel
    ).length,
  };

  return {
    data: valuationData,
    summary,
  };
};

// Procurement & Financial Reports
const getProcurementSummaryReport = async (filters = {}) => {
  const { startDate, endDate, vendorId, status } = filters;

  const whereClause = {};
  if (vendorId) whereClause.vendorId = vendorId;
  if (status) whereClause.status = status;
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [startDate, endDate],
    };
  }

  const procurements = await db.Procurement.findAll({
    where: whereClause,
    include: [
      { model: db.Vendor },
      { model: db.Requisition },
      { model: db.ProcurementItem },
    ],
    order: [["createdAt", "DESC"]],
  });

  const summary = {
    totalProcurements: procurements.length,
    totalAmount: procurements.reduce(
      (sum, proc) => sum + (parseFloat(proc.totalAmount) || 0),
      0
    ),
    byStatus: {},
    byVendor: {},
  };

  procurements.forEach((proc) => {
    // Group by status
    const status = proc.status;
    if (!summary.byStatus[status]) {
      summary.byStatus[status] = { count: 0, amount: 0 };
    }
    summary.byStatus[status].count++;
    summary.byStatus[status].amount += parseFloat(proc.totalAmount) || 0;

    // Group by vendor
    const vendorName = proc.Vendor?.name || "Unknown";
    if (!summary.byVendor[vendorName]) {
      summary.byVendor[vendorName] = { count: 0, amount: 0 };
    }
    summary.byVendor[vendorName].count++;
    summary.byVendor[vendorName].amount += parseFloat(proc.totalAmount) || 0;
  });

  return {
    data: procurements,
    summary,
  };
};

const getProcurementVendorReport = async (filters = {}) => {
  const { startDate, endDate, vendorId } = filters;

  const whereClause = {};
  if (vendorId) whereClause.vendorId = vendorId;
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [startDate, endDate],
    };
  }

  const procurements = await db.Procurement.findAll({
    where: whereClause,
    include: [{ model: db.Vendor }, { model: db.ProcurementItem }],
  });

  // Group by vendor
  const vendorPerformance = {};
  procurements.forEach((proc) => {
    const vendorId = proc.vendorId;
    if (!vendorPerformance[vendorId]) {
      vendorPerformance[vendorId] = {
        vendor: proc.Vendor,
        totalOrders: 0,
        totalAmount: 0,
        onTimeDeliveries: 0,
        pendingOrders: 0,
        completedOrders: 0,
      };
    }

    const vp = vendorPerformance[vendorId];
    vp.totalOrders++;
    vp.totalAmount += parseFloat(proc.totalAmount) || 0;

    if (proc.status === "delivered") vp.completedOrders++;
    if (proc.status === "pending") vp.pendingOrders++;

    // Check on-time delivery (if expectedDelivery is set)
    if (proc.expectedDelivery && proc.status === "delivered") {
      // This would need actual delivery date to calculate properly
      vp.onTimeDeliveries++;
    }
  });

  return {
    data: Object.values(vendorPerformance),
    summary: {
      totalVendors: Object.keys(vendorPerformance).length,
      totalProcurements: procurements.length,
      totalAmount: procurements.reduce(
        (sum, proc) => sum + (parseFloat(proc.totalAmount) || 0),
        0
      ),
    },
  };
};

const getPaymentStatusReport = async (filters = {}) => {
  const { startDate, endDate, status, paymentMethod } = filters;

  const whereClause = {};
  if (status) whereClause.status = status;
  if (paymentMethod) whereClause.paymentMethod = paymentMethod;
  if (startDate && endDate) {
    whereClause.paymentDate = {
      [Op.between]: [startDate, endDate],
    };
  }

  const payments = await db.Payment.findAll({
    where: whereClause,
    include: [
      {
        model: db.Invoice,
        as: "invoice",
        include: [{ model: db.Procurement, as: "procurement" }],
      },
    ],
    order: [["paymentDate", "DESC"]],
  });

  const summary = {
    totalPayments: payments.length,
    totalAmount: payments.reduce(
      (sum, payment) => sum + (parseFloat(payment.amount) || 0),
      0
    ),
    byStatus: {},
    byMethod: {},
  };

  payments.forEach((payment) => {
    // Group by status
    const status = payment.status;
    if (!summary.byStatus[status]) {
      summary.byStatus[status] = { count: 0, amount: 0 };
    }
    summary.byStatus[status].count++;
    summary.byStatus[status].amount += parseFloat(payment.amount) || 0;

    // Group by payment method
    const method = payment.paymentMethod;
    if (!summary.byMethod[method]) {
      summary.byMethod[method] = { count: 0, amount: 0 };
    }
    summary.byMethod[method].count++;
    summary.byMethod[method].amount += parseFloat(payment.amount) || 0;
  });

  return {
    data: payments,
    summary,
  };
};

const getInvoiceAgingReport = async (filters = {}) => {
  const { vendorId, status } = filters;

  const whereClause = {};
  if (status) whereClause.status = status;

  const invoices = await db.Invoice.findAll({
    where: whereClause,
    include: [
      {
        model: db.Procurement,
        as: "procurement",
        include: [
          {
            model: db.Vendor,
            where: vendorId ? { id: vendorId } : {},
          },
        ],
      },
      { model: db.Payment, as: "payments" },
    ],
  });

  const currentDate = new Date();
  const agingData = invoices.map((invoice) => {
    const invoiceDate = new Date(invoice.invoiceDate);
    const daysOld = Math.floor(
      (currentDate - invoiceDate) / (1000 * 60 * 60 * 24)
    );

    const totalPaid = invoice.payments.reduce(
      (sum, payment) => sum + (parseFloat(payment.amount) || 0),
      0
    );
    const remainingAmount = parseFloat(invoice.amount) - totalPaid;

    let agingBucket = "0-30 days";
    if (daysOld > 90) agingBucket = "90+ days";
    else if (daysOld > 60) agingBucket = "60-90 days";
    else if (daysOld > 30) agingBucket = "30-60 days";

    return {
      invoice,
      daysOld,
      agingBucket,
      totalPaid,
      remainingAmount,
      isOverdue: daysOld > 30 && remainingAmount > 0,
    };
  });

  const summary = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.amount) || 0),
      0
    ),
    totalOutstanding: agingData.reduce(
      (sum, item) => sum + item.remainingAmount,
      0
    ),
    overdueAmount: agingData
      .filter((item) => item.isOverdue)
      .reduce((sum, item) => sum + item.remainingAmount, 0),
    agingBuckets: {},
  };

  // Calculate aging buckets
  agingData.forEach((item) => {
    const bucket = item.agingBucket;
    if (!summary.agingBuckets[bucket]) {
      summary.agingBuckets[bucket] = { count: 0, amount: 0 };
    }
    summary.agingBuckets[bucket].count++;
    summary.agingBuckets[bucket].amount += item.remainingAmount;
  });

  return {
    data: agingData,
    summary,
  };
};

// Operational Reports
const getSitePerformanceReport = async (filters = {}) => {
  const { startDate, endDate, siteId } = filters;

  const whereClause = {};
  if (siteId) whereClause.id = siteId;

  const sites = await db.Site.findAll({
    where: whereClause,
    include: [{ model: db.Machinery }, { model: db.User }],
  });

  const performanceData = [];

  for (const site of sites) {
    // Get requisitions for this site
    const requisitionWhere = { requestingSiteId: site.id };
    if (startDate && endDate) {
      requisitionWhere.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    const requisitions = await db.Requisition.findAll({
      where: requisitionWhere,
    });

    // Get material issues for this site
    const issueWhere = { siteId: site.id };
    if (startDate && endDate) {
      issueWhere.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    const materialIssues = await db.MaterialIssue.findAll({
      where: issueWhere,
    });

    // Get logbook entries for machines at this site
    const logbookWhere = { siteId: site.id };
    if (startDate && endDate) {
      logbookWhere.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    const logbookEntries = await db.LogbookEntry.findAll({
      where: logbookWhere,
    });

    performanceData.push({
      site,
      metrics: {
        totalMachines: site.Machineries.length,
        activeMachines: site.Machineries.filter((m) => m.status === "In Use")
          .length,
        totalUsers: site.Users.length,
        totalRequisitions: requisitions.length,
        pendingRequisitions: requisitions.filter((r) => r.status === "pending")
          .length,
        approvedRequisitions: requisitions.filter(
          (r) => r.status === "approved"
        ).length,
        totalMaterialIssues: materialIssues.length,
        totalLogbookEntries: logbookEntries.length,
        totalDieselConsumed: logbookEntries.reduce(
          (sum, entry) => sum + (entry.dieselIssue || 0),
          0
        ),
        totalKMRun: logbookEntries.reduce(
          (sum, entry) => sum + (entry.totalRunKM || 0),
          0
        ),
      },
    });
  }

  return {
    data: performanceData,
    summary: {
      totalSites: sites.length,
      totalMachines: performanceData.reduce(
        (sum, item) => sum + item.metrics.totalMachines,
        0
      ),
      totalUsers: performanceData.reduce(
        (sum, item) => sum + item.metrics.totalUsers,
        0
      ),
      totalRequisitions: performanceData.reduce(
        (sum, item) => sum + item.metrics.totalRequisitions,
        0
      ),
    },
  };
};

const getRequisitionAnalysisReport = async (filters = {}) => {
  const { startDate, endDate, siteId, status, priority } = filters;

  const whereClause = {};
  if (siteId) whereClause.requestingSiteId = siteId;
  if (status) whereClause.status = status;
  if (priority) whereClause.requestPriority = priority;
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [startDate, endDate],
    };
  }

  const requisitions = await db.Requisition.findAll({
    where: whereClause,
    include: [
      { model: db.Site, as: "requestingSite" },
      { model: db.User, as: "preparedBy" },
      { model: db.User, as: "approvedBy" },
      { model: db.RequisitionItem, as: "items" },
    ],
    order: [["createdAt", "DESC"]],
  });

  const summary = {
    totalRequisitions: requisitions.length,
    byStatus: {},
    byPriority: {},
    bySite: {},
    averageProcessingTime: 0,
    totalItems: 0,
  };

  // Continuing from where the service left off...

  requisitions.forEach((req) => {
    // Group by status
    const status = req.status;
    if (!summary.byStatus[status]) {
      summary.byStatus[status] = { count: 0, items: 0 };
    }
    summary.byStatus[status].count++;
    summary.byStatus[status].items += req.items.length;

    // Group by priority
    const priority = req.requestPriority;
    if (!summary.byPriority[priority]) {
      summary.byPriority[priority] = { count: 0, items: 0 };
    }
    summary.byPriority[priority].count++;
    summary.byPriority[priority].items += req.items.length;

    // Group by site
    const siteName = req.requestingSite?.name || "Unknown";
    if (!summary.bySite[siteName]) {
      summary.bySite[siteName] = { count: 0, items: 0 };
    }
    summary.bySite[siteName].count++;
    summary.bySite[siteName].items += req.items.length;

    // Calculate processing time for approved requisitions
    if (req.status === "approved" && req.approvedAt) {
      const processingTime = new Date(req.approvedAt) - new Date(req.createdAt);
      summary.averageProcessingTime += processingTime;
    }

    summary.totalItems += req.items.length;
  });

  // Calculate average processing time in days
  const approvedRequisitions = requisitions.filter(
    (r) => r.status === "approved" && r.approvedAt
  );
  if (approvedRequisitions.length > 0) {
    summary.averageProcessingTime =
      summary.averageProcessingTime /
      approvedRequisitions.length /
      (1000 * 60 * 60 * 24);
  }

  return {
    data: requisitions,
    summary,
  };
};

const getUserActivityReport = async (filters = {}) => {
  const { startDate, endDate, userId, siteId, activityType } = filters;

  const whereClause = {};
  if (userId) whereClause.userId = userId;
  if (siteId) whereClause.siteId = siteId;
  if (activityType) whereClause.activityType = activityType;
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [startDate, endDate],
    };
  }

  const activities = await db.UserActivity.findAll({
    where: whereClause,
    include: [
      { model: db.User, as: "user" },
      { model: db.Site, as: "site" },
    ],
    order: [["createdAt", "DESC"]],
  });

  const summary = {
    totalActivities: activities.length,
    uniqueUsers: [...new Set(activities.map((a) => a.userId))].length,
    byActivityType: {},
    bySite: {},
    byUser: {},
  };

  activities.forEach((activity) => {
    // Group by activity type
    const type = activity.activityType;
    if (!summary.byActivityType[type]) summary.byActivityType[type] = 0;
    summary.byActivityType[type]++;

    // Group by site
    const siteName = activity.site?.name || "Unknown";
    if (!summary.bySite[siteName]) summary.bySite[siteName] = 0;
    summary.bySite[siteName]++;

    // Group by user
    const userName = activity.user?.name || "Unknown";
    if (!summary.byUser[userName]) summary.byUser[userName] = 0;
    summary.byUser[userName]++;
  });

  return {
    data: activities,
    summary,
  };
};

const getAssetDepreciationReport = async (filters = {}) => {
  const { siteId, assetType, status } = filters;

  const whereClause = {};
  if (siteId) whereClause.siteId = siteId;
  if (assetType) whereClause.assetType = assetType;
  if (status) whereClause.status = status;

  const assets = await db.Machinery.findAll({
    where: whereClause,
    include: [{ model: db.Site, as: "site" }],
  });

  const currentDate = new Date();
  const depreciationData = assets.map((asset) => {
    const purchaseDate = new Date(asset.purchaseDate);
    const ageInYears =
      (currentDate - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
    const originalValue = parseFloat(asset.purchaseValue) || 0;

    // Simple straight-line depreciation (assuming 10-year life)
    const depreciationRate = 0.1; // 10% per year
    const depreciatedValue = Math.max(
      0,
      originalValue * (1 - depreciationRate * ageInYears)
    );
    const totalDepreciation = originalValue - depreciatedValue;

    return {
      asset,
      originalValue,
      currentValue: depreciatedValue,
      totalDepreciation,
      depreciationRate: depreciationRate * 100,
      ageInYears: Math.round(ageInYears * 100) / 100,
    };
  });

  const summary = {
    totalAssets: assets.length,
    totalOriginalValue: depreciationData.reduce(
      (sum, item) => sum + item.originalValue,
      0
    ),
    totalCurrentValue: depreciationData.reduce(
      (sum, item) => sum + item.currentValue,
      0
    ),
    totalDepreciation: depreciationData.reduce(
      (sum, item) => sum + item.totalDepreciation,
      0
    ),
    averageAge:
      depreciationData.length > 0
        ? depreciationData.reduce((sum, item) => sum + item.ageInYears, 0) /
          depreciationData.length
        : 0,
  };

  return {
    data: depreciationData,
    summary,
  };
};

const getMaintenanceCostAnalysis = async (filters = {}) => {
  const { startDate, endDate, siteId, machineId, maintenanceType } = filters;

  const whereClause = {};
  if (siteId) whereClause.siteId = siteId;
  if (machineId) whereClause.machineId = machineId;
  if (maintenanceType) whereClause.type = maintenanceType;
  if (startDate && endDate) {
    whereClause.date = {
      [Op.between]: [startDate, endDate],
    };
  }

  const maintenanceLogs = await db.MaintenanceLog.findAll({
    where: whereClause,
    include: [
      {
        model: db.Machinery,
        as: "machine",
        include: [{ model: db.Site, as: "site" }],
      },
    ],
    order: [["date", "DESC"]],
  });

  // Group by machine
  const costByMachine = {};
  maintenanceLogs.forEach((log) => {
    const machineId = log.machineId;
    if (!costByMachine[machineId]) {
      costByMachine[machineId] = {
        machine: log.machine,
        totalCost: 0,
        maintenanceCount: 0,
        lastMaintenance: null,
        avgCostPerMaintenance: 0,
        byType: {},
      };
    }

    const data = costByMachine[machineId];
    data.totalCost += parseFloat(log.cost) || 0;
    data.maintenanceCount++;

    if (
      !data.lastMaintenance ||
      new Date(log.date) > new Date(data.lastMaintenance)
    ) {
      data.lastMaintenance = log.date;
    }

    // Group by maintenance type
    const type = log.type;
    if (!data.byType[type]) {
      data.byType[type] = { count: 0, cost: 0 };
    }
    data.byType[type].count++;
    data.byType[type].cost += parseFloat(log.cost) || 0;
  });

  // Calculate averages
  Object.values(costByMachine).forEach((data) => {
    data.avgCostPerMaintenance =
      data.maintenanceCount > 0 ? data.totalCost / data.maintenanceCount : 0;
  });

  const summary = {
    totalMaintenanceRecords: maintenanceLogs.length,
    totalCost: maintenanceLogs.reduce(
      (sum, log) => sum + (parseFloat(log.cost) || 0),
      0
    ),
    averageCostPerMaintenance:
      maintenanceLogs.length > 0
        ? maintenanceLogs.reduce(
            (sum, log) => sum + (parseFloat(log.cost) || 0),
            0
          ) / maintenanceLogs.length
        : 0,
    machinesWithMaintenance: Object.keys(costByMachine).length,
    highestCostMachine: null,
    lowestCostMachine: null,
  };

  const machineData = Object.values(costByMachine);
  if (machineData.length > 0) {
    summary.highestCostMachine = machineData.reduce((max, curr) =>
      curr.totalCost > max.totalCost ? curr : max
    );
    summary.lowestCostMachine = machineData.reduce((min, curr) =>
      curr.totalCost < min.totalCost ? curr : min
    );
  }

  return {
    data: machineData,
    summary,
  };
};

const getFuelConsumptionReport = async (filters = {}) => {
  const { startDate, endDate, siteId, machineId } = filters;

  const whereClause = {};
  if (siteId) whereClause.siteId = siteId;
  if (machineId) whereClause.machineId = machineId;
  if (startDate && endDate) {
    whereClause.date = {
      [Op.between]: [startDate, endDate],
    };
  }

  const logbookEntries = await db.LogbookEntry.findAll({
    where: whereClause,
    include: [
      { model: db.Machinery, as: "machine" },
      { model: db.Site, as: "site" },
    ],
    order: [["date", "DESC"]],
  });

  // Group by machine
  const consumptionByMachine = {};
  logbookEntries.forEach((entry) => {
    const machineId = entry.machineId;
    if (!consumptionByMachine[machineId]) {
      consumptionByMachine[machineId] = {
        machine: entry.machine,
        totalFuelConsumed: 0,
        totalKMRun: 0,
        totalHoursRun: 0,
        entries: 0,
        avgFuelPerKM: 0,
        avgFuelPerHour: 0,
        efficiency: 0,
      };
    }

    const data = consumptionByMachine[machineId];
    data.totalFuelConsumed += entry.dieselIssue || 0;
    data.totalKMRun += entry.totalRunKM || 0;
    data.totalHoursRun += entry.totalRunHrsMeter || 0;
    data.entries++;
  });

  // Calculate averages and efficiency
  Object.values(consumptionByMachine).forEach((data) => {
    data.avgFuelPerKM =
      data.totalKMRun > 0 ? data.totalFuelConsumed / data.totalKMRun : 0;
    data.avgFuelPerHour =
      data.totalHoursRun > 0 ? data.totalFuelConsumed / data.totalHoursRun : 0;
    data.efficiency =
      data.totalFuelConsumed > 0 ? data.totalKMRun / data.totalFuelConsumed : 0;
  });

  const summary = {
    totalEntries: logbookEntries.length,
    totalFuelConsumed: logbookEntries.reduce(
      (sum, entry) => sum + (entry.dieselIssue || 0),
      0
    ),
    totalKMRun: logbookEntries.reduce(
      (sum, entry) => sum + (entry.totalRunKM || 0),
      0
    ),
    totalHoursRun: logbookEntries.reduce(
      (sum, entry) => sum + (entry.totalRunHrsMeter || 0),
      0
    ),
    averageEfficiency: 0,
    machinesTracked: Object.keys(consumptionByMachine).length,
  };

  const machineData = Object.values(consumptionByMachine);
  if (machineData.length > 0) {
    summary.averageEfficiency =
      machineData.reduce((sum, data) => sum + data.efficiency, 0) /
      machineData.length;
  }

  return {
    data: machineData,
    summary,
  };
};

const getVendorPerformanceReport = async (filters = {}) => {
  const { startDate, endDate, vendorId, status } = filters;

  const whereClause = {};
  if (vendorId) whereClause.vendorId = vendorId;
  if (status) whereClause.status = status;
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [startDate, endDate],
    };
  }

  const procurements = await db.Procurement.findAll({
    where: whereClause,
    include: [{ model: db.Vendor }, { model: db.ProcurementItem }],
  });

  // Group by vendor
  const vendorPerformance = {};
  procurements.forEach((procurement) => {
    const vendorId = procurement.vendorId;
    if (!vendorPerformance[vendorId]) {
      vendorPerformance[vendorId] = {
        vendor: procurement.Vendor,
        totalOrders: 0,
        totalValue: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        averageOrderValue: 0,
        onTimeDeliveryRate: 0,
        qualityScore: 0,
      };
    }

    const perf = vendorPerformance[vendorId];
    perf.totalOrders++;
    perf.totalValue += parseFloat(procurement.totalAmount) || 0;

    switch (procurement.status) {
      case "delivered":
        perf.completedOrders++;
        break;
      case "pending":
        perf.pendingOrders++;
        break;
      case "cancelled":
        perf.cancelledOrders++;
        break;
    }
  });

  // Calculate metrics
  Object.values(vendorPerformance).forEach((perf) => {
    perf.averageOrderValue =
      perf.totalOrders > 0 ? perf.totalValue / perf.totalOrders : 0;
    perf.onTimeDeliveryRate =
      perf.completedOrders > 0
        ? (perf.completedOrders / perf.totalOrders) * 100
        : 0;
    // Quality score could be calculated based on returns, complaints, etc.
    perf.qualityScore = Math.random() * 100; // Placeholder
  });

  const summary = {
    totalVendors: Object.keys(vendorPerformance).length,
    totalOrders: procurements.length,
    totalValue: procurements.reduce(
      (sum, p) => sum + (parseFloat(p.totalAmount) || 0),
      0
    ),
    topPerformer: null,
    averageOrderValue: 0,
  };

  const vendorData = Object.values(vendorPerformance);
  if (vendorData.length > 0) {
    summary.topPerformer = vendorData.reduce((max, curr) =>
      curr.onTimeDeliveryRate > max.onTimeDeliveryRate ? curr : max
    );
    summary.averageOrderValue = summary.totalValue / summary.totalOrders;
  }

  return {
    data: vendorData,
    summary,
  };
};

// Export all functions
module.exports = {
  // Machine Management Reports
  getMachineUtilization,
  getMachineMaintenanceReport,
  getMachineTransferReport,
  getMachineComplianceReport,
  getLogbookReport,

  // Inventory Management Reports
  getInventoryStockReport,
  getInventoryConsumptionReport,
  getInventoryTransferReport,
  getInventoryValuationReport,

  // Procurement & Financial Reports
  getProcurementSummaryReport,
  getProcurementVendorReport,
  getPaymentStatusReport,
  getInvoiceAgingReport,

  // Operational Reports
  getSitePerformanceReport,
  getRequisitionAnalysisReport,
  getUserActivityReport,

  // Additional Reports
  getAssetDepreciationReport,
  getMaintenanceCostAnalysis,
  getFuelConsumptionReport,
  getVendorPerformanceReport,
};
