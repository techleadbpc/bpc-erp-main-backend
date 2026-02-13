const router = require("express").Router();
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const vendorController = require("./vendor.controller");
const validateRequest = require("../../middlewares/validateRequest");
const { createVendorSchema, updateVendorSchema } = require("./vendor.validator");

router.post("/vendors", validateRequest(createVendorSchema), asyncMiddleware(vendorController.createVendor));
router.get("/vendors", asyncMiddleware(vendorController.getAllVendors));
router.get("/vendors/:id", asyncMiddleware(vendorController.getVendorById));
router.put("/vendors/:id", validateRequest(updateVendorSchema), asyncMiddleware(vendorController.updateVendor));
router.delete("/vendors/:id", asyncMiddleware(vendorController.deleteVendor));

module.exports = router;