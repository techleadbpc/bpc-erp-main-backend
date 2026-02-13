const itemService = require("./item.service");

const getAllItems = async (req, res) => {
  const items = await itemService.getAllItems();
  res.sendResponse(items, "All items fetched successfully");
};

const getItemById = async (req, res) => {
  const item = await itemService.getItemById(req.params.id);
  res.sendResponse(item, "Item fetched successfully");
};

const createItem = async (req, res) => {
  const item = await itemService.createItem(req.body);
  res.sendResponse(item, "Item created successfully");
};

const updateItem = async (req, res) => {
  const item = await itemService.updateItem(req.params.id, req.body);
  res.sendResponse(item, "Item updated successfully");
};

const deleteItem = async (req, res) => {
  await itemService.deleteItem(req.params.id);
  res.sendResponse(null, "Item deleted successfully");
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
