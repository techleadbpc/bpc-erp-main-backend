const { Op, Sequelize } = require("sequelize");
const db = require("./../../models");

const getOverview = async (filters = {}) => {
  const { siteId, dateRange } = filters;

  const whereClause = {};
  // if (siteId) whereClause.siteId = siteId;

  const dateFilter = {};
  if (dateRange?.startDate && dateRange?.endDate) {
    dateFilter.createdAt = {
      [Op.between]: [dateRange.startDate, dateRange.endDate],
    };
  }

  const [
    totalMachines,
    activeMachines,
    totalSites,
    activeSites,
    pendingRequisitions,
    pendingTransfers,
    lowStockItems,
    outstandingInvoices,
  ] = await Promise.all([
    db.Machinery.count({ where: whereClause }),
    db.Machinery.count({ where: { ...whereClause, status: "In Use" } }),
    db.Site.count({ where: whereClause }),
    db.Site.count({ where: { ...whereClause, status: "active" } }),
    db.Requisition.count({
      where: { ...whereClause, status: "pending", ...dateFilter },
    }),
    db.MachineTransfer.count({
      where: { ...whereClause, status: "Pending", ...dateFilter },
    }),
    db.SiteInventory.count({ where: { ...whereClause, status: "Low Stock" } }),
    db.Invoice.count({
      where: { status: { [Op.in]: ["SENT", "PARTIALLY_PAID"] }, ...dateFilter },
    }),
  ]);

  const machineStatusBreakdown = await db.Machinery.findAll({
    attributes: [
      "status",
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
    ],
    where: whereClause,
    group: ["status"],
  });

  return {
    totalMachines,
    activeMachines,
    totalSites,
    activeSites,
    pendingRequisitions,
    pendingTransfers,
    lowStockItems,
    outstandingInvoices,
    machineStatusBreakdown,
  };
};

const getAlerts = async (filters = {}) => {
  const { siteId, limit = 10 } = filters;
  const whereClause = {};
  // if (siteId) whereClause.siteId = siteId;

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [
    certificateExpiries,
    lowStockAlerts,
    pendingApprovals,
    maintenanceOverdue,
  ] = await Promise.all([
    db.Machinery.findAll({
      where: {
        ...whereClause,
        [Op.or]: [
          { fitnessCertificateExpiry: { [Op.lte]: thirtyDaysFromNow } },
          { insuranceExpiry: { [Op.lte]: thirtyDaysFromNow } },
          { pollutionCertificateExpiry: { [Op.lte]: thirtyDaysFromNow } },
          { permitExpiryDate: { [Op.lte]: thirtyDaysFromNow } },
        ],
      },
      attributes: [
        // Direct machine fields
        "id",
        "machineName",
        "registrationNumber",
        "erpCode",
        "siteId",
        "status",
        "model",
        "make",

        // Certificate expiry date fields
        "pollutionCertificateExpiry",
        "fitnessCertificateExpiry",
        "insuranceExpiry",
        "permitExpiryDate",
        "motorVehicleTaxDue",
      ],
      include: [{ model: db.Site, as: "site", attributes: ["name"] }],
      limit,
    }),
    db.SiteInventory.findAll({
      where: {
        ...whereClause,
        status: { [Op.in]: ["Low Stock", "Out of Stock"] },
      },
      include: [
        { model: db.Site, attributes: ["name"] },
        {
          model: db.Item,
          attributes: ["name", "shortName"],
          include: [{ model: db.Unit, attributes: ["name", "shortName"] }],
        },
      ],
      limit,
    }),
    db.Requisition.count({ where: { ...whereClause, status: "pending" } }),
    db.MaintenanceLog.count({
      where: { status: "scheduled", date: { [Op.lt]: new Date() } },
    }),
  ]);

  return {
    certificateExpiries,
    lowStockAlerts,
    pendingApprovals,
    maintenanceOverdue,
  };
};

