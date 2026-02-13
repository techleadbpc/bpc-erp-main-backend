// models/Notification.js
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      eventType: {
        type: DataTypes.ENUM(
          "MachineTransfer",
          "MachineScrap",
          "MachineSold",
          "MaterialRequisition",
          "MaterialIssue",
          "LowStock",
          "DocumentExpiry",
          "MaintenanceAlert",
          "MachineMaintenanceAlert",
          "LogbookEntry"
        ),
        allowNull: false,
      },
      eventAction: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // eventAction: {
      //   type: DataTypes.ENUM(
      //     "Requested",
      //     "Approved",
      //     "Dispatched",
      //     "Received",
      //     "Rejected",
      //     "Completed",
      //     "Expired",
      //     "Out Of Stock",
      //     "Low Stock",

      //   ),
      //   allowNull: false,
      // },
      referenceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      siteId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "notifications",
      timestamps: true,
      paranoid: true,
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "creator",
    });
    Notification.belongsTo(models.Site, { foreignKey: "siteId", as: "site" });
    Notification.belongsToMany(models.Role, {
      through: models.NotificationRole,
      foreignKey: "notificationId",
    });
    Notification.belongsToMany(models.User, {
      through: models.NotificationReadStatus,
      foreignKey: "notificationId",
    });

    Notification.hasMany(models.NotificationReadStatus, {
      foreignKey: "notificationId",
      as: "readStatuses",
    });
  };

  return Notification;
};
