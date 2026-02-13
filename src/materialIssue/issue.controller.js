const service = require("./issue.service");

const createMaterialIssue = async (req, res) => {
  const userId = req.user.id;
  const data = await service.createMaterialIssue(req.body, userId);
  res.sendResponse(data, "Material issue created successfully");
};

const getMaterialIssueById = async (req, res) => {
  const data = await service.getMaterialIssueById(req.params.id);
  res.sendResponse(data, "Material issue fetched successfully");
};

const getAllMaterialIssues = async (req, res) => {
  const user = req.user
  const data = await service.getAllMaterialIssues(user.siteId);
  res.sendResponse(data, "Material issues fetched successfully");
};

const getMaterialIssuesBySite = async (req, res) => {
  const data = await service.getMaterialIssuesBySite(req.params.siteId);
  res.sendResponse(data, "Material issues fetched successfully");
};

const approveMaterialIssue = async (req, res) => {
  const { issueId } = req.params;
  const userId = req.user.id;
  const data = await service.approveMaterialIssue(issueId, userId);
  res.sendResponse(data, "Material issue approved successfully");
};

const dispatchMaterialIssue = async (req, res) => {
  const { issueId } = req.params;
  const userId = req.user.id;
  const data = await service.dispatchMaterialIssue(issueId, userId);
  res.sendResponse(data, "Material issue dispatched and stock deducted");
};

const receiveMaterialIssue = async (req, res) => {
  const { issueId } = req.params;
  const userId = req.user.id;
  const data = await service.receiveMaterialIssue(issueId, userId);
  res.sendResponse(data, "Material issue received and stock updated");
};

const issueForConsumption = async (req, res) => {
  const { issueId } = req.params;
  const userId = req.user.id;
  const data = await service.issueForConsumption(issueId, userId);
  res.sendResponse(data, "Material issued and consumed successfully");
};

const rejectMaterialIssue = async (req, res) => {
  const { issueId } = req.params;
  const { rejectionReason } = req.body;
  const userId = req.user.id;

  const data = await service.rejectMaterialIssue(issueId, userId, rejectionReason);
  res.sendResponse(data, "Material issue rejected successfully");
};



module.exports = {
  createMaterialIssue,
  getMaterialIssueById,
  getAllMaterialIssues,
  getMaterialIssuesBySite,
  approveMaterialIssue,
  dispatchMaterialIssue,
  receiveMaterialIssue,
  issueForConsumption,
  rejectMaterialIssue
};
