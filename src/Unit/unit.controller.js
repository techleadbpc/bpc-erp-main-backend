const unitService = require("./unit.service");

const getAllUnits = async (req, res) => {
  const units = await unitService.getAllUnits();
  res.sendResponse(units, "All units fetched successfully");
};

const getAllUnitsV2 = async (req, res) => {
  const { page, limit, orderBy, orderDirection, search } = req.query
  const units = await unitService.getAllUnitsV2(page, limit, orderBy, orderDirection, search);
  res.sendResponse(units, "All units fetched successfully");
};

const getUnitById = async (req, res) => {
  const unit = await unitService.getUnitById(req.params.id);
  res.sendResponse(unit, "Unit fetched successfully");
};

const createUnit = async (req, res) => {
  const unit = await unitService.createUnit(req.body);
  res.sendResponse(unit, "Unit created successfully");
};

const updateUnit = async (req, res) => {
  const unit = await unitService.updateUnit(req.params.id, req.body);
  res.sendResponse(unit, "Unit updated successfully");
};

const deleteUnit = async (req, res) => {
  await unitService.deleteUnit(req.params.id);
  res.sendResponse(null, "Unit deleted successfully");
};

module.exports = {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
};
