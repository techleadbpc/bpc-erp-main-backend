const notificationService = require("./notification.service");

const getAllNotifications = async (req, res) => {
  const userId = req.user.id;
  const user = req.user;
  const whereClause = {};
  if (user.siteId) {
    whereClause.siteId = user.siteId;
  }
  const notifications = await notificationService.getNotificationsForUser(
    userId,
    whereClause
  );
  res.sendResponse(notifications, "Notifications fetched successfully");
};

const markAsRead = async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  await notificationService.markNotificationAsRead(userId, Number(notificationId));
  res.sendResponse({}, "Notification marked as read");
};

const markAllAsRead = async (req, res) => {
  const userId = req.user.id;
  await notificationService.markAllNotificationsAsRead(userId);
  res.sendResponse({}, "All notifications marked as read");
};

module.exports = {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
};
