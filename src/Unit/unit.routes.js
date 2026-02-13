const router = require("express").Router();
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const unitController = require("./unit.controller");
const validateRequest = require("../../middlewares/validateRequest");
const { createUnitSchema, updateUnitSchema } = require("./unit.validator");

router.get("/units", asyncMiddleware(unitController.getAllUnits));
router.get("/units/:id", asyncMiddleware(unitController.getUnitById));
router.post("/units", validateRequest(createUnitSchema), asyncMiddleware(unitController.createUnit));
router.put("/units/:id", validateRequest(updateUnitSchema), asyncMiddleware(unitController.updateUnit));
router.delete("/units/:id", asyncMiddleware(unitController.deleteUnit));

module.exports = router;
