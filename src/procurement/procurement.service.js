const { sequelize } = require("../../models");
const { Op } = require("sequelize");
const db = require("../../models");

// Generate procurement number (e.g., PRC-2025-0001)
const generateProcurementNo = async () => {
  const count = await db.Procurement.count();
  return `PRC-${new Date().getTime()}-${(count + 1)
    .toString()
    .padStart(4, "0")}`;
};

const createProcurement = async (data) => {
  return await sequelize.transaction(async (t) => {
    // Step 1: Handle Vendor (existing or new)
    // const vendor = await handleVendor(data.vendor, t);

    // Step 2: Create Procurement
    const procurementNo = await generateProcurementNo();
    const procurement = await db.Procurement.create(
      {
        ...data,
        procurementNo,
        status: "ordered",
      },
      { transaction: t }
    );

    // Step 3: Create Procurement Items
    const procurementItems = await db.ProcurementItem.bulkCreate(
      data.items.map((item) => ({
        ...item,
        procurementId: procurement.id,
        amount: item.quantity * item.rate,
      })),
      { transaction: t }
    );

    // Step 4: Update Total Amount
    const totalAmount = procurementItems.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );
    await procurement.update({ totalAmount }, { transaction: t });

    return procurement;
  });
};

// Vendor Handler (separate function for clarity)
const handleVendor = async (vendorData, transaction) => {
  if (typeof vendorData === "number") {
    // Existing vendor (ID provided)
    const vendor = await db.Vendor.findByPk(vendorData, { transaction });
    if (!vendor) throw new Error("Vendor not found");
    return vendor;
  } else if (vendorData && typeof vendorData === "object") {
    // New vendor (details provided)
    return await db.Vendor.create(
      {
        name: vendorData.name,
        email: vendorData.email || null,
        contactPerson: vendorData.contactPerson || null,
        phone: vendorData.phone || null,
        address: vendorData.address || null,
      },
      { transaction }
    );
  } else {
    throw new Error("Invalid vendor data format");
  }
};
const getProcurementById = async (id) => {
  return await db.Procurement.findByPk(id, {
    include: [
      { model: db.Vendor },
      { model: db.Requisition },
      {
        model: db.ProcurementItem,
        include: {
          model: db.RequisitionItem,
          include: { model: db.Item, include: { model: db.Unit } },
        },
      },
      {
        model: db.Invoice,
        as: "invoices",
        include: [
          { model: db.Payment, as: "payments" },
          {
            model: db.InvoiceItem,
            as: "items",
            include: [
              {
                model: db.ProcurementItem,
                include: {
                  model: db.RequisitionItem,
                  include: { model: db.Item },
                },
              },
            ],
          },
        ],
      },
    ],
  });
};

const listProcurements = async (filters = {}) => {
  const { status, startDate, endDate, vendorId, page, limit } = filters;

  const where = {};
  if (status) where.status = status;
  if (vendorId) where.vendorId = vendorId;
  if (startDate && endDate) {
    where.createdAt = { [Op.between]: [startDate, endDate] };
  }
  // return await db.Procurement.findAndCountAll({
  return await db.Procurement.findAll({
    where,
    include: [
      { model: db.Vendor, attributes: ["name"] },
      { model: db.Requisition, attributes: ["requisitionNo"] },
      // {
      //   model: db.ProcurementItem,
      //   include: {
      //     model: db.RequisitionItem,
      //     include: { model: db.Item, include: { model: db.Unit } },
      //   },
      // },
    ],
    // limit,
    // offset: (page - 1) * limit,
    order: [["createdAt", "DESC"]],
  });
};

const updatePaymentStatus = async (id, paymentData) => {
  return await db.Procurement.update(
    {
      isPaid: paymentData.paymentStatus,
      paymentDate: paymentData.paymentStatus
        ? paymentData.paymentDate || new Date()
        : null,
    },
    { where: { id } }
  );
};

const getProcurementSummary = async () => {
  const [statusCounts, monthlySpending, topVendors] = await Promise.all([
    // Status distribution
    db.Procurement.count({
      group: ["status"],
      attributes: ["status", [db.sequelize.fn("COUNT", "id"), "count"]],
    }),

    // Monthly spending (last 6 months)
    db.Procurement.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date() - 180 * 24 * 60 * 60 * 1000), // 6 months
        },
      },
      attributes: [
        [
          db.sequelize.fn("DATE_TRUNC", "month", db.sequelize.col("createdAt")),
          "month",
        ],
        [db.sequelize.fn("SUM", db.sequelize.col("totalAmount")), "total"],
      ],
      group: ["month"],
      order: [["month", "ASC"]],
    }),

    // Top 5 vendors by spending
    db.Procurement.findAll({
      attributes: [
        [db.sequelize.col("Vendor.name"), "vendorName"],
        [db.sequelize.fn("SUM", db.sequelize.col("totalAmount")), "totalSpent"],
      ],
      include: [
        {
          model: db.Vendor,
          attributes: [],
        },
      ],
      group: ["Vendor.id"],
      order: [[db.sequelize.literal("totalSpent"), "DESC"]],
      limit: 5,
    }),
  ]);

  return {
    statusDistribution: statusCounts,
    monthlySpending,
    topVendors,
  };
};