const getRecentActivities = async (filters = {}) => {
  const { siteId, limit = 20 } = filters;
  const whereClause = {};
  // if (siteId) whereClause.siteId = siteId;

  const [recentRequisitions, recentTransfers, recentIssues, recentMaintenance] =
    await Promise.all([
      db.Requisition.findAll({
        where: whereClause,
        attributes: [
          "id",
          "requisitionNo",
          "requestedFor",
          "chargeType",
          "requestPriority",
          "dueDate",
          "status",
        ],
        include: [
          { model: db.Site, as: "requestingSite", attributes: ["name"] },
          { model: db.User, as: "preparedBy", attributes: ["name"] },
        ],
        order: [["createdAt", "DESC"]],
        limit: limit / 4,
      }),
      db.MachineTransfer.findAll({
        where: whereClause,
        attributes: [
          "id",
          "name",
          "destinationSiteId",
          "requestType",
          "status",
          "dispatchedAt",
          "transportDetails",
        ],
        include: [
          { model: db.Site, as: "currentSite", attributes: ["name"] },
          { model: db.Machinery, as: "machine", attributes: ["machineName"] },
        ],
        order: [["createdAt", "DESC"]],
        limit: limit / 4,
      }),
      db.MaterialIssue.findAll({
        where: whereClause,
        attributes: [
          "id",
          "issueNumber",
          "issueType",
          "otherSiteId",
          "issueDate",
          "status",
          "approvedAt",
        ],
        include: [{ model: db.Site, as: "fromSite", attributes: ["name"] }],
        order: [["createdAt", "DESC"]],
        limit: limit / 4,
      }),
      db.MaintenanceLog.findAll({
        where: whereClause,
        attributes: ["id", "type", "cost", "date", "status", "title"],
        include: [
          {
            model: db.Machinery,
            as: "machine",
            attributes: ["machineName", "id"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: limit / 4,
      }),
    ]);

  return {
    recentRequisitions,
    recentTransfers,
    recentIssues,
    recentMaintenance,
  };
};

const getMachineStatus = async (filters = {}) => {
  const { siteId, categoryId } = filters;
  const whereClause = {};
  // if (siteId) whereClause.siteId = siteId;
  // if (categoryId) whereClause.machineCategoryId = categoryId;

  const [statusBreakdown, siteWiseBreakdown, categoryWiseBreakdown] =
    await Promise.all([
      db.Machinery.findAll({
        attributes: [
          "status",
          [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        ],
        where: whereClause,
        group: ["status"],
      }),
      db.Machinery.findAll({
        attributes: [
          "siteId",
          "Machinery.status",
          [Sequelize.fn("COUNT", Sequelize.col("Machinery.id")), "count"],
        ],
        where: whereClause,
        include: [{ model: db.Site, as: "site", attributes: ["name"] }],
        group: ["siteId", "Machinery.status", "site.id", "site.name"],
      }),
      db.Machinery.findAll({
        attributes: [
          "machineCategoryId",
          "Machinery.status",
          [Sequelize.fn("COUNT", Sequelize.col("Machinery.id")), "count"],
        ],
        where: whereClause,
        include: [
          {
            model: db.MachineCategory,
            as: "machineCategory",
            attributes: ["name"],
          },
        ],
        group: [
          "machineCategoryId",
          "Machinery.status",
          "machineCategory.id",
          "machineCategory.name",
        ],
      }),
    ]);

  return {
    statusBreakdown,
    siteWiseBreakdown,
    categoryWiseBreakdown,
  };
};

const getSitesSummary = async (filters = {}) => {
  const { departmentId, limit, offset } = filters;
  const whereClause = {};
  if (departmentId) whereClause.departmentId = departmentId;

  // Optimize: Use subqueries to count related records instead of loading all objects
  const sites = await db.Site.findAll({
    where: whereClause,
    attributes: [
      "id",
      "name",
      "code",
      "status",
      "departmentId",
      [
        Sequelize.literal(`(
          SELECT COUNT(*)
          FROM machineries AS "machine"
          WHERE "machine"."siteId" = "Site"."id"
        )`),
        "totalMachines",
      ],
      [
        Sequelize.literal(`(
          SELECT COUNT(*)
          FROM machineries AS "machine"
          WHERE "machine"."siteId" = "Site"."id"
          AND "machine"."status" = 'In Use'
        )`),
        "activeMachines",
      ],
      [
        Sequelize.literal(`(
          SELECT COUNT(*)
          FROM users AS "user"
          WHERE "user"."siteId" = "Site"."id"
        )`),
        "totalUsers",
      ],
    ],
    include: [{ model: db.Department, attributes: ["name"] }],
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
  });

  const sitesSummary = sites.map((site) => ({
    id: site.id,
    name: site.name,
    code: site.code,
    status: site.status,
    department: site.Department?.name,
    totalMachines: parseInt(site.getDataValue("totalMachines") || 0),
    activeMachines: parseInt(site.getDataValue("activeMachines") || 0),
    totalUsers: parseInt(site.getDataValue("totalUsers") || 0),
  }));

  return sitesSummary;
};

const getInventoryAlerts = async (filters = {}) => {
  const { siteId, severity, limit = 20 } = filters;
  const whereClause = {};
  // if (siteId) whereClause.siteId = siteId;
  // if (severity) whereClause.status = severity;

  const alerts = await db.SiteInventory.findAll({
    where: {
      ...whereClause,
      status: { [Op.in]: ["Low Stock", "Out of Stock"] },
    },
    include: [
      { model: db.Site, attributes: ["name", "code"] },
      { model: db.Item, include: [{ model: db.Unit }] },
    ],
    order: [["quantity", "ASC"]],
    limit: parseInt(limit),
  });

  return alerts;
};

const getMaintenanceDue = async (filters = {}) => {
  const { siteId, days = 30, limit = 20 } = filters;
  const whereClause = {};
  // if (siteId) whereClause.siteId = siteId;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));

  const maintenanceDue = await db.MaintenanceLog.findAll({
    where: {
      status: "scheduled",
      date: { [Op.between]: [new Date(), futureDate] },
    },
    include: [
      {
        model: db.Machinery,
        as: "machine",
        where: whereClause,
        include: [{ model: db.Site, as: "site" }],
      },
    ],
    order: [["date", "ASC"]],
    limit: parseInt(limit),
  });

  return maintenanceDue;
};

const getProcurementPending = async (filters = {}) => {
  const { siteId, status = "pending", limit = 20 } = filters;
  const whereClause = { status };

  const procurements = await db.Procurement.findAll({
    // where: whereClause,
    include: [
      {
        model: db.Requisition,
        include: [
          {
            model: db.Site,
            as: "requestingSite",
            where: siteId ? { id: siteId } : {},
          },
        ],
      },
      { model: db.Vendor },
    ],
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit),
  });

  const totalValue = await db.Procurement.sum("totalAmount", {
    where: whereClause,
  });

  return {
    procurements,
    totalValue: totalValue || 0,
    count: procurements.length,
  };
};

const getPaymentsOutstanding = async (filters = {}) => {
  const { siteId, limit = 50, offset = 0 } = filters;
  const whereClause = { status: { [Op.in]: ["SENT", "PARTIALLY_PAID"] } };

  // Calculate total outstanding amount using DB aggregation to avoid fetching all invoices
  // We need to sum up invoice amounts and subtract paid amounts
  const invoicesForTotal = await db.Invoice.findAll({
    where: whereClause,
    attributes: ["id", "amount"],
    include: [
      {
        model: db.Procurement,
        as: "procurement",
        attributes: [],
        required: true,
        include: [
          {
            model: db.Requisition,
            attributes: [],
            required: true,
            include: [
              {
                model: db.Site,
                as: "requestingSite",
                attributes: [],
                where: siteId ? { id: siteId } : {},
                required: true,
              },
            ],
          },
        ],
      },
      {
        model: db.Payment,
        as: "payments",
        attributes: ["amount"],
      },
    ],
  });

  // Calculate total outstanding from the lighter query
  const totalOutstanding = invoicesForTotal.reduce((sum, invoice) => {
    const paidAmount =
      invoice.payments?.reduce(
        (pSum, payment) => pSum + parseFloat(payment.amount),
        0
      ) || 0;
    return sum + (parseFloat(invoice.amount) - paidAmount);
  }, 0);

  // Fetch paginated invoices for display
  const invoices = await db.Invoice.findAll({
    where: whereClause,
    include: [
      {
        model: db.Procurement,
        as: "procurement",
        include: [
          {
            model: db.Requisition,
            include: [
              {
                model: db.Site,
                as: "requestingSite",
                where: siteId ? { id: siteId } : {},
              },
            ],
          },
        ],
      },
      { model: db.Payment, as: "payments" },
    ],
    order: [["invoiceDate", "ASC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  return {
    invoices,
    totalOutstanding,
    count: invoices.length, // This is count of current page. If total count is needed, we need distinct count query.
  };
};

const getExpensesMonthly = async (filters = {}) => {
  const { siteId, months = 12 } = filters;
  const whereClause = {};
  // if (siteId) whereClause.siteId = siteId;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));

  const [procurementExpenses, maintenanceExpenses] = await Promise.all([
    db.Procurement.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("createdAt")),
          "month",
        ],
        [Sequelize.fn("SUM", Sequelize.col("totalAmount")), "totalAmount"],
      ],
      where: {
        createdAt: { [Op.gte]: startDate },
        status: { [Op.in]: ["delivered", "paid"] },
      },
      group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("createdAt"))],
      order: [
        [
          Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("createdAt")),
          "ASC",
        ],
      ],
    }),
    db.MaintenanceLog.findAll({
      attributes: [
        [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("date")), "month"],
        [Sequelize.fn("SUM", Sequelize.col("cost")), "totalCost"],
      ],
      where: {
        date: { [Op.gte]: startDate },
        status: "completed",
      },
      include: [
        {
          model: db.Machinery,
          as: "machine",
          where: whereClause,
          attributes: [],
        },
      ],
      group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("date"))],
      order: [
        [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("date")), "ASC"],
      ],
    }),
  ]);

  return {
    procurementExpenses,
    maintenanceExpenses,
  };
};

