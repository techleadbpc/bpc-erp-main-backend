const router = require("express").Router();
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const itemController = require("./item.controller");
const validateRequest = require("../../middlewares/validateRequest");
const { createItemSchema, updateItemSchema } = require("./item.validator");

router.get("/items", asyncMiddleware(itemController.getAllItems));
router.get("/items/:id", asyncMiddleware(itemController.getItemById));
router.post("/items", validateRequest(createItemSchema), asyncMiddleware(itemController.createItem));
router.put("/items/:id", validateRequest(updateItemSchema), asyncMiddleware(itemController.updateItem));
router.delete("/items/:id", asyncMiddleware(itemController.deleteItem));

module.exports = router;