const updateProcurementStatus = async (id, status, user) => {
  return await sequelize.transaction(async (t) => {
    const procurement = await db.Procurement.findByPk(id, {
      include: [
        {
          model: db.ProcurementItem,
          include: [db.RequisitionItem],
        },
        { model: db.Requisition },
      ],
      transaction: t,
    });

    // Process inventory based on the new status workflow
    if (status === "accepted_at_virtual_site") {
      // When items are accepted at virtual site, add them to virtual site inventory
      let virtualSite = await db.Site.findOne({
        where: { type: "virtual" },
        attributes: ["id"],
      });
      if (!virtualSite?.id) {
        const department = await db.Department.findOne({
          where: { name: "Mechanical" },
        });
        virtualSite = await db.Site.create({
          name: "Virtual",
          type: "virtual",
          departmentId: department.id,
          address: "NA",
        });
      }

      for (const item of procurement.ProcurementItems) {
        // Add items to virtual site inventory
        await updateInventory(
          {
            siteId: virtualSite.id, // Virtual site inventory
            itemId: item.RequisitionItem.itemId,
            change: item.quantity,
            type: "IN",
            sourceType: "Procurement",
            sourceId: id,
            userId: user.id, // Assuming you have auth
          },
          t
        );
      }
    } else if (status === "in_transit_to_requested_site") {
      // When items are sent to requested site, move from virtual site to requested site
      let virtualSite = await db.Site.findOne({
        where: { type: "virtual" },
        attributes: ["id"],
      });
      if (!virtualSite?.id) {
        const department = await db.Department.findOne({
          where: { name: "Mechanical" },
        });
        virtualSite = await db.Site.create({
          name: "Virtual",
          type: "virtual",
          departmentId: department.id,
          address: "NA",
        });
      }

      for (const item of procurement.ProcurementItems) {
        // Remove items from virtual site inventory
        await updateInventory(
          {
            siteId: virtualSite.id, // Virtual site inventory
            itemId: item.RequisitionItem.itemId,
            change: item.quantity,
            type: "OUT",
            sourceType: "Procurement",
            sourceId: id,
            userId: user.id,
          },
          t
        );

        // Add items to requested site inventory (temporarily, until final delivery)
        await updateInventory(
          {
            siteId: procurement.Requisition.requestingSiteId,
            itemId: item.RequisitionItem.itemId,
            change: item.quantity,
            type: "IN",
            sourceType: "Procurement",
            sourceId: id,
            userId: user.id,
          },
          t
        );
      }
    } else if (status === "delivered") {
      // When items are delivered, ensure they are properly in the requested site inventory
      // This could be the final acceptance at the requested site
      let virtualSite = await db.Site.findOne({
        where: { type: "virtual" },
        attributes: ["id"],
      });
      if (!virtualSite?.id) {
        const department = await db.Department.findOne({
          where: { name: "Mechanical" },
        });
        virtualSite = await db.Site.create({
          name: "Virtual",
          type: "virtual",
          departmentId: department.id,
          address: "NA",
        });
      }

      for (const item of procurement.ProcurementItems) {
        // Final confirmation - ensure items are properly tracked at requested site
        // This could be a reconciliation step to ensure inventory accuracy
        await updateInventory(
          {
            siteId: procurement.Requisition.requestingSiteId,
            itemId: item.RequisitionItem.itemId,
            change: item.quantity,
            type: "IN", // Confirming final delivery
            sourceType: "Requisition",
            sourceId: procurement.requisitionId,
            userId: user.id,
          },
          t
        );
      }
    }

    return await procurement.update({ status }, { transaction: t });
  });
};

// Helper function for inventory updates
const updateInventory = async (data, transaction) => {
  // Update SiteInventory
  const [inventory] = await db.SiteInventory.findOrCreate({
    where: {
      siteId: data.siteId,
      itemId: data.itemId,
    },
    defaults: { quantity: 0 },
    transaction,
  });

  const newQuantity =
    data.type === "IN"
      ? inventory.quantity + data.change
      : inventory.quantity - data.change;

  await inventory.update(
    {
      quantity: newQuantity,
      status: calculateStockStatus(newQuantity, inventory.minimumLevel),
    },
    { transaction }
  );

  // Create StockLog
  await db.StockLog.create(data, { transaction });
};

