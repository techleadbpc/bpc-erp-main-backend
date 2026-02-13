const itemGroupService = require("./itemGroup.service");

const getAllItemGroups = async (req, res) => {
  const groups = await itemGroupService.getAllItemGroups();
  res.sendResponse(groups, "All item groups fetched successfully");
};

const getItemGroupById = async (req, res) => {
  const group = await itemGroupService.getItemGroupById(req.params.id);
  res.sendResponse(group, "Item group fetched successfully");
};

const createItemGroup = async (req, res) => {
  const group = await itemGroupService.createItemGroup(req.body);
  res.sendResponse(group, "Item group created successfully");
};

const updateItemGroup = async (req, res) => {
  const group = await itemGroupService.updateItemGroup(req.params.id, req.body);
  res.sendResponse(group, "Item group updated successfully");
};

const deleteItemGroup = async (req, res) => {
  await itemGroupService.deleteItemGroup(req.params.id);
  res.sendResponse(null, "Item group deleted successfully");
};

module.exports = {
  getAllItemGroups,
  getItemGroupById,
  createItemGroup,
  updateItemGroup,
  deleteItemGroup,
};
