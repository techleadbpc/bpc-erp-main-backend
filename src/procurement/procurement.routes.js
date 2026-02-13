const router = require("express").Router();
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const procurementController = require("./procurement.controller");
const validateRequest = require("../../middlewares/validateRequest");
const {
  createProcurementSchema,
  updateStatusSchema,
  listProcurementsSchema,
  updatePaymentSchema,
} = require("./procurement.validator");

router.post(
  "/procurements",
  validateRequest(createProcurementSchema),
  asyncMiddleware(procurementController.createProcurement)
);

router.get(
  "/procurements/:id",
  asyncMiddleware(procurementController.getProcurement)
);

router.put(
  "/procurements/:id/status",
  validateRequest(updateStatusSchema),
  asyncMiddleware(procurementController.updateStatus)
);

// Add to existing routes
router.get(
  "/procurements",
  validateRequest(listProcurementsSchema),
  asyncMiddleware(procurementController.listProcurements)
);

router.put(
  "/procurements/:id/payment",
  validateRequest(updatePaymentSchema),
  asyncMiddleware(procurementController.updatePayment)
);

// Optional: Delete procurement (if needed)
router.delete(
  "/procurements/:id",
  asyncMiddleware(procurementController.deleteProcurement)
);

router.get(
  "/procurements/summary",
  asyncMiddleware(procurementController.getSummary)
);

router.get(
  "/procurements/:id/inventory-movement",
  asyncMiddleware(procurementController.getInventoryMovement)
);

// Route to get requisition with remaining items
router.get(
  "/requisitions/:id/remaining-items",
  asyncMiddleware(procurementController.getRequisitionWithRemainingItems)
);

router.post(
  "/procurements/create-from-comparison",
  asyncMiddleware(procurementController.createFromComparison)
);

module.exports = router;
