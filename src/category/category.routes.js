const express = require("express");
const categoryController = require("./category.controller");
const CategorySchema = require("./category.validator");
const validateRequest = require("../../middlewares/validateRequest");
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const hasRole = require("./../../middlewares/hasRole")

const router = express.Router();

// ✅ Primary Category Routes
router.post(
  "/primary",
  hasRole([1, 2, 3]),
  validateRequest(CategorySchema.createPrimaryCategorySchema),
  asyncMiddleware(categoryController.createPrimaryCategory)
);
router.get("/primary", asyncMiddleware(categoryController.getAllPrimaryCategories));
router.get("/primary/:id", asyncMiddleware(categoryController.getPrimaryCategoryById));
router.put(
  "/primary/:id",
  hasRole([1, 2, 3]),
  validateRequest(CategorySchema.updatePrimaryCategorySchema),
  asyncMiddleware(categoryController.updatePrimaryCategory)
);
router.delete("/primary/:id", hasRole([1, 2, 3]), asyncMiddleware(categoryController.deletePrimaryCategory));

// ✅ Machine Category Routes
router.post(
  "/machine",
  hasRole([1, 2, 3]),
  validateRequest(CategorySchema.createMachineCategorySchema),
  asyncMiddleware(categoryController.createMachineCategory)
);
router.get("/machine", asyncMiddleware(categoryController.getAllMachineCategories));
router.get("/machine/:id", asyncMiddleware(categoryController.getMachineCategoryById));
router.put(
  "/machine/:id",
  hasRole([1, 2, 3]),
  validateRequest(CategorySchema.updateMachineCategorySchema),
  asyncMiddleware(categoryController.updateMachineCategory)
);
router.delete("/machine/:id",
  hasRole([1, 2, 3]),
  asyncMiddleware(categoryController.deleteMachineCategory)
);

module.exports = router;
