const { Notification } = require("./../../models");
const createNotification = async ({
  eventType,
  eventAction,
  referenceId,
  siteId,
  createdBy,
  roles,
  title,
  description,
}) => {
  const notification = await Notification.create({
    eventType,
    eventAction,
    referenceId,
    siteId,
    title,
    description,
    createdBy,
  });

  // Associate roles to receive this notification
  if (roles?.length) {
    await notification.setRoles(roles);
  }
};

module.exports = createNotification;
