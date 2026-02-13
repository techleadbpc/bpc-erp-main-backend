const express = require("express");
const router = express.Router();
const controller = require("./issue.controller");
const validateRequest = require("../../middlewares/validateRequest");
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const { createMaterialIssueSchema } = require("./issue.validator");

router.post(
  "/",
  validateRequest(createMaterialIssueSchema),
  asyncMiddleware(controller.createMaterialIssue)
);

router.get("/:id", asyncMiddleware(controller.getMaterialIssueById));

router.get("/", asyncMiddleware(controller.getAllMaterialIssues));

router.post(
  "/:issueId/approve",
  asyncMiddleware(controller.approveMaterialIssue)
);

// Dispatch material issue (for Site Transfer - deducts stock)
router.post(
  "/:issueId/dispatch",
  asyncMiddleware(controller.dispatchMaterialIssue)
);

// Receive material issue (for Site Transfer - adds stock to destination)
router.post(
  "/:issueId/receive",
  asyncMiddleware(controller.receiveMaterialIssue)
);

// Issue material for consumption (deducts stock and marks as consumed)
router.post(
  "/:issueId/consume",
  asyncMiddleware(controller.issueForConsumption)
);

router.post(
  "/:issueId/reject",
  asyncMiddleware(controller.rejectMaterialIssue)
);

module.exports = router;
