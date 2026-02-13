const express = require("express");
const router = express.Router();
const inventoryController = require("./inventory.controller");
const asyncMiddleware = require("./../../middlewares/asyncMiddleware");
const { createInventorySchema, updateInventorySchema } = require("./inventory.validator");
const validateRequest = require("./../../middlewares/validateRequest");

router.post("/", validateRequest(createInventorySchema), asyncMiddleware(inventoryController.createInventory));
router.put("/:id", validateRequest(updateInventorySchema), asyncMiddleware(inventoryController.updateInventory));
router.delete("/:id", asyncMiddleware(inventoryController.deleteInventory));
router.get("/:id", asyncMiddleware(inventoryController.getInventoryById));
router.get("/", asyncMiddleware(inventoryController.getAllInventories));
router.get("/item/:itemId", asyncMiddleware(inventoryController.getInventoryDetailsByItemId));
router.get("/items/sites/:siteId", asyncMiddleware(inventoryController.getItemGroupsAndItemsBySiteId));
router.get("/sites/:siteId", asyncMiddleware(inventoryController.getInventoryBySiteId));
router.get("/stock-log/:itemId", asyncMiddleware(inventoryController.getStockLogsByItem));
router.get("/reference/stock-log", asyncMiddleware(inventoryController.getStockLogReference));
router.get("/stock-status/bulk", asyncMiddleware(inventoryController.getStockStatusBulk));

module.exports = router;
