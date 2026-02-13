const reportsService = require("./reports.service");

// Machine Management Reports
const getMachineUtilization = async (req, res) => {
  const report = await reportsService.getMachineUtilization(req.query);
  res.sendResponse(report, "Machine utilization report retrieved successfully");
};

const getMachineMaintenanceReport = async (req, res) => {
  const report = await reportsService.getMachineMaintenanceReport(req.query);
  res.sendResponse(report, "Machine maintenance report retrieved successfully");
};

const getMachineTransferReport = async (req, res) => {
  const report = await reportsService.getMachineTransferReport(req.query);
  res.sendResponse(report, "Machine transfer report retrieved successfully");
};

const getMachineComplianceReport = async (req, res) => {
  const report = await reportsService.getMachineComplianceReport(req.query);
  res.sendResponse(report, "Machine compliance report retrieved successfully");
};

const getLogbookReport = async (req, res) => {
  const report = await reportsService.getLogbookReport(req.query);
  res.sendResponse(report, "Logbook report retrieved successfully");
};

// Inventory Management Reports
const getInventoryStockReport = async (req, res) => {
  const report = await reportsService.getInventoryStockReport(req.query);
  res.sendResponse(report, "Inventory stock report retrieved successfully");
};

const getInventoryConsumptionReport = async (req, res) => {
  const report = await reportsService.getInventoryConsumptionReport(req.query);
  res.sendResponse(report, "Inventory consumption report retrieved successfully");
};

const getInventoryTransferReport = async (req, res) => {
  const report = await reportsService.getInventoryTransferReport(req.query);
  res.sendResponse(report, "Inventory transfer report retrieved successfully");
};

const getInventoryValuationReport = async (req, res) => {
  const report = await reportsService.getInventoryValuationReport(req.query);
  res.sendResponse(report, "Inventory valuation report retrieved successfully");
};

// Procurement & Financial Reports
const getProcurementSummaryReport = async (req, res) => {
  const report = await reportsService.getProcurementSummaryReport(req.query);
  res.sendResponse(report, "Procurement summary report retrieved successfully");
};

const getProcurementVendorReport = async (req, res) => {
  const report = await reportsService.getProcurementVendorReport(req.query);
  res.sendResponse(report, "Procurement vendor report retrieved successfully");
};

const getPaymentStatusReport = async (req, res) => {
  const report = await reportsService.getPaymentStatusReport(req.query);
  res.sendResponse(report, "Payment status report retrieved successfully");
};

const getInvoiceAgingReport = async (req, res) => {
  const report = await reportsService.getInvoiceAgingReport(req.query);
  res.sendResponse(report, "Invoice aging report retrieved successfully");
};

// Operational Reports
const getSitePerformanceReport = async (req, res) => {
  const report = await reportsService.getSitePerformanceReport(req.query);
  res.sendResponse(report, "Site performance report retrieved successfully");
};

const getRequisitionAnalysisReport = async (req, res) => {
  const report = await reportsService.getRequisitionAnalysisReport(req.query);
  res.sendResponse(report, "Requisition analysis report retrieved successfully");
};

const getUserActivityReport = async (req, res) => {
  const report = await reportsService.getUserActivityReport(req.query);
  res.sendResponse(report, "User activity report retrieved successfully");
};

// Additional Reports
const getAssetDepreciationReport = async (req, res) => {
  const report = await reportsService.getAssetDepreciationReport(req.query);
  res.sendResponse(report, "Asset depreciation report retrieved successfully");
};

const getMaintenanceCostAnalysis = async (req, res) => {
  const report = await reportsService.getMaintenanceCostAnalysis(req.query);
  res.sendResponse(report, "Maintenance cost analysis retrieved successfully");
};

const getFuelConsumptionReport = async (req, res) => {
  const report = await reportsService.getFuelConsumptionReport(req.query);
  res.sendResponse(report, "Fuel consumption report retrieved successfully");
};

const getVendorPerformanceReport = async (req, res) => {
  const report = await reportsService.getVendorPerformanceReport(req.query);
  res.sendResponse(report, "Vendor performance report retrieved successfully");
};

module.exports = {
  // Machine Management Reports
  getMachineUtilization,
  getMachineMaintenanceReport,
  getMachineTransferReport,
  getMachineComplianceReport,
  getLogbookReport,
  
  // Inventory Management Reports
  getInventoryStockReport,
  getInventoryConsumptionReport,
  getInventoryTransferReport,
  getInventoryValuationReport,
  
  // Procurement & Financial Reports
  getProcurementSummaryReport,
  getProcurementVendorReport,
  getPaymentStatusReport,
  getInvoiceAgingReport,
  
  // Operational Reports
  getSitePerformanceReport,
  getRequisitionAnalysisReport,
  getUserActivityReport,
  
  // Additional Reports
  getAssetDepreciationReport,
  getMaintenanceCostAnalysis,
  getFuelConsumptionReport,
  getVendorPerformanceReport
};