const procurementService = require("./procurement.service");

const createProcurement = async (req, res) => {
  const procurement = await procurementService.createProcurement(req.body);
  res.sendResponse(procurement, "Procurement created successfully");
};

const getProcurement = async (req, res) => {
  const procurement = await procurementService.getProcurementById(
    req.params.id
  );
  res.sendResponse(procurement);
};

const updateStatus = async (req, res) => {
  await procurementService.updateProcurementStatus(
    req.params.id,
    req.body.status,
    req.user
  );
  res.sendResponse(null, "Procurement status updated");
};

const listProcurements = async (req, res) => {
  const procurements = await procurementService.listProcurements(req.query);
  res.sendResponse(procurements);
};

const updatePayment = async (req, res) => {
  await procurementService.updatePaymentStatus(req.params.id, req.body);
  res.sendResponse(null, "Payment status updated");
};

const getSummary = async (req, res) => {
  const summary = await procurementService.getProcurementSummary();
  res.sendResponse(summary);
};

const getInventoryMovement = async (req, res) => {
  const movement = await procurementService.getInventoryMovement(req.params.id);
  res.sendResponse(movement);
};

const getRequisitionWithRemainingItems = async (req, res) => {
  const requisition = await procurementService.getRequisitionWithRemainingItems(req.params.id);
  res.sendResponse(requisition);
};

const deleteProcurement = async (req, res) => {
  const procurement = await procurementService.deleteProcurement(req.params.id);
  res.sendResponse(procurement, "Procurement deleted successfully");
};

const createFromComparison = async (req, res) => {
  const { comparisonId, vendorId, selections } = req.body;
  const userId = req.user.id;
  const procurements =
    await procurementService.createProcurementsFromComparison(
      comparisonId,
      userId,
      vendorId,
      selections
    );
  res.sendResponse(
    procurements,
    "Procurements created successfully from comparison"
  );
};

module.exports = {
  createProcurement,
  getProcurement,
  updateStatus,
  listProcurements,
  updatePayment,
  getSummary,
  getInventoryMovement,
  getRequisitionWithRemainingItems,
  deleteProcurement,
  createFromComparison,
};
