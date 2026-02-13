const express = require("express");
const siteController = require("./site.controller");
const SiteSchema = require("./site.validator");
const validateRequest = require("../../middlewares/validateRequest");
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const hasRole = require("../../middlewares/hasRole");

const router = express.Router();

// Virtual site and inventory movement routes - MUST BE BEFORE /:id
router.get("/virtual", asyncMiddleware(siteController.getVirtualSite));
router.get("/virtual/procurement-summary", asyncMiddleware(siteController.getVirtualSiteProcurementSummary));
router.post("/virtual/dispatch", asyncMiddleware(siteController.dispatchProcurementItems));

router.post("/", validateRequest(SiteSchema.createSiteSchema), asyncMiddleware(siteController.createSite));
router.get("/", asyncMiddleware(siteController.getAllSites));

router.get("/:id/inventory-movement", asyncMiddleware(siteController.getSiteInventoryMovement));
router.get("/:id/summary-stats", asyncMiddleware(siteController.getSiteSummaryStats));
router.get("/:id/discrepancy-report", asyncMiddleware(siteController.getDiscrepancyReport));
router.get("/:siteId/incoming-dispatches", asyncMiddleware(siteController.getIncomingDispatches));
router.post("/:siteId/dispatch/:dispatchId/receive", asyncMiddleware(siteController.receiveDispatch));

router.get("/:id", asyncMiddleware(siteController.getSiteById));
router.put("/:id", hasRole([1, 2, 3]), validateRequest(SiteSchema.updateSiteSchema), asyncMiddleware(siteController.updateSite));
router.delete("/:id", hasRole([1, 2, 3]), asyncMiddleware(siteController.deleteSite));
router.post("/:id/restore", hasRole([1, 2, 3]), asyncMiddleware(siteController.restoreSite));

module.exports = router;
