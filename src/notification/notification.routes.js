const express = require("express");
const router = express.Router();
const notificationController = require("./notification.controller");
const asyncMiddleware = require("./../../middlewares/asyncMiddleware");

// GET /notifications/
router.get(
  "/notifications/",
  asyncMiddleware(notificationController.getAllNotifications)
);

// POST /notifications/:id/read
router.post(
  "/notifications/:id/read",
  asyncMiddleware(notificationController.markAsRead)
);

// POST /notifications/mark-all
router.post(
  "/notifications/read-all",
  asyncMiddleware(notificationController.markAllAsRead)
);

module.exports = router;
