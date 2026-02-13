module.exports = (sequelize, DataTypes) => {
  const NotificationRole = sequelize.define(
    "NotificationRole",
    {},
    { tableName: "notification_roles", timestamps: false }
  );
  return NotificationRole;
};
