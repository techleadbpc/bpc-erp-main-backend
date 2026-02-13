module.exports = (sequelize, DataTypes) => {
  const NotificationReadStatus = sequelize.define(
    "NotificationReadStatus",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      notificationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "notification_read_status",
      timestamps: true,
    }
  );

  NotificationReadStatus.associate = (models) => {
    NotificationReadStatus.belongsTo(models.Notification, {
      foreignKey: "notificationId",
      as: "notification",
    });

    NotificationReadStatus.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };
  return NotificationReadStatus;
};
