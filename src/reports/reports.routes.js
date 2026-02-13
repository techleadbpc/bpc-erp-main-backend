const router = require("express").Router();
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const reportsController = require("./reports.controller");
const validateRequest = require("../../middlewares/validateRequest");
const { reportsFiltersSchema } = require("./reports.validator");

// Machine Management Reports
router.get("/reports/machine-utilization", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getMachineUtilization));
router.get("/reports/machine-maintenance", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getMachineMaintenanceReport));
router.get("/reports/machine-transfer", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getMachineTransferReport));
router.get("/reports/machine-compliance", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getMachineComplianceReport));
router.get("/reports/logbook", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getLogbookReport));

// Inventory Management Reports
router.get("/reports/inventory-stock", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getInventoryStockReport));
router.get("/reports/inventory-consumption", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getInventoryConsumptionReport));
router.get("/reports/inventory-transfer", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getInventoryTransferReport));
router.get("/reports/inventory-valuation", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getInventoryValuationReport));

// Procurement & Financial Reports
router.get("/reports/procurement-summary", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getProcurementSummaryReport));
router.get("/reports/procurement-vendor", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getProcurementVendorReport));
router.get("/reports/payment-status", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getPaymentStatusReport));
router.get("/reports/invoice-aging", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getInvoiceAgingReport));

// Operational Reports
router.get("/reports/site-performance", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getSitePerformanceReport));
router.get("/reports/requisition-analysis", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getRequisitionAnalysisReport));
router.get("/reports/user-activity", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getUserActivityReport));

// Additional Reports
router.get("/reports/asset-depreciation", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getAssetDepreciationReport));
router.get("/reports/maintenance-cost-analysis", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getMaintenanceCostAnalysis));
router.get("/reports/fuel-consumption", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getFuelConsumptionReport));
router.get("/reports/vendor-performance", validateRequest(reportsFiltersSchema, 'query'), asyncMiddleware(reportsController.getVendorPerformanceReport));

module.exports = router;