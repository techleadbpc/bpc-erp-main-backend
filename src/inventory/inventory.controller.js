const inventoryService = require("./inventory.service");

const createInventory = async (req, res) => {
  const inventory = await inventoryService.createInventory(req.body);
  res.sendResponse(inventory, "Inventory created successfully");
};

const updateInventory = async (req, res) => {
  const inventory = await inventoryService.updateInventory(
    req.params.id,
    req.body
  );
  res.sendResponse(inventory, "Inventory updated successfully");
};

const deleteInventory = async (req, res) => {
  await inventoryService.deleteInventory(req.params.id);
  res.sendResponse(null, "Inventory deleted successfully");
};

const getInventoryById = async (req, res) => {
  const inventory = await inventoryService.getInventoryById(req.params.id);
  res.sendResponse(inventory, "Inventory fetched successfully");
};

const getAllInventories = async (req, res) => {
  const result = await inventoryService.getAggregatedInventoryForAdmin(
    req.user.siteId
  );
  return res.sendResponse(result, "Aggregated inventory for admin");
  if (req.user.siteId) {
  } else {
    const filters = { siteId: req.user.siteId };
    const inventories = await inventoryService.getAllInventories(filters);
    return res.sendResponse(inventories, "Inventories fetched successfully");
  }
};

const getInventoryDetailsByItemId = async (req, res) => {
  const { itemId } = req.params;
  const { siteId } = req.user;
  const inventoryDetails = await inventoryService.inventoryDetailsByItemId({
    itemId,
    siteId,
  });
  res.sendResponse(inventoryDetails, "Inventory details fetched successfully");
};

const getInventoryBySiteId = async (req, res) => {
  const inventory = await inventoryService.getInventoryBySiteId(
    req.params.siteId
  );
  res.sendResponse(inventory, "Inventory fetched successfully");
};

const getItemGroupsAndItemsBySiteId = async (req, res) => {
  const inventory = await inventoryService.getItemGroupsAndItemsBySiteId(
    req.params.siteId
  );
  res.sendResponse(inventory, "Inventory fetched successfully");
};

const getStockLogsByItem = async (req, res) => {
  const { itemId } = req.params;
  const { siteId } = req.user;
  const logs = await inventoryService.getStockLogsByItem(itemId, siteId);
  res.sendResponse(logs, "Stock logs fetched successfully");
};

const getStockStatusBulk = async (req, res) => {
  const siteId = req.query.siteId || req.user.siteId;
  const { itemIds } = req.query;
  const stockStatus = await inventoryService.getStockStatusBulk(
    siteId,
    itemIds.split(",")
  );
  res.sendResponse(stockStatus, "Stock status fetched successfully");
};

const getStockLogReference = async (req, res) => {
  const { sourceId, sourceType, itemId } = req.query;
  const logs = await inventoryService.getStockLogReference(sourceId, sourceType, itemId);
  res.sendResponse(logs, "Stock logs fetched successfully");
};

module.exports = {
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryById,
  getAllInventories,
  getInventoryDetailsByItemId,
  getInventoryBySiteId,
  getItemGroupsAndItemsBySiteId,
  getStockLogsByItem,
  getStockStatusBulk,
  getStockLogReference
};
