const db = require("./../../models");

const getNotificationsForUser = async (userId, whereClause = {}) => {
  const notifications = await db.Notification.findAll({
    where: whereClause,
    include: [
      {
        model: db.NotificationReadStatus,
        where: { userId },
        required: false,
        as: "readStatuses",
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return notifications.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    eventType: n.eventType,
    eventAction: n.eventAction,
    createdAt: n.createdAt,
    referenceId: n.referenceId,
    read: n.readStatuses?.length > 0,
  }));
};

const markNotificationAsRead = async (userId, notificationId) => {
  const [readStatus, created] = await db.NotificationReadStatus.findOrCreate({
    where: { userId, notificationId },
    defaults: { readAt: new Date() },
  });

  if (!created) {
    readStatus.readAt = new Date();
    await readStatus.save();
  }

  return true;
};

const markAllNotificationsAsRead = async (userId) => {
  const allNotifications = await db.Notification.findAll({
    attributes: ["id"],
  });

  const readStatusData = allNotifications.map((n) => ({
    userId,
    notificationId: n.id,
    readAt: new Date(),
  }));

  await db.NotificationReadStatus.bulkCreate(readStatusData, {
    ignoreDuplicates: true,
  });

  return true;
};

module.exports = {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
