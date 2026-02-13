const express = require("express");
const machineryItemCodeController = require("./machineryItemCode.controller");
const validateRequest = require("../../middlewares/validateRequest");
const schemas = require("./machineryItemCode.validator");
const asyncMiddleware = require("../../middlewares/asyncMiddleware");

const router = express.Router();

router.post(
  "/",
  validateRequest(schemas.createMachineryItemCodeSchema),
  asyncMiddleware(machineryItemCodeController.createMachineryItemCode)
);
router.get(
  "/",
  asyncMiddleware(machineryItemCodeController.getAllMachineryItemCodes)
);
router.get(
  "/:id",
  asyncMiddleware(machineryItemCodeController.getMachineryItemCodeById)
);
router.put(
  "/:id",
  validateRequest(schemas.updateMachineryItemCodeSchema),
  asyncMiddleware(machineryItemCodeController.updateMachineryItemCode)
);
router.delete(
  "/:id",
  asyncMiddleware(machineryItemCodeController.deleteMachineryItemCode)
);
router.post(
  "/:id/restore",
  asyncMiddleware(machineryItemCodeController.restoreMachineryItemCode)
);

module.exports = router;
