const router = require("express").Router();
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const dashboardController = require("./dashboard.controller");
const validateRequest = require("../../middlewares/validateRequest");
const { dashboardFiltersSchema } = require("./dashboard.validator");

// Executive Dashboard
router.get(
  "/dashboard/overview",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getOverview)
);
router.get(
  "/dashboard/alerts",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getAlerts)
);
router.get(
  "/dashboard/recent-activities",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getRecentActivities)
);

// Operational Dashboard
router.get(
  "/dashboard/machines/status",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getMachineStatus)
);
router.get(
  "/dashboard/sites/summary",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getSitesSummary)
);
router.get(
  "/dashboard/inventory/alerts",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getInventoryAlerts)
);
router.get(
  "/dashboard/maintenance/due",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getMaintenanceDue)
);

// Financial Dashboard
router.get(
  "/dashboard/procurement/pending",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getProcurementPending)
);
router.get(
  "/dashboard/payments/outstanding",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getPaymentsOutstanding)
);
router.get(
  "/dashboard/expenses/monthly",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getExpensesMonthly)
);

router.get(
  "/dashboard/site/overview",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getSiteOverview)
);

router.get(
  "/dashboard/site/info",
  asyncMiddleware(dashboardController.getSiteInfo)
);

// Operational Activities Routes
router.get(
  "/dashboard/site/requisitions",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getSiteRequisitions)
);

router.get(
  "/dashboard/site/material-issues",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getSiteMaterialIssues)
);

router.get(
  "/dashboard/site/transfers",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getSiteTransfers)
);

// Status Routes
router.get(
  "/dashboard/site/machines/status",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getSiteMachineStatus)
);

router.get(
  "/dashboard/site/inventory/status",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getSiteInventoryStatus)
);

// Alerts Routes
router.get(
  "/dashboard/site/inventory/alerts",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getSiteInventoryAlerts)
);

router.get(
  "/dashboard/site/machine/alerts",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getSiteMachineAlerts)
);

// Maintenance & Expenses Routes
router.get(
  "/dashboard/site/maintenance/due",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getSiteMaintenanceDue)
);

router.get(
  "/dashboard/site/expenses",
  validateRequest(dashboardFiltersSchema, "query"),
  asyncMiddleware(dashboardController.getSiteExpenses)
);

module.exports = router;
