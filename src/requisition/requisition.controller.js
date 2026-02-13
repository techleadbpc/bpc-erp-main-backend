const requisitionService = require("./requisition.service");

const createRequisition = async (req, res) => {
  const requisition = await requisitionService.createRequisition(
    req.body,
    req.user.id
  );
  res.sendResponse(requisition, "Requisition created successfully");
};

const getRequisitionById = async (req, res) => {
  const requisition = await requisitionService.getRequisitionById(
    req.params.id
  );
  res.sendResponse(requisition, "Requisition fetched successfully");
};

const getAllRequisitions = async (req, res) => {
  const user = req.user;
  const siteId = user.siteId;
  const requisitions = await requisitionService.getAllRequisitions(siteId);
  res.sendResponse(requisitions, "Requisitions fetched successfully");
};

const approveRequisition = async (req, res) => {
  const { requisitionId } = req.params;
  const userId = req.user.id; // assuming authentication middleware
  const requisition = await requisitionService.approveRequisition(
    requisitionId,
    userId
  );
  res.sendResponse(requisition, "Requisition approved successfully");
};

const pmApproveRequisition = async (req, res) => {
  const { requisitionId } = req.params;
  const userId = req.user.id; // assuming authentication middleware
  const requisition = await requisitionService.pmApproveRequisition(
    requisitionId,
    userId
  );
  res.sendResponse(requisition, "Requisition approved by PM successfully");
};
const hoApproveRequisition = async (req, res) => {
  const { requisitionId } = req.params;
  const userId = req.user.id; // assuming authentication middleware
  const requisition = await requisitionService.hoApproveRequisition(
    requisitionId,
    userId
  );
  res.sendResponse(requisition, "Requisition approved by HO successfully");
};

const requisitionDelete = async (req, res) => {
  const { requisitionId } = req.params;
  const result = await requisitionService.requisitionDelete(requisitionId);
  res.sendResponse(result, "Requisition deleted successfully");
};

const completeRequisition = async (req, res) => {
  const { requisitionId } = req.params;
  const userId = req.user.id;

  const data = await requisitionService.completeRequisition(
    requisitionId,
    userId
  );
  res.sendResponse(data, "Requisition marked as completed successfully");
};

const rejectRequisition = async (req, res) => {
  const { requisitionId } = req.params;
  const { rejectionReason } = req.body;
  const userId = req.user.id;

  const data = await requisitionService.rejectRequisition(
    requisitionId,
    userId,
    rejectionReason
  );
  res.sendResponse(data, "Requisition rejected successfully");
};

const rejectRequisitionBySite = async (req, res) => {
  const { id } = req.params;
  const rejection = await requisitionService.rejectRequisitionBySite(
    id,
    req.body,
    req.user
  );
  res.sendResponse(rejection, "Requisition rejected successfully");
};

const getRequisitionRejections = async (req, res) => {
  const { id } = req.params;
  const rejections = await requisitionService.getRequisitionRejections(id);
  res.sendResponse(rejections, "Rejections retrieved successfully");
};

const updateItemQuantity = async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;
  const result = await requisitionService.updateItemQuantity(
    id,
    items
  );
  res.sendResponse(result, "Item quantity updated successfully");
};

module.exports = {
  createRequisition,
  getRequisitionById,
  getAllRequisitions,
  approveRequisition,
  pmApproveRequisition,
  hoApproveRequisition,
  requisitionDelete,
  completeRequisition,
  rejectRequisition,
  rejectRequisitionBySite,
  getRequisitionRejections,
  updateItemQuantity,
};
