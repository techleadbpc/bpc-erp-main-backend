const db = require("./../../models");
const { Sequelize } = require("sequelize");

const createInventory = async (data) => {
  const { siteId, itemId } = data;
  const existing = await db.SiteInventory.findOne({
    where: { siteId, itemId },
  });
  if (existing) {
    //increase the quantity if inventory already exists
    existing.quantity += data.quantity;
    await existing.save();
    //Update StockLog
    // await db.StockLog.create({
    //   itemId,
    //   siteId,
    //   change: data.quantity,
    //   type: "Increase",
    //   sourceType: "Inventory",
    //   sourceId: existing.id, // Assuming you want to link the log to the inventory
    // });
    return existing;
  }
  const newInventory = await db.SiteInventory.create(data);
  //Update StockLog
  // await db.StockLog.create({
  //   itemId: newInventory.itemId,
  //   siteId: newInventory.siteId,
  //   change: newInventory.quantity,
  //   type: "Adjustment",
  //   sourceType: "Inventory",
  //   sourceId: newInventory.id,
  // });
  return newInventory;
};

const updateInventory = async (id, data) => {
  const inventory = await db.SiteInventory.findByPk(id);
  if (!inventory) throw new Error("Inventory not found");
  return await inventory.update(data);
};

const deleteInventory = async (id) => {
  const inventory = await db.SiteInventory.findByPk(id);
  if (!inventory) throw new Error("Inventory not found");
  return await inventory.destroy();
};

const getInventoryById = async (id) => {
  return await db.SiteInventory.findByPk(id, {
    include: [
      { model: db.Site },
      { model: db.Item, include: [db.Unit, db.ItemGroup] },
    ],
  });
};

const getAllInventories = async () => {
  return await db.SiteInventory.findAll({
    include: [
      { model: db.Site },
      { model: db.Item, include: [db.Unit, db.ItemGroup] },
    ],
  });
};

const getAggregatedInventoryForAdmin = async (siteId) => {
  const where = {};
  if (siteId) {
    where.siteId = siteId;
  }
  const results = await db.SiteInventory.findAll({
    where,
    attributes: [
      "itemId",
      [Sequelize.fn("SUM", Sequelize.col("quantity")), "totalQuantity"],
      [Sequelize.fn("SUM", Sequelize.col("lockedQuantity")), "totalLockedQuantity"],
    ],
    include: [
      {
        model: db.Item,
        attributes: ["name", "partNumber", "hsnCode"],
        include: [
          { model: db.Unit, attributes: ["name"] },
          { model: db.ItemGroup, attributes: ["name"] },
        ],
      },
    ],
    group: ["itemId", "Item.id", "Item->Unit.id", "Item->ItemGroup.id"],
  });

  // return results.map((record) => ({
  //   itemId: record.itemId,
  //   itemName: record.Item.name,
  //   totalQuantity: parseFloat(record.get("totalQuantity")),
  //   unit: record.Item.Unit.name,
  //   itemGroup: record.Item.ItemGroup.name
  // }));

  return results;
};

async function inventoryDetailsByItemId(params) {
  const { itemId } = params;
  const where = { itemId };
  if (params.siteId) {
    where["siteId"] = params.siteId;
  }
  return await db.SiteInventory.findAll({
    where,
    include: [
      { model: db.Site },
      { model: db.Item, include: [db.Unit, db.ItemGroup] },
    ],
  });
}

async function getInventoryBySiteId(siteId) {
  return await db.SiteInventory.findAll({
    where: { siteId },
    include: [{ model: db.Item, include: [db.Unit, db.ItemGroup] }],
  });
}

// Find list of Item groups and items of a site invenotry
async function getItemGroupsAndItemsBySiteId(siteId) {
  return await db.ItemGroup.findAll({
    include: [
      {
        model: db.Item,
        required: true,
        include: [
          {
            model: db.Unit,
          },
          {
            model: db.SiteInventory,
            required: true,
            where: { siteId }, // filter by siteId
            attributes: ["quantity"], // optional: don't fetch inventory details if not needed
          },
        ],
      },
    ],
  });
}

const getStockLogsByItem = async (itemId, siteId) => {
  const where = { itemId };
  if (siteId) {
    where.siteId = siteId;
  }
  const logs = await db.StockLog.findAll({
    where: where,
    include: [
      {
        model: db.Site,
        attributes: ["id", "name"],
      },
      {
        model: db.User,
        attributes: ["id", "name"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  // Format reference dynamically
  const formattedLogs = await Promise.all(
    logs.map(async (log) => {
      let reference = "";

      switch (log.sourceType) {
        case "Issue":
          const issue = await db.MaterialIssue.findByPk(log.sourceId);
          if (issue) {
            if (issue.issueType === "Site Transfer") {
              const toSite = await db.Site.findByPk(issue.otherSiteId);
              reference = `Transfer to ${toSite?.name || "another site"}`;
            } else {
              reference = `by ${issue.issueNumber}`;
            }
          }
          break;

        case "Requisition":
          const req = await db.Requisition.findByPk(log.sourceId);
          if (req) reference = `by ${req.requisitionNo}`;
          break;

        case "Procurement":
          const po = await db.Procurement.findByPk(log.sourceId);
          if (po) reference = `By ${po.procurementNo}`;
          break;

        default:
          reference = log.sourceType || "-";
      }

      return {
        dateTime: log.createdAt,
        type: log.type,
        quantity: log.change,
        site: log.Site?.name || "-",
        reference,
        sourceType: log.sourceType,
        itemId: log.itemId,
        sourceId: log.sourceId,
        user: log.User?.name || "-",
      };
    })
  );

  return formattedLogs;
};

const getStockStatusBulk = async (siteId, itemIds) => {
  const inventories = await db.SiteInventory.findAll({
    where: { siteId, itemId: itemIds.map((id) => parseInt(id)) },
  });

  // Process and return the stock status
  return inventories.map((inventory) => {
    const availableQuantity = inventory.quantity - (inventory.lockedQuantity || 0);
    return {
      itemId: inventory.itemId,
      quantity: inventory.quantity,
      lockedQuantity: inventory.lockedQuantity || 0,
      availableQuantity: availableQuantity,
      status: availableQuantity > 0 ? "In Stock" : "Out of Stock",
    };
  });
};

const getStockLogReference = async (sourceId, sourceType, itemId) => {
  switch (sourceType) {
    case "Issue":

      const issueItem = await db.MaterialIssueItem.findOne({
        where: { materialIssueId: sourceId, itemId },
        include: [
          {
            model: db.MaterialIssue,
            attributes: ["issueNumber", "issueType", "otherSiteId"],
          },
          {
            model: db.Machinery,
            as: "machine",
            attributes: ["machineName", "registrationNumber"],
          },
          {
            model: db.Site,
            attributes: ["name"],
            as: "fromSite"
          },
          {
            model: db.Site,
            attributes: ["name"],
            as: "toSite"
          },
        ],
      });
      if (issueItem) return { issueItem, machinery: issueItem.Machinery };
      break;

    case "Requisition":
      const reqItem = await db.RequisitionItem.findOne({ where: { requisitionId: sourceId, itemId } });
      if (reqItem) return { reqItem };
      break;

    case "Procurement":
      const poItem = await db.ProcurementItem.findOne({
        where: {
          procurementId: sourceId,
          itemId
        },
        include: [{
          model: db.Procurement,
          attributes: ['procurementNo'] // Select the specific column here
        }],
        raw: true,
        nest: true // This keeps the object structure clean
      });

      if (poItem) return { poItem };
      break;

    default:
      return sourceType || "-";
  }
};

module.exports = {
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryById,
  getAllInventories,
  getAggregatedInventoryForAdmin,
  inventoryDetailsByItemId,
  getInventoryBySiteId,
  getItemGroupsAndItemsBySiteId,
  getStockLogsByItem,
  getStockStatusBulk,
  getStockLogReference
};