const calculateStockStatus = (quantity, minimumLevel) => {
  if (quantity <= 0) return "Out of Stock";
  if (quantity < minimumLevel) return "Low Stock";
  return "In Stock";
};

const getInventoryMovement = async (sourceId) => {
  const movement = await db.StockLog.findAll({
    where: { sourceId: sourceId, sourceType: "Procurement" },
    include: [db.Item, db.Site],
  });
  return movement;
};

const getRequisitionWithRemainingItems = async (id) => {
  const requisition = await db.Requisition.findByPk(id, {
    include: [
      {
        model: db.RequisitionItem,
        as: "items",
        include: [{ model: db.Item }],
      },
      {
        model: db.Procurement,
        as: "procurements",
        include: [
          {
            model: db.ProcurementItem,
            as: "items", // Assuming you have ProcurementItem model
          },
        ],
      },
      {
        model: db.MaterialIssue,
        as: "materialIssues",
        include: [
          {
            model: db.MaterialIssueItem,
            as: "items",
          },
        ],
      },
      { model: db.User, as: "preparedBy", attributes: ["id", "name", "email"] },
      {
        model: db.Site,
        as: "requestingSite",
        attributes: ["id", "name", "code"],
      },
    ],
  });

  if (!requisition) {
    return null;
  }

  // Maps to store quantities per item
  const procuredQuantities = new Map();
  const issuedQuantities = new Map();

  // Calculate total procured quantities per item
  requisition.procurements.forEach((procurement) => {
    if (procurement.items) {
      procurement.items.forEach((item) => {
        const currentQty = procuredQuantities.get(item.itemId) || 0;
        procuredQuantities.set(item.itemId, currentQty + item.quantity);
      });
    }
  });

  // Calculate total issued quantities per item
  requisition.materialIssues.forEach((materialIssue) => {
    if (materialIssue.items) {
      materialIssue.items.forEach((item) => {
        const currentQty = issuedQuantities.get(item.itemId) || 0;
        issuedQuantities.set(item.itemId, currentQty + item.quantity);
      });
    }
  });

  // Calculate remaining items with quantities > 0
  const remainingItems = [];

  requisition.items.forEach((item) => {
    const itemId = item.itemId;
    const originalQty = item.quantity;
    const procuredQty = procuredQuantities.get(itemId) || 0;
    const issuedQty = issuedQuantities.get(itemId) || 0;

    const remainingQty = originalQty - procuredQty - issuedQty;

    if (remainingQty > 0) {
      remainingItems.push({
        id: item.id,
        requisitionId: item.requisitionId,
        itemId: item.itemId,
        quantity: remainingQty,
        originalQuantity: originalQty,
        procuredQuantity: procuredQty,
        issuedQuantity: issuedQty,
        Item: item.Item,
      });
    }
  });

  // Return only necessary details
  return {
    id: requisition.id,
    requisitionNo: requisition.requisitionNo,
    requestedAt: requisition.requestedAt,
    requestingSiteId: requisition.requestingSiteId,
    requestedFor: requisition.requestedFor,
    chargeType: requisition.chargeType,
    requestPriority: requisition.requestPriority,
    dueDate: requisition.dueDate,
    status: requisition.status,
    preparedBy: requisition.preparedBy,
    requestingSite: requisition.requestingSite,
    items: remainingItems,
    // Optional: Include summary for reference
    summary: {
      totalItems: requisition.items.length,
      remainingItems: remainingItems.length,
      fullyFulfilledItems: requisition.items.length - remainingItems.length,
    },
  };
};

