const machineryService = require("./machinery.service");

async function createMachinery(req, res) {
  const machineryData = { ...req.body, ...req.fileData };
  const machinery = await machineryService.createMachinery(machineryData);
  res.sendResponse(machinery, "Machinery created successfully", 201);
}

async function updateMachinery(req, res) {
  const machineryData = { ...req.body, ...req.fileData };
  const machinery = await machineryService.updateMachinery(
    req.params.id,
    machineryData
  );
  res.sendResponse(machinery, "Machinery updated successfully");
}
async function getAllMachinery(req, res) {
  const machineryList = await machineryService.getAllMachinery(
    req.user.siteId ?? req.query.siteId,
    req.query.searchQuery,
    req.query.activity
  );
  res.sendResponse(machineryList, "Machinery list retrieved successfully");
}

async function getMachineryById(req, res) {
  const machinery = await machineryService.getMachineryById(req.params.id);
  if (!machinery) {
    const error = new Error();
    error.message = "Machinery not found";
    error.name = "ResourceNotFoundError";
    error.statusCode = 404;
    throw error;
  }
  res.sendResponse(machinery, "Machinery retrieved successfully");
}
async function getMachineryLogEntries(req, res) {
  const machinery = await machineryService.getMachineryLogEntries(req.params.id);
  if (!machinery) {
    const error = new Error();
    error.message = "Machinery not found";
    error.name = "ResourceNotFoundError";
    error.statusCode = 404;
    throw error;
  }
  res.sendResponse(machinery, "Machinery retrieved successfully");
}

async function deleteMachinery(req, res) {
  await machineryService.deleteMachinery(req.params.id);
  res.sendResponse(null, "Machinery deleted successfully");
}

async function restoreMachinery(req, res) {
  const machinery = await machineryService.restoreMachinery(req.params.id);
  res.sendResponse(machinery, "Machinery restored successfully");
}

module.exports = {
  createMachinery,
  getAllMachinery,
  getMachineryById,
  updateMachinery,
  deleteMachinery,
  restoreMachinery,
  getMachineryLogEntries,
};
