module.exports = (sequelize, DataTypes) => {
  const MaintenanceLog = sequelize.define(
    "MaintenanceLog",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      machineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      parts: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      technician: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "completed",
          "in_progress",
          "scheduled",
          "overdue",
          "due_today"
        ),
        allowNull: false,
      },
      hoursAtService: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      kilometersAtService: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      vendorAndPartsDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      estimatedHours: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      estimatedCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high"),
        allowNull: true,
        defaultValue: "medium",
      },
      assignedTo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastAlertDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "maintenance_logs",
      timestamps: true,
    }
  );
  MaintenanceLog.associate = (models) => {
    MaintenanceLog.belongsTo(models.Machinery, {
      foreignKey: "machineId",
      as: "machine",
    });
  };

  return MaintenanceLog;
};
