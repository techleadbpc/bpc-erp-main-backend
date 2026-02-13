const express = require("express");
const machineryController = require("./machinery.controller");
const validateRequest = require("../../middlewares/validateRequest");
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const {
  createMachinerySchema,
  updateMachinerySchema,
} = require("./machinery.validator");
const {
  upload,
  fileUploadMiddleware,
} = require("../../middlewares/fileUploadMiddleware");
const { getExistingFiles } = require("./machinery.service");
const hasRole = require("../../middlewares/hasRole");

const router = express.Router();

// Define file fields to be uploaded
const fileFields = [
  "fitnessCertificateFile",
  "pollutionCertificateFile",
  "insuranceFile",
  "permitFile",
  "nationalPermitFile",
  "motorVehicleTaxFile",
  "machineImageFile",
];

// Apply the middleware to handle file uploads before validation & controller
router.post(
  "/",
  hasRole([1, 2, 3]),
  upload.fields(fileFields.map((name) => ({ name, maxCount: 1 }))),
  fileUploadMiddleware(fileFields, "mani", "machinery"),
  validateRequest(createMachinerySchema),
  asyncMiddleware(machineryController.createMachinery)
);

router.put(
  "/:id",
  hasRole([1, 2, 3]),
  upload.fields(fileFields.map((name) => ({ name, maxCount: 1 }))),
  fileUploadMiddleware(fileFields, "mani", "machinery", getExistingFiles),
  validateRequest(updateMachinerySchema),
  asyncMiddleware(machineryController.updateMachinery)
);

router.get("/", asyncMiddleware(machineryController.getAllMachinery));
router.get("/:id", asyncMiddleware(machineryController.getMachineryById));
router.get("/:id/log-entries", asyncMiddleware(machineryController.getMachineryLogEntries));
router.delete("/:id", hasRole([1, 2, 3]), asyncMiddleware(machineryController.deleteMachinery));
module.exports = router;
