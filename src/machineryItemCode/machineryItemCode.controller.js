const machineryItemCodeService = require("./machineryItemCode.service");

async function createMachineryItemCode(req, res) {
  const itemCode = await machineryItemCodeService.createMachineryItemCode(req.body);
  res.sendResponse(itemCode, "Machinery Item Code created successfully", 201);
}

async function getAllMachineryItemCodes(req, res) {
  const itemCodes = await machineryItemCodeService.getAllMachineryItemCodes();
  res.sendResponse(itemCodes, "Machinery Item Codes retrieved successfully");
}

async function getMachineryItemCodeById(req, res) {
  const itemCode = await machineryItemCodeService.getMachineryItemCodeById(req.params.id);
  if (!itemCode) {
    const error = new Error();
    error.message = "Machinery Item Code not found";
    error.name = "ResourceNotFoundError";
    error.statusCode = 404;
    throw error;
  }
  res.sendResponse(itemCode, "Machinery Item Code retrieved successfully");
}

async function updateMachineryItemCode(req, res) {
  const itemCode = await machineryItemCodeService.updateMachineryItemCode(req.params.id, req.body);
  res.sendResponse(itemCode, "Machinery Item Code updated successfully");
}

async function deleteMachineryItemCode(req, res) {
  await machineryItemCodeService.deleteMachineryItemCode(req.params.id);
  res.sendResponse(null, "Machinery Item Code deleted successfully");
}

async function restoreMachineryItemCode(req, res) {
  const itemCode = await machineryItemCodeService.restoreMachineryItemCode(req.params.id);
  res.sendResponse(itemCode, "Machinery Item Code restored successfully");
}

module.exports = {
  createMachineryItemCode,
  getAllMachineryItemCodes,
  getMachineryItemCodeById,
  updateMachineryItemCode,
  deleteMachineryItemCode,
  restoreMachineryItemCode,
};