// ============================================
// CORE METRICS (SITE OVERVIEW)
// ============================================

const getSiteOverview = async (siteId, filters = {}) => {
  if (!siteId) {
    throw new Error("Site ID is required for site users");
  }

  const { dateRange } = filters;
  const dateFilter = {};
  if (dateRange?.startDate && dateRange?.endDate) {
    dateFilter.createdAt = {
      [Op.between]: [dateRange.startDate, dateRange.endDate],
    };
  }

  const [
    // Site Inventory Status
    totalInventoryItems,
    lowStockItems,
    outOfStockItems,
    // inventoryValue,

    // Site Machines
    totalMachines,
    activeMachines,
    machineStatusBreakdown,

    // Site Personnel
    totalUsers,
    activeUsers,
  ] = await Promise.all([
    // Total items in stock at their site
    db.SiteInventory.count({ where: { siteId } }),

    // Low stock items count
    db.SiteInventory.count({ where: { siteId, status: "Low Stock" } }),

    // Out of stock items count
    db.SiteInventory.count({ where: { siteId, status: "Out of Stock" } }),

    // Inventory value calculation
    // db.SiteInventory.findAll({
    //   attributes: [
    //     [
    //       Sequelize.fn(
    //         "SUM",
    //         Sequelize.literal(
    //           "quantity * (SELECT price FROM items WHERE items.id = SiteInventory.itemId)"
    //         )
    //       ),
    //       "totalValue",
    //     ],
    //   ],
    //   where: { siteId },
    //   raw: true,
    // }),

    // Total machines at their site
    db.Machinery.count({ where: { siteId } }),

    // Active machines count
    db.Machinery.count({ where: { siteId, status: "In Use" } }),

    // Machines by status breakdown
    db.Machinery.findAll({
      attributes: [
        "status",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      where: { siteId },
      group: ["status"],
    }),

    // Total users/employees at their site
    db.User.count({ where: { siteId } }),

    // Active users count
    db.User.count({ where: { siteId, status: "active" } }),
  ]);

  return {
    inventory: {
      totalItems: totalInventoryItems,
      lowStockItems,
      outOfStockItems,
      // totalValue: inventoryValue[0]?.totalValue || 0,
      totalValue: 0,
    },
    machines: {
      totalMachines,
      activeMachines,
      statusBreakdown: machineStatusBreakdown,
    },
    personnel: {
      totalUsers,
      activeUsers,
    },
  };
};

// ============================================
// OPERATIONAL ACTIVITIES
// ============================================

const getSiteRequisitions = async (siteId, filters = {}) => {
  if (!siteId) {
    throw new Error("Site ID is required for site users");
  }

  const { limit = 20, status } = filters;
  const whereClause = { requestingSiteId: siteId };
  if (status) whereClause.status = status;

  const [pendingRequisitions, recentRequisitions, requisitionStats] =
    await Promise.all([
      // Pending requisitions from their site
      db.Requisition.count({
        where: { requestingSiteId: siteId, status: "pending" },
      }),

      // Recent requisitions created by their site
      db.Requisition.findAll({
        where: whereClause,
        attributes: [
          "id",
          "requisitionNo",
          "requestedFor",
          "chargeType",
          "requestPriority",
          "dueDate",
          "status",
          "createdAt",
        ],
        include: [
          { model: db.User, as: "preparedBy", attributes: ["name"] },
          {
            model: db.RequisitionItem,
            as: "items",
            include: [{ model: db.Item, attributes: ["name", "shortName"] }],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit,
      }),

      // Requisition approval status stats
      db.Requisition.findAll({
        attributes: [
          "status",
          [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        ],
        where: { requestingSiteId: siteId },
        group: ["status"],
      }),
    ]);

  return {
    pendingCount: pendingRequisitions,
    recentRequisitions,
    statusBreakdown: requisitionStats,
  };
};

const getSiteMaterialIssues = async (siteId, filters = {}) => {
  if (!siteId) {
    throw new Error("Site ID is required for site users");
  }

  const { limit = 20, status } = filters;
  const whereClause = { siteId: siteId };
  if (status) whereClause.status = status;

  const [pendingIssues, recentIssues] = await Promise.all([
    // Pending material issues from their site
    db.MaterialIssue.count({
      where: { siteId: siteId, status: "pending" },
    }),

    // Recent material issues from their site
    db.MaterialIssue.findAll({
      where: whereClause,
      attributes: [
        "id",
        "issueNumber",
        "issueType",
        "otherSiteId",
        "issueDate",
        "status",
        "approvedAt",
      ],
      include: [
        { model: db.Site, as: "toSite", attributes: ["name"] },
        {
          model: db.MaterialIssueItem,
          as: "items",
          include: [{ model: db.Item, attributes: ["name", "shortName"] }],
        },
      ],
      // order: [["createdAt", "DESC"]],
      limit,
    }),
  ]);

  return {
    pendingCount: pendingIssues,
    recentIssues,
  };
};

const getSiteTransfers = async (siteId, filters = {}) => {
  if (!siteId) {
    throw new Error("Site ID is required for site users");
  }

  const { limit = 20, status } = filters;
  const whereClause = { currentSiteId: siteId };
  if (status) whereClause.status = status;

  const [pendingTransfers, recentTransfers, transferStats] = await Promise.all([
    // Pending outgoing transfers
    db.MachineTransfer.count({
      where: { currentSiteId: siteId, status: "Pending" },
    }),

    // Machine transfers initiated from their site
    db.MachineTransfer.findAll({
      where: whereClause,
      attributes: [
        "id",
        "name",
        "destinationSiteId",
        "requestType",
        "status",
        "dispatchedAt",
        "transportDetails",
        "createdAt",
      ],
      include: [
        { model: db.Site, as: "destinationSite", attributes: ["name"] },
        {
          model: db.Machinery,
          as: "machine",
          attributes: ["machineName", "registrationNumber"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
    }),

    // Transfer status tracking
    db.MachineTransfer.findAll({
      attributes: [
        "status",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      where: { currentSiteId: siteId },
      group: ["status"],
    }),
  ]);

  return {
    pendingCount: pendingTransfers,
    recentTransfers,
    statusBreakdown: transferStats,
  };
};

// ============================================
// ALERTS & NOTIFICATIONS
// ============================================

const getSiteInventoryAlerts = async (siteId, filters = {}) => {
  if (!siteId) {
    throw new Error("Site ID is required for site users");
  }

  const { limit = 20 } = filters;

  const [lowStockAlerts, outOfStockAlerts, approachingMinimumAlerts] =
    await Promise.all([
      // Low stock items at their site
      db.SiteInventory.findAll({
        where: { siteId, status: "Low Stock" },
        include: [
          {
            model: db.Item,
            attributes: ["name", "shortName"],
            include: [{ model: db.Unit, attributes: ["name", "shortName"] }],
          },
        ],
        order: [["quantity", "ASC"]],
        limit,
      }),

      // Out of stock items
      db.SiteInventory.findAll({
        where: { siteId, status: "Out of Stock" },
        include: [
          {
            model: db.Item,
            attributes: ["name", "shortName"],
            include: [{ model: db.Unit, attributes: ["name", "shortName"] }],
          },
        ],
        limit,
      }),

      // Items approaching minimum levels (quantity <= minimumLevel * 1.2)
      db.SiteInventory.findAll({
        where: {
          siteId,
          status: "In Stock",
          // [Op.and]: [
          //   Sequelize.where(
          //     Sequelize.col("quantity"),
          //     Op.lte,
          //     Sequelize.literal("minimumLevel * 1.2")
          //   ),
          // ],
        },
        include: [
          {
            model: db.Item,
            attributes: ["name", "shortName"],
            include: [{ model: db.Unit, attributes: ["name", "shortName"] }],
          },
        ],
        // order: [[Sequelize.literal("quantity / minimumLevel"), "ASC"]],
        limit,
      }),
    ]);

  return {
    lowStock: lowStockAlerts,
    outOfStock: outOfStockAlerts,
    approachingMinimum: approachingMinimumAlerts,
  };
};

const getSiteMachineAlerts = async (siteId, filters = {}) => {
  if (!siteId) {
    throw new Error("Site ID is required for site users");
  }

  const { days = 30, limit = 20 } = filters;
  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + parseInt(days));

  const [
    certificateExpiries,
    insuranceExpiries,
    permitExpiries,
    maintenanceOverdue,
  ] = await Promise.all([
    // Certificate expiries for machines at their site
    db.Machinery.findAll({
      where: {
        siteId,
        [Op.or]: [
          { fitnessCertificateExpiry: { [Op.lte]: alertDate } },
          { pollutionCertificateExpiry: { [Op.lte]: alertDate } },
        ],
      },
      attributes: [
        "id",
        "machineName",
        "registrationNumber",
        "erpCode",
        "status",
        "fitnessCertificateExpiry",
        "pollutionCertificateExpiry",
      ],
      order: [["fitnessCertificateExpiry", "ASC"]],
      limit,
    }),

    // Insurance expiries
    db.Machinery.findAll({
      where: {
        siteId,
        insuranceExpiry: { [Op.lte]: alertDate },
      },
      attributes: [
        "id",
        "machineName",
        "registrationNumber",
        "erpCode",
        "status",
        "insuranceExpiry",
      ],
      order: [["insuranceExpiry", "ASC"]],
      limit,
    }),

    // Permit expiries
    db.Machinery.findAll({
      where: {
        siteId,
        permitExpiryDate: { [Op.lte]: alertDate },
      },
      attributes: [
        "id",
        "machineName",
        "registrationNumber",
        "erpCode",
        "status",
        "permitExpiryDate",
      ],
      order: [["permitExpiryDate", "ASC"]],
      limit,
    }),

    // Maintenance overdue for their machines
    db.MaintenanceLog.findAll({
      where: {
        status: "scheduled",
        date: { [Op.lt]: new Date() },
      },
      include: [
        {
          model: db.Machinery,
          as: "machine",
          where: { siteId },
          attributes: ["id", "machineName", "registrationNumber", "erpCode"],
        },
      ],
      order: [["date", "ASC"]],
      limit,
    }),
  ]);

  return {
    certificateExpiries,
    insuranceExpiries,
    permitExpiries,
    maintenanceOverdue,
  };
};

const getSiteInventoryStatus = async (siteId, filters = {}) => {
  if (!siteId) {
    throw new Error("Site ID is required for site users");
  }

  const { categoryId: itemGroupId, limit = 50, offset = 0 } = filters;
  const whereClause = { siteId };

  const inventoryOverview = await db.SiteInventory.findAll({
    where: whereClause,
    include: [
      {
        model: db.Item,
        attributes: ["name", "shortName", "itemGroupId"],
        where: itemGroupId ? { itemGroupId } : {},
        include: [
          { model: db.Unit, attributes: ["name", "shortName"] },
          { model: db.ItemGroup, attributes: ["name"] },
        ],
      },
    ],
    order: [["quantity", "ASC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  // Group by status
  const statusBreakdown = await db.SiteInventory.findAll({
    attributes: [
      "status",
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      [Sequelize.fn("SUM", Sequelize.col("quantity")), "totalQuantity"],
    ],
    where: whereClause,
    group: ["status"],
  });

  return {
    inventoryOverview,
    statusBreakdown,
  };
};

const getSiteMachineStatus = async (siteId, filters = {}) => {
  if (!siteId) {
    throw new Error("Site ID is required for site users");
  }

  const { categoryId } = filters;
  const whereClause = { siteId };
  if (categoryId) whereClause.machineCategoryId = categoryId;

  const [statusBreakdown, categoryWiseBreakdown] = await Promise.all([
    // Machine status breakdown for this site
    db.Machinery.findAll({
      attributes: [
        "status",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      where: whereClause,
      group: ["status"],
    }),

    // Category-wise breakdown for machines at this site
    db.Machinery.findAll({
      attributes: [
        "machineCategoryId",
        "Machinery.status",
        [Sequelize.fn("COUNT", Sequelize.col("Machinery.id")), "count"],
      ],
      where: whereClause,
      include: [
        {
          model: db.MachineCategory,
          as: "machineCategory",
          attributes: ["name"],
        },
      ],
      group: [
        "machineCategoryId",
        "Machinery.status",
        "machineCategory.id",
        "machineCategory.name",
      ],
    }),
  ]);

  return {
    statusBreakdown,
    categoryWiseBreakdown,
  };
};

const getSiteExpenses = async (siteId, filters = {}) => {
  if (!siteId) {
    throw new Error("Site ID is required for site users");
  }

  const { months = 12 } = filters;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));

  const [procurementExpenses, maintenanceExpenses] = await Promise.all([
    // Procurement expenses for requisitions from this site
    db.Procurement.findAll({
      attributes: [
        [
          Sequelize.fn(
            "DATE_TRUNC",
            "month",
            Sequelize.col("Procurement.createdAt")
          ),
          "month",
        ],
        [Sequelize.fn("SUM", Sequelize.col("totalAmount")), "totalAmount"],
      ],
      where: {
        createdAt: { [Op.gte]: startDate },
        status: { [Op.in]: ["delivered", "paid"] },
      },
      include: [
        {
          model: db.Requisition,
          where: { requestingSiteId: siteId },
          attributes: [],
        },
      ],
      group: [
        Sequelize.fn(
          "DATE_TRUNC",
          "month",
          Sequelize.col("Procurement.createdAt")
        ),
      ],
      order: [
        [
          Sequelize.fn(
            "DATE_TRUNC",
            "month",
            Sequelize.col("Procurement.createdAt")
          ),
          "ASC",
        ],
      ],
    }),

    // Maintenance expenses for machines at this site
    db.MaintenanceLog.findAll({
      attributes: [
        [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("date")), "month"],
        [Sequelize.fn("SUM", Sequelize.col("cost")), "totalCost"],
      ],
      where: {
        date: { [Op.gte]: startDate },
        status: "completed",
      },
      include: [
        {
          model: db.Machinery,
          as: "machine",
          where: { siteId },
          attributes: [],
        },
      ],
      group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("date"))],
      order: [
        [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("date")), "ASC"],
      ],
    }),
  ]);

  return {
    procurementExpenses,
    maintenanceExpenses,
  };
};

const getSiteMaintenanceDue = async (siteId, filters = {}) => {
  if (!siteId) {
    throw new Error("Site ID is required for site users");
  }

  const { days = 30, limit = 20 } = filters;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));

  const maintenanceDue = await db.MaintenanceLog.findAll({
    where: {
      status: "scheduled",
      date: { [Op.between]: [new Date(), futureDate] },
    },
    include: [
      {
        model: db.Machinery,
        as: "machine",
        where: { siteId },
        attributes: ["id", "machineName", "registrationNumber", "erpCode"],
      },
    ],
    order: [["date", "ASC"]],
    limit: parseInt(limit),
  });

  return maintenanceDue;
};

const getSiteInfo = async (siteId) => {
  if (!siteId) {
    throw new Error("Site ID is required for site users");
  }

  const siteInfo = await db.Site.findByPk(siteId, {
    include: [{ model: db.Department, attributes: ["name"] }],
    attributes: [
      "id",
      "name",
      "code",
      "address",
      "pincode",
      "mobileNumber",
      "status",
      "type",
    ],
  });

  if (!siteInfo) {
    throw new Error("Site not found");
  }

  return siteInfo;
};

module.exports = {
  getOverview,
  getAlerts,
  getRecentActivities,
  getMachineStatus,
  getSitesSummary,
  getInventoryAlerts,
  getMaintenanceDue,
  getProcurementPending,
  getPaymentsOutstanding,
  getExpensesMonthly,

  getSiteOverview,
  getSiteRequisitions,
  getSiteMaterialIssues,
  getSiteTransfers,
  getSiteInventoryAlerts,
  getSiteMachineAlerts,
  getSiteMachineStatus,
  getSiteInventoryStatus,
  getSiteMaintenanceDue,
  getSiteExpenses,
  getSiteInfo,
};
