const router = require("express").Router();
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const itemGroupController = require("./itemGroup.controller");
const validateRequest = require("../../middlewares/validateRequest");
const { createItemGroupSchema, updateItemGroupSchema } = require("./itemGroup.validator");

router.get("/item-groups", asyncMiddleware(itemGroupController.getAllItemGroups));
router.get("/item-groups/:id", asyncMiddleware(itemGroupController.getItemGroupById));
router.post("/item-groups", validateRequest(createItemGroupSchema), asyncMiddleware(itemGroupController.createItemGroup));
router.put("/item-groups/:id", validateRequest(updateItemGroupSchema), asyncMiddleware(itemGroupController.updateItemGroup));
router.delete("/item-groups/:id", asyncMiddleware(itemGroupController.deleteItemGroup));

module.exports = router;
