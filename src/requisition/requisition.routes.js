const express = require("express");
const router = express.Router();
const requisitionController = require("./requisition.controller");
const asyncMiddleware = require("./../../middlewares/asyncMiddleware");
const validateRequest = require("./../../middlewares/validateRequest");
const { createRequisitionSchema } = require("./requisition.validator");

router.post(
  "/requisitions/",
  validateRequest(createRequisitionSchema),
  asyncMiddleware(requisitionController.createRequisition)
);

router.get(
  "/requisitions/:id",
  asyncMiddleware(requisitionController.getRequisitionById)
);

router.get(
  "/requisitions/",
  asyncMiddleware(requisitionController.getAllRequisitions)
);

router.post(
  "/requisitions/:requisitionId/approve",
  asyncMiddleware(requisitionController.approveRequisition)
);
router.post(
  "/requisitions/:requisitionId/pm-approve",
  asyncMiddleware(requisitionController.pmApproveRequisition)
);
router.post(
  "/requisitions/:requisitionId/ho-approve",
  asyncMiddleware(requisitionController.hoApproveRequisition)
);

router.delete(
  "/requisitions/:requisitionId",
  asyncMiddleware(requisitionController.requisitionDelete)
);
router.post(
  "/requisitions/:requisitionId/complete",
  asyncMiddleware(requisitionController.completeRequisition)
);
router.post(
  "/requisitions/:requisitionId/reject",
  asyncMiddleware(requisitionController.rejectRequisition)
);

router.post(
  "/requisitions/:id/site-reject",
  asyncMiddleware(requisitionController.rejectRequisitionBySite)
);
router.put(
  "/requisitions/:id/item-quantity-update",
  asyncMiddleware(requisitionController.updateItemQuantity)
);

// Get all site rejections for a requisition
router.get(
  "/requisitions/:id/site-rejections",
  asyncMiddleware(requisitionController.getRequisitionRejections)
);

module.exports = router;
