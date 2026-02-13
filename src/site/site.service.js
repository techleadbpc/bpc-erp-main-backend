const db = require("../../models");
const { Op, Sequelize, col, fn, literal } = require("sequelize");

const createSite = async (data) => {
  const site = await db.Site.create(data);
  return site;
};

const getAllSites = async (siteId, searchQuery) => {
  // If searchQuery is provided, filter sites by name or code
  if (searchQuery) {
    return await db.Site.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { name: { [db.Sequelize.Op.like]: `%${searchQuery}%` } },
          { code: { [db.Sequelize.Op.like]: `%${searchQuery}%` } },
          { address: { [db.Sequelize.Op.like]: `%${searchQuery}%` } },
        ],
      },
      include: [{ model: db.Department, attributes: ["id", "name"] }],
    });
  }
  return await db.Site.findAll({
    include: [{ model: db.Department, attributes: ["id", "name"] }],
  });
};

const getSiteById = async (id) => {
  const site = await db.Site.findByPk(id, {
    include: [
      { model: db.Department, attributes: ["id", "name"] },
      {
        model: db.Machinery,
        attributes: ["id", "machineName", "capacity", "ownerName", "ownerType"],
      },
    ],
  });
  if (!site) {
    throw new Error("Site not found.");
  }
  return site;
};

const getVirtualSite = async () => {
  const virtualSite = await db.Site.findOne({
    where: { type: "virtual" },
    include: [{ model: db.Department, attributes: ["id", "name"] }],
  });
  return virtualSite;
};

const updateSite = async (id, data) => {
  const site = await db.Site.findByPk(id);
  if (!site) {
    throw new Error("Site not found.");
  }
  return await site.update(data);
};

const deleteSite = async (id) => {
  const site = await db.Site.findByPk(id);
  if (!site) {
    throw new Error("Site not found.");
  }
  await site.destroy();
  return { message: "Site deleted successfully." };
};
const restoreSite = async (id) => {
  const site = await db.Site.findByPk(id, { paranoid: false }); // Include soft-deleted records
  if (!site) {
    throw new Error("Site not found.");
  }
  if (!site.deletedAt) {
    throw new Error("Site is not deleted.");
  }
  await site.restore(); // Restores the soft-deleted record
  return { message: "Site restored successfully." };
};

const getAllSitesV2 = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = "",
    sortBy = "name",
    sortOrder = "ASC",
    departmentId,
    status,
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {};

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { code: { [Op.iLike]: `%${search}%` } },
      { address: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (departmentId) whereClause.departmentId = departmentId;
  if (status) whereClause.status = status;

  const { count, rows: sites } = await db.Site.findAndCountAll({
    where: whereClause,
    include: [{ model: db.Department, attributes: ["id", "name"] }],
    order: [[sortBy, sortOrder]],
    offset,
    limit,
  });

  res.sendResponse({
    data: sites,
    totalCount: count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
  });
};

// Get inventory movement logs for a specific site (especially virtual site)

