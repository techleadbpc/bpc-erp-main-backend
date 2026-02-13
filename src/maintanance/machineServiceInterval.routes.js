const express = require("express");
const router = express.Router();
const machineServiceIntervalController = require("./machineServiceInterval.controller");
const validateRequest = require("../../middlewares/validateRequest");
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const {
  createMachineServiceIntervalSchema,
  updateMachineServiceIntervalSchema,
} = require("./machineServiceInterval.validator");

// Routes for machine service intervals
router.get(
  "/machine/:machineId",
  asyncMiddleware(machineServiceIntervalController.getMachineServiceIntervals)
);
router.get(
  "/due",
  asyncMiddleware(
    machineServiceIntervalController.getDueMachineServiceIntervals
  )
);
router.get(
  "/next/:machineId",
  asyncMiddleware(
    machineServiceIntervalController.calculateNextServiceForMachine
  )
);
router.get(
  "/:id",
  asyncMiddleware(
    machineServiceIntervalController.getMachineServiceIntervalById
  )
);
router.post(
  "/",
  validateRequest(createMachineServiceIntervalSchema),
  asyncMiddleware(machineServiceIntervalController.createMachineServiceInterval)
);
router.put(
  "/:id",
  validateRequest(updateMachineServiceIntervalSchema),
  asyncMiddleware(machineServiceIntervalController.updateMachineServiceInterval)
);
router.delete(
  "/:id",
  asyncMiddleware(machineServiceIntervalController.deleteMachineServiceInterval)
);

module.exports = router;
