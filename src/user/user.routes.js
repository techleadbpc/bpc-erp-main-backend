const express = require("express");
const userController = require("./user.controller");
const userSchema = require("./user.validator");
const validateRequest = require("../../middlewares/validateRequest");
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const hasRole = require("../../middlewares/hasRole");

const router = express.Router();

router.post("/", hasRole([1, 2, 3]), validateRequest(userSchema.createUserSchema), asyncMiddleware(userController.createUser));
router.get("/", asyncMiddleware(userController.getAllUsers));
router.get("/:id", asyncMiddleware(userController.getUserById));
router.put("/:id", hasRole([1, 2, 3]), validateRequest(userSchema.updateUserSchema), asyncMiddleware(userController.updateUser));
router.delete("/:id", hasRole([1, 2, 3]), asyncMiddleware(userController.deleteUser));
router.post("/:id/restore", hasRole([1, 2, 3]), asyncMiddleware(userController.restoreUser));

module.exports = router;