const getSiteInventoryMovement = async (siteId, filters = {}) => {
  const { startDate, endDate, itemType, page = 1, limit = 20 } = filters;

  const whereClause = { siteId };
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  // Define the common grouping attributes
  const groupAttributes = [
    "itemId",
    "sourceType",
    "sourceId",
    // We group by these so they appear in the result row
    col("Item.id"),
    col("Item.name"),
    col("Item.ItemGroup.id"),
    col("Item.ItemGroup.name"),
  ];

  // 1. Initial Aggregation Query (Modified Attributes)
  const { count, rows: groupedLogs } = await db.StockLog.findAndCountAll({
    where: whereClause,
    attributes: [
      // Select the grouping columns
      ...groupAttributes,
      // Sum the 'change' for 'IN' type movements
      [
        fn("SUM", literal("CASE WHEN type = 'IN' THEN change ELSE 0 END")),
        "totalIn",
      ],
      // Sum the 'change' for 'OUT' type movements
      [
        fn("SUM", literal("CASE WHEN type = 'OUT' THEN change ELSE 0 END")),
        "totalOut",
      ],

      // 🆕 NEW: Capture the earliest date of any IN movement
      [
        fn(
          "MIN",
          literal("CASE WHEN type = 'IN' THEN \"createdAt\" ELSE NULL END")
        ),
        "firstInDate",
      ],
      // 🆕 NEW: Capture the latest date of any IN movement
      [
        fn(
          "MAX",
          literal("CASE WHEN type = 'IN' THEN \"createdAt\" ELSE NULL END")
        ),
        "latestInDate",
      ],
      // 🆕 NEW: Capture the earliest date of any OUT movement
      [
        fn(
          "MIN",
          literal("CASE WHEN type = 'OUT' THEN \"createdAt\" ELSE NULL END")
        ),
        "firstOutDate",
      ],
      // 🆕 NEW: Capture the latest date of any OUT movement
      [
        fn(
          "MAX",
          literal("CASE WHEN type = 'OUT' THEN \"createdAt\" ELSE NULL END")
        ),
        "latestOutDate",
      ],
    ],
    include: [
      {
        model: db.Item,
        attributes: ["id", "name"], // Explicitly select attributes for Item
        include: [{ model: db.ItemGroup, attributes: ["id", "name"] }],
      },
    ],
    group: groupAttributes, // Apply grouping
    order: [
      // You can order by the latest date across all movements if needed
      [fn("MAX", col("createdAt")), "DESC"],
    ],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });

  // 2. Dynamic Formatting for each Grouped Row
  const formattedLogs = await Promise.all(
    groupedLogs.map(async (log) => {
      let reference = "";
      let sourceDescription = null;
      let destinationDescription = null;

      const logData = log.get({ plain: true }); // Get plain JSON data including aggregated fields

      // Fetch Requisition if needed (moved up for Procurement case to use it)
      let req = null;
      if (logData.sourceType === "Requisition") {
        req = await db.Requisition.findByPk(logData.sourceId, {
          include: [{ model: db.Site, as: "requestingSite" }],
        });
      }
      if (logData.sourceType === "Procurement" && !req) {
        req = await db.Procurement.findByPk(logData.sourceId, {
          include: [
            {
              model: db.Requisition,
              attributes: ["id", "requisitionNo"],
              include: [{ model: db.Site, as: "requestingSite" }],
            },
          ],
        });
      }

      // We now rely on the presence of totalIn/totalOut for conditional logic
      switch (logData.sourceType) {
        case "Issue":
        case "Consumption":
          const issue = await db.MaterialIssue.findByPk(logData.sourceId, {
            include: [
              { model: db.Site, as: "fromSite" },
              { model: db.Site, as: "toSite" },
            ],
          });
          if (issue) {
            if (issue.issueType === "Site Transfer") {
              sourceDescription = issue.fromSite?.name || "Unknown Site";
              destinationDescription = issue.toSite?.name || "Another Site";
              reference = `Transfer by ${issue.issueNumber}`;
            } else {
              // Other Issue types (e.g., consumption/adjustments based on issue)
              sourceDescription = issue.fromSite?.name || "-";
              destinationDescription = "Consumption";
              reference = `Issue by ${issue.issueNumber}`;
            }
          }
          break;

        case "Requisition":
          if (req) {
            sourceDescription = "Fulfilling Requisition (Current Site)";
            destinationDescription =
              req.requestingSite?.name || "Requesting Site";
            reference = `Requisition by ${req.requisitionNo}`;
          }
          break;

        case "Procurement":
          const po = await db.Procurement.findByPk(logData.sourceId);
          if (po) {
            // For Procurement, destination is usually the requesting site (which is the current site's name)
            // If the Procurement model directly links to the current site (siteId), use that name
            // Otherwise, Procurement may not have a requestingSite association, so we set it to 'Current Site'
            sourceDescription = "Supplier/External Source";
            destinationDescription =
              req?.requestingSite?.name || "Current Site (Receipt)";
            reference = `Procurement by ${po.procurementNo}`;
          }
          break;

        case "Dispatch":
          const dispatch = await db.Dispatch.findByPk(logData.sourceId, {
            include: [
              {
                model: db.Procurement,
                include: [{ model: db.Requisition, include: [{ model: db.Site, as: "requestingSite" }] }]
              }
            ]
          });

          if (dispatch && dispatch.Procurement) {
            const reqSiteName = dispatch.Procurement.Requisition?.requestingSite?.name || "Unknown Site";
            if (logData.type === 'OUT') {
              // Virtual Site Perspective
              sourceDescription = "Virtual Site";
              destinationDescription = reqSiteName;
            } else {
              // Requesting Site Perspective
              sourceDescription = "Virtual Site";
              destinationDescription = reqSiteName;
            }
            reference = `Dispatch for PO ${dispatch.Procurement.procurementNo} (${dispatch.vehicleNo || 'No Vehicle'})`;
          }
          break;

        default:
          reference = logData.sourceType || "Other";
          sourceDescription =
            logData.totalOut > 0 ? "Current Site" : "External Source";
          destinationDescription =
            logData.totalIn > 0 ? "Current Site" : "External Destination";
      }

      return {
        ...logData,
        reference,
        sourceDescription,
        destinationDescription,

        // 🆕 NEW: Expose the new date fields
        inDates: logData.firstInDate,
        outDates: logData.firstOutDate,
      };
    })
  );

  return {
    data: formattedLogs,
    totalCount: Array.isArray(count) ? count.length : count,
    totalPages: Math.ceil(
      (Array.isArray(count) ? count.length : count) / limit
    ),
    currentPage: parseInt(page),
  };
};
// Get summary statistics for a specific site (especially virtual site)
const getSiteSummaryStats = async (siteId) => {
  const [inMovements, outMovements, currentInventory] = await Promise.all([
    // Total IN movements
    db.StockLog.sum("change", {
      where: { siteId, type: "IN" },
    }),
    // Total OUT movements
    db.StockLog.sum("change", {
      where: { siteId, type: "OUT" },
    }),
    // Current inventory at site
    db.SiteInventory.sum("quantity", {
      where: { siteId },
    }),
  ]);

  const [inCount, outCount] = await Promise.all([
    db.StockLog.count({
      where: { siteId, type: "IN" },
    }),
    db.StockLog.count({
      where: { siteId, type: "OUT" },
    }),
  ]);

  return {
    totalIn: inMovements || 0,
    totalOut: outMovements || 0,
    currentInventory: currentInventory || 0,
    inTransactionCount: inCount || 0,
    outTransactionCount: outCount || 0,
    netMovement: (inMovements || 0) - (outMovements || 0),
  };
};

