const siteService = require("./site.service");

const createSite = async (req, res) => {
  const site = await siteService.createSite(req.body);
  res.sendResponse(site, "Site created successfully");
};

const getAllSites = async (req, res) => {
  const sites = await siteService.getAllSites(req.user.siteId, req.query.searchQuery);
  res.sendResponse(sites, "All sites fetched successfully");
};

const getSiteById = async (req, res) => {
  const site = await siteService.getSiteById(req.params.id);
  res.sendResponse(site, "Site fetched successfully");
};

const getVirtualSite = async (req, res) => {
  const site = await siteService.getVirtualSite();
  res.sendResponse(site, "Virtual site fetched successfully");
};

const updateSite = async (req, res) => {
  const site = await siteService.updateSite(req.params.id, req.body);
  res.sendResponse(site, "Site updated successfully");
};

const deleteSite = async (req, res) => {
  const result = await siteService.deleteSite(req.params.id);
  res.sendResponse(null, result.message);
};
const restoreSite = async (req, res) => {
  const result = await siteService.restoreSite(req.params.id);
  res.sendResponse(null, result.message);
};

// Get inventory movement logs for a specific site
const getSiteInventoryMovement = async (req, res) => {
  const { id } = req.params;
  const filters = req.query;
  const result = await siteService.getSiteInventoryMovement(id, filters);
  res.sendResponse(result, "Site inventory movement fetched successfully");
};

// Get summary statistics for a specific site
const getSiteSummaryStats = async (req, res) => {
  const { id } = req.params;
  const stats = await siteService.getSiteSummaryStats(id);
  res.sendResponse(stats, "Site summary statistics fetched successfully");
};

// Get discrepancy report for a specific site
const getDiscrepancyReport = async (req, res) => {
  const { id } = req.params;
  const discrepancies = await siteService.getDiscrepancyReport(id);
  res.sendResponse(discrepancies, "Discrepancy report fetched successfully");
};

// Get procurement summary for virtual site
const getVirtualSiteProcurementSummary = async (req, res) => {
  const summary = await siteService.getVirtualSiteProcurementSummary();
  res.sendResponse(summary, "Virtual site procurement summary fetched successfully");
};

const dispatchProcurementItems = async (req, res) => {
  const result = await siteService.dispatchProcurementItems(req.body);
  res.sendResponse(result, "Items dispatched successfully");
};

const getIncomingDispatches = async (req, res) => {
  const { siteId } = req.user;
  const dispatches = await siteService.getIncomingDispatches(siteId);
  res.sendResponse(dispatches, "Incoming dispatches fetched successfully");
};

const receiveDispatch = async (req, res) => {
  const { siteId, dispatchId } = req.params;
  const result = await siteService.receiveDispatch(siteId, dispatchId);
  res.sendResponse(result, "Dispatch received successfully");
};

module.exports = {
  createSite,
  getAllSites,
  getSiteById,
  getVirtualSite,
  updateSite,
  deleteSite,
  restoreSite,
  getSiteInventoryMovement,
  getSiteSummaryStats,
  getDiscrepancyReport,
  getVirtualSiteProcurementSummary,
  dispatchProcurementItems,
  getIncomingDispatches,
  receiveDispatch,
};
