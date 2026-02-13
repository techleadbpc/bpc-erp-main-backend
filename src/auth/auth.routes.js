const express = require("express");
const router = express.Router();
// const tokenValidator = require("./../../Middleware/tokenValidator");
const contorller = require("./auth.controller");
const { loginSchema } = require("./auth.validator");
const validateRequest = require("../../middlewares/validateRequest");

router.post("/login", validateRequest(loginSchema), contorller.login);
router.post("/logout", contorller.logout);
// router.post("/refreshToken", isAuthenticated, contorller.refreshToken);
// router.post("/check-auth", tokenValidator, function (req, res) {
//   res.sendResponse({ isAuthenticated: true });
// });

// app.put('/update-profile', authMiddleware, userController.updateProfile);

module.exports = router;