// Get discrepancy report for a site (items that don't match expected vs actual)
const getDiscrepancyReport = async (siteId) => {
  // Find stock logs that might have discrepancies
  // This looks for cases where items went IN to virtual site but didn't come OUT properly or vice versa
  const allLogs = await db.StockLog.findAll({
    where: { siteId },
    include: [{ model: db.Item }],
    order: [["createdAt", "ASC"]],
  });

  // Group by item and check for discrepancies
  const itemMovements = {};
  allLogs.forEach((log) => {
    if (!itemMovements[log.itemId]) {
      itemMovements[log.itemId] = {
        item: log.Item,
        inTotal: 0,
        outTotal: 0,
        net: 0,
      };
    }

    if (log.type === "IN") {
      itemMovements[log.itemId].inTotal += log.change;
      itemMovements[log.itemId].net += log.change;
    } else {
      itemMovements[log.itemId].outTotal += log.change;
      itemMovements[log.itemId].net -= log.change;
    }
  });

  // Filter items with discrepancies (non-zero net at virtual site)
  const discrepancies = Object.values(itemMovements).filter(
    (item) => item.net !== 0
  );

  return discrepancies;
};

// Get procurement summary for virtual site
const getVirtualSiteProcurementSummary = async () => {
  const virtualSite = await getVirtualSite();
  if (!virtualSite) {
    throw new Error("Virtual site not found");
  }

  // 1. Fetch IN movements (Accepted Procurements)
  const inMovements = await db.StockLog.findAll({
    where: {
      siteId: virtualSite.id,
      type: "IN",
      sourceType: "Procurement",
    },
    include: [{ model: db.Item }],
    order: [["createdAt", "DESC"]],
  });

  // Group movements by procurement source ID
  const procurementMap = {};
  const orderedProcurementIds = []; // 🆕 Maintain order based on latest movement

  inMovements.forEach((log) => {
    if (!procurementMap[log.sourceId]) {
      procurementMap[log.sourceId] = {
        procurementId: log.sourceId,
        items: [],
        totalIn: 0,
        totalOut: 0,
        dispatchedItems: {}, // itemId -> quantity
      };
      orderedProcurementIds.push(log.sourceId); // 🆕 Add to ordered list
    }
    procurementMap[log.sourceId].items.push({
      item: log.Item,
      change: log.change,
      type: log.type,
      createdAt: log.createdAt,
    });
    procurementMap[log.sourceId].totalIn += log.change;
  });

  // Fetch Procurement details (procurementNo, Requisition, Requesting Site) AND Dispatches
  if (orderedProcurementIds.length > 0) {
    const procurements = await db.Procurement.findAll({
      where: { id: orderedProcurementIds },
      attributes: ["id", "procurementNo", "createdAt"],
      include: [
        {
          model: db.Requisition,
          attributes: ["id", "requisitionNo"],
          include: [{ model: db.Site, as: "requestingSite", attributes: ["id", "name"] }],
        },
        {
          model: db.Dispatch,
          include: [{ model: db.DispatchItem, as: "items" }],
        },
      ],
    });

    procurements.forEach((proc) => {
      if (procurementMap[proc.id]) {
        procurementMap[proc.id].procurementNo = proc.procurementNo;
        procurementMap[proc.id].procurementDate = proc.createdAt;
        procurementMap[proc.id].requisitionNo = proc.Requisition?.requisitionNo || "N/A";
        procurementMap[proc.id].destinationSite = proc.Requisition?.requestingSite?.name || "Unknown";

        // Calculate total dispatched per item
        if (proc.Dispatches) {
          proc.Dispatches.forEach((dispatch) => {
            if (dispatch.items) {
              dispatch.items.forEach((dItem) => {
                if (!procurementMap[proc.id].dispatchedItems[dItem.itemId]) {
                  procurementMap[proc.id].dispatchedItems[dItem.itemId] = 0;
                }
                procurementMap[proc.id].dispatchedItems[dItem.itemId] += dItem.quantity;
                procurementMap[proc.id].totalOut += dItem.quantity;
              });
            }
          });
        }
      }
    });
  }

  return {
    virtualSiteId: virtualSite.id,
    virtualSiteName: virtualSite.name,
    procurementMovements: orderedProcurementIds.map(id => procurementMap[id]), // 🆕 Return in captured order
    summary: {
      totalIn: inMovements.reduce((sum, log) => sum + log.change, 0),
      totalOut: Object.values(procurementMap).reduce((sum, p) => sum + p.totalOut, 0),
      activeProcurements: orderedProcurementIds.length,
    },
  };
};