const deleteProcurement = async (id) => {
  return await sequelize.transaction(async (t) => {
    const procurement = await db.Procurement.findByPk(id, {
      include: [
        {
          model: db.ProcurementItem,
          include: [db.RequisitionItem],
        },
        { model: db.Requisition },
      ],
      transaction: t,
    });

    if (!procurement) {
      throw new Error("Procurement not found");
    }

    // If procurement status is "delivered", we need to reverse inventory changes
    if (procurement.status === "delivered") {
      let mainSite = await db.Site.findOne({
        where: { type: "virtual" },
        attributes: ["id"],
      });
      if (!mainSite?.id) {
        const department = await db.Department.findOne({
          where: { name: "Mechanical" },
        });
        mainSite = await db.Site.create({
          name: "Virtual",
          type: "virtual",
          departmentId: department.id,
          address: "NA",
        });
      }

      for (const item of procurement.ProcurementItems) {
        // 1. Remove from destination site (reverse the IN transaction)
        await updateInventory(
          {
            siteId: procurement.Requisition.requestingSiteId,
            itemId: item.RequisitionItem.itemId,
            change: item.quantity,
            type: "OUT", // Reverse the IN transaction
            sourceType: "Procurement",
            sourceId: id,
            userId: null, // No user for deletion
          },
          t
        );

        // 2. Remove from MAIN inventory (reverse the OUT transaction)
        await updateInventory(
          {
            siteId: mainSite.id, // Main inventory
            itemId: item.RequisitionItem.itemId,
            change: item.quantity,
            type: "IN", // Reverse the OUT transaction
            sourceType: "Procurement",
            sourceId: id,
            userId: null, // No user for deletion
          },
          t
        );

        // 3. Add back to main inventory (reverse the IN transaction)
        await updateInventory(
          {
            siteId: mainSite.id, // Main inventory
            itemId: item.RequisitionItem.itemId,
            change: item.quantity,
            type: "OUT", // Reverse the IN transaction
            sourceType: "Procurement",
            sourceId: id,
            userId: null, // No user for deletion
          },
          t
        );
      }
    }

    // Delete procurement items first (due to foreign key constraints)
    await db.ProcurementItem.destroy({
      where: { procurementId: id },
      transaction: t,
    });

    // Then delete the procurement itself
    await procurement.destroy({ transaction: t });

    return procurement;
  });
};

const createProcurementsFromComparison = async (comparisonId, userId, targetVendorId = null, selections = null) => {
  return await sequelize.transaction(async (t) => {
    // 1. Fetch the comparison with items and their rates
    const comparison = await db.QuotationComparison.findByPk(comparisonId, {
      include: [
        {
          model: db.QuotationComparisonItem,
          as: "items",
          include: [
            {
              model: db.QuotationComparisonRate,
              as: "rates",
            },
          ],
        },
      ],
      transaction: t,
    });

    if (!comparison) throw new Error("Comparison not found");
    if (comparison.status !== "approved" && comparison.status !== "locked") {
      throw new Error(
        "Comparison must be approved or locked before creating procurement"
      );
    }

    // 2. Group items by vendor
    const itemsByVendor = {};
    for (const item of comparison.items) {
      // Priority: 1. Passed selections map (as string or number key), 2. Database selectedVendorId
      const currentSelectionId = (selections && (selections[item.id] || selections[String(item.id)])) || item.selectedVendorId;

      if (!currentSelectionId) continue;

      // If targeting a specific vendor, only process items for that vendor
      if (targetVendorId && parseInt(currentSelectionId) !== parseInt(targetVendorId)) continue;

      if (!itemsByVendor[currentSelectionId]) {
        itemsByVendor[currentSelectionId] = [];
      }

      // Find the rate for this vendor
      const rateRecord = item.rates.find(
        (r) => r.vendorId === parseInt(currentSelectionId)
      );
      if (!rateRecord) continue;

      itemsByVendor[currentSelectionId].push({
        requisitionItemId: item.requisitionItemId,
        itemId: item.itemId,
        quantity: item.quantity,
        rate: rateRecord.rate,
        amount: rateRecord.amount,
      });
    }

    // 3. Create a procurement for each vendor
    const createdProcurements = [];
    for (const [vendorId, items] of Object.entries(itemsByVendor)) {
      const procurementNo = await generateProcurementNo();
      const procurement = await db.Procurement.create(
        {
          requisitionId: comparison.requisitionId,
          vendorId: parseInt(vendorId),
          status: "ordered",
          procurementNo,
          quotationComparisonId: comparison.id,
        },
        { transaction: t }
      );

      const procurementItems = await db.ProcurementItem.bulkCreate(
        items.map((item) => ({
          ...item,
          procurementId: procurement.id,
        })),
        { transaction: t }
      );

      const totalAmount = procurementItems.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );
      await procurement.update({ totalAmount }, { transaction: t });

      createdProcurements.push(procurement);
    }

    // 4. Lock the comparison if not already
    if (comparison.status !== "locked") {
      await comparison.update({ status: "locked" }, { transaction: t });
    }

    return createdProcurements;
  });
};

module.exports = {
  createProcurement,
  getProcurementById,
  updateProcurementStatus,
  listProcurements,
  updatePaymentStatus,
  getProcurementSummary,
  getInventoryMovement,
  getRequisitionWithRemainingItems,
  deleteProcurement,
  createProcurementsFromComparison,
};
