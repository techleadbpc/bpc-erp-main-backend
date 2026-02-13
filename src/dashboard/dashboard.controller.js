const dashboardService = require("./dashboard.service");

const getOverview = async (req, res) => {
  const overview = await dashboardService.getOverview(req.query);
  res.sendResponse(overview, "Overview data retrieved successfully");
};

const getAlerts = async (req, res) => {
  const alerts = await dashboardService.getAlerts(req.query);
  res.sendResponse(alerts, "Alerts retrieved successfully");
};

const getRecentActivities = async (req, res) => {
  const activities = await dashboardService.getRecentActivities(req.query);
  res.sendResponse(activities, "Recent activities retrieved successfully");
};

const getMachineStatus = async (req, res) => {
  const machineStatus = await dashboardService.getMachineStatus(req.query);
  res.sendResponse(machineStatus, "Machine status data retrieved successfully");
};

const getSitesSummary = async (req, res) => {
  const sitesSummary = await dashboardService.getSitesSummary(req.query);
  res.sendResponse(sitesSummary, "Sites summary retrieved successfully");
};

const getInventoryAlerts = async (req, res) => {
  const inventoryAlerts = await dashboardService.getInventoryAlerts(req.query);
  res.sendResponse(inventoryAlerts, "Inventory alerts retrieved successfully");
};

const getMaintenanceDue = async (req, res) => {
  const maintenanceDue = await dashboardService.getMaintenanceDue(req.query);
  res.sendResponse(
    maintenanceDue,
    "Maintenance due data retrieved successfully"
  );
};

const getProcurementPending = async (req, res) => {
  const procurementPending = await dashboardService.getProcurementPending(
    req.query
  );
  res.sendResponse(
    procurementPending,
    "Pending procurements retrieved successfully"
  );
};

const getPaymentsOutstanding = async (req, res) => {
  const paymentsOutstanding = await dashboardService.getPaymentsOutstanding(
    req.query
  );
  res.sendResponse(
    paymentsOutstanding,
    "Outstanding payments retrieved successfully"
  );
};

const getExpensesMonthly = async (req, res) => {
  const expensesMonthly = await dashboardService.getExpensesMonthly(req.query);
  res.sendResponse(expensesMonthly, "Monthly expenses retrieved successfully");
};


// Helper for extracting the right siteId
const getRelevantSiteId = (req) => {
  // Prefer siteId from user context (site users); fallback to query (admins)
  return req.user && req.user.siteId ? req.user.siteId : req.query.siteId;
};

const getSiteOverview = async (req, res) => {
  const siteId = getRelevantSiteId(req);
  if (!siteId) {
    return res.status(400).send({ message: "Site ID is required." });
  }
  const overview = await dashboardService.getSiteOverview(
    siteId,
    req.query
  );
  res.sendResponse(overview, "Site overview retrieved successfully");
};

const getSiteRequisitions = async (req, res) => {
  const siteId = getRelevantSiteId(req);
  if (!siteId) {
    return res.status(400).send({ message: "Site ID is required." });
  }
  const requisitions = await dashboardService.getSiteRequisitions(
    siteId,
    req.query
  );
  res.sendResponse(requisitions, "Site requisitions retrieved successfully");
};

const getSiteMaterialIssues = async (req, res) => {
  const siteId = getRelevantSiteId(req);
  if (!siteId) {
    return res.status(400).send({ message: "Site ID is required." });
  }
  const materialIssues = await dashboardService.getSiteMaterialIssues(
    siteId,
    req.query
  );
  res.sendResponse(
    materialIssues,
    "Site material issues retrieved successfully"
  );
};

const getSiteTransfers = async (req, res) => {
  const siteId = getRelevantSiteId(req);
  if (!siteId) {
    return res.status(400).send({ message: "Site ID is required." });
  }
  const transfers = await dashboardService.getSiteTransfers(
    siteId,
    req.query
  );
  res.sendResponse(transfers, "Site transfers retrieved successfully");
};

const getSiteInventoryAlerts = async (req, res) => {
  const siteId = getRelevantSiteId(req);
  if (!siteId) {
    return res.status(400).send({ message: "Site ID is required." });
  }
  const alerts = await dashboardService.getSiteInventoryAlerts(
    siteId,
    req.query
  );
  res.sendResponse(alerts, "Site inventory alerts retrieved successfully");
};

const getSiteMachineAlerts = async (req, res) => {
  const siteId = getRelevantSiteId(req);
  if (!siteId) {
    return res.status(400).send({ message: "Site ID is required." });
  }
  const alerts = await dashboardService.getSiteMachineAlerts(
    siteId,
    req.query
  );
  res.sendResponse(alerts, "Site machine alerts retrieved successfully");
};

const getSiteMachineStatus = async (req, res) => {
  const siteId = getRelevantSiteId(req);
  if (!siteId) {
    return res.status(400).send({ message: "Site ID is required." });
  }
  const machineStatus = await dashboardService.getSiteMachineStatus(
    siteId,
    req.query
  );
  res.sendResponse(machineStatus, "Site machine status retrieved successfully");
};

const getSiteInventoryStatus = async (req, res) => {
  const siteId = getRelevantSiteId(req);
  if (!siteId) {
    return res.status(400).send({ message: "Site ID is required." });
  }
  const inventoryStatus = await dashboardService.getSiteInventoryStatus(
    siteId,
    req.query
  );
  res.sendResponse(
    inventoryStatus,
    "Site inventory status retrieved successfully"
  );
};

const getSiteMaintenanceDue = async (req, res) => {
  const siteId = getRelevantSiteId(req);
  if (!siteId) {
    return res.status(400).send({ message: "Site ID is required." });
  }
  const maintenanceDue = await dashboardService.getSiteMaintenanceDue(
    siteId,
    req.query
  );
  res.sendResponse(
    maintenanceDue,
    "Site maintenance due retrieved successfully"
  );
};

const getSiteExpenses = async (req, res) => {
  const siteId = getRelevantSiteId(req);
  if (!siteId) {
    return res.status(400).send({ message: "Site ID is required." });
  }
  const expenses = await dashboardService.getSiteExpenses(
    siteId,
    req.query
  );
  res.sendResponse(expenses, "Site expenses retrieved successfully");
};

const getSiteInfo = async (req, res) => {
  const siteId = getRelevantSiteId(req);
  if (!siteId) {
    return res.status(400).send({ message: "Site ID is required." });
  }
  const siteInfo = await dashboardService.getSiteInfo(siteId);
  res.sendResponse(siteInfo, "Site information retrieved successfully");
};

module.exports = {
  getOverview,
  getAlerts,
  getRecentActivities,
  getMachineStatus,
  getSitesSummary,
  getInventoryAlerts,
  getMaintenanceDue,
  getProcurementPending,
  getPaymentsOutstanding,
  getExpensesMonthly,

  getSiteOverview,
  getSiteRequisitions,
  getSiteMaterialIssues,
  getSiteTransfers,
  getSiteInventoryAlerts,
  getSiteMachineAlerts,
  getSiteMachineStatus,
  getSiteInventoryStatus,
  getSiteMaintenanceDue,
  getSiteExpenses,
  getSiteInfo,
};