const dispatchProcurementItems = async (data) => {
  const { procurementId, items, vehicleNo, driverName, remarks } = data; // items: [{ itemId, quantity }]

  const transaction = await db.sequelize.transaction();
  try {
    const virtualSite = await getVirtualSite();
    if (!virtualSite) throw new Error("Virtual site not found");

    const procurement = await db.Procurement.findByPk(procurementId, {
      include: [
        {
          model: db.Requisition,
          include: [{ model: db.Site, as: "requestingSite" }],
        },
      ],
      transaction,
    });

    if (!procurement) throw new Error("Procurement not found");

    const requestingSite = procurement.Requisition?.requestingSite;
    if (!requestingSite) throw new Error("Requesting site not found for this procurement");

    // 1. Create Dispatch Record
    const dispatch = await db.Dispatch.create({
      vehicleNo,
      driverName,
      remarks,
      procurementId: procurement.id,
      fromSiteId: virtualSite.id,
      toSiteId: requestingSite.id
    }, { transaction });

    for (const item of items) {
      // 2. Check Virtual Site Inventory
      const virtualInventory = await db.SiteInventory.findOne({
        where: { siteId: virtualSite.id, itemId: item.itemId },
        transaction,
      });

      if (!virtualInventory || virtualInventory.quantity < item.quantity) {
        throw new Error(`Insufficient stock for item ID ${item.itemId} in Virtual Site`);
      }

      // 3. Create Dispatch Item Record
      await db.DispatchItem.create({
        dispatchId: dispatch.id,
        itemId: item.itemId,
        quantity: item.quantity
      }, { transaction });

      // 4. Update Virtual Site Inventory (deduct quantity)
      await virtualInventory.decrement("quantity", { by: item.quantity, transaction });

      // 5. Log OUT from Virtual Site
      await db.StockLog.create(
        {
          siteId: virtualSite.id,
          itemId: item.itemId,
          change: item.quantity,
          type: "OUT",
          sourceType: "Dispatch",
          sourceId: dispatch.id, // Link to Dispatch record
          userId: null,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return { message: "Items dispatched successfully", dispatchId: dispatch.id };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getIncomingDispatches = async (siteId) => {

  return await db.Dispatch.findAll({
    where: {
      toSiteId: siteId,
      status: "dispatched",
    },
    include: [
      {
        model: db.DispatchItem,
        as: "items",
        include: [
          {
            model: db.Item,
            attributes: ["id", "name", "partNumber"],
            include: [{ model: db.Unit, attributes: ["name", "shortName"] }],
          },
        ],
      },
      {
        model: db.Procurement,
        attributes: ["procurementNo"],
      },
      {
        model: db.Site,
        as: "fromSite",
        attributes: ["name"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

const receiveDispatch = async (siteId, dispatchId) => {
  const transaction = await db.sequelize.transaction();
  try {
    const dispatch = await db.Dispatch.findOne({
      where: { id: dispatchId, toSiteId: siteId, status: "dispatched" },
      include: [{ model: db.DispatchItem, as: "items" }],
      transaction,
    });

    if (!dispatch) {
      throw new Error("Dispatch not found or already received");
    }

    for (const dItem of dispatch.items) {
      // 1. Add to Site Inventory
      const [inventory, created] = await db.SiteInventory.findOrCreate({
        where: { siteId: siteId, itemId: dItem.itemId },
        defaults: { quantity: 0 },
        transaction,
      });

      await inventory.increment("quantity", { by: dItem.quantity, transaction });

      // 2. Log IN to Site
      await db.StockLog.create(
        {
          siteId: siteId,
          itemId: dItem.itemId,
          change: dItem.quantity,
          type: "IN",
          sourceType: "Dispatch",
          sourceId: dispatch.id,
          userId: null, // Could capture user ID if available in context
        },
        { transaction }
      );
    }

    // 3. Update Dispatch Status
    await dispatch.update({ status: "received" }, { transaction });

    await transaction.commit();
    return { message: "Dispatch received successfully" };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createSite,
  getAllSites,
  getSiteById,
  getVirtualSite,
  updateSite,
  deleteSite,
  restoreSite,
  getAllSitesV2,
  getSiteInventoryMovement,
  getSiteSummaryStats,
  getDiscrepancyReport,
  getVirtualSiteProcurementSummary,
  dispatchProcurementItems,
  getIncomingDispatches,
  receiveDispatch,
};
