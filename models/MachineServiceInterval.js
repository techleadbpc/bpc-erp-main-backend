module.exports = (sequelize, DataTypes) => {
  const MachineServiceInterval = sequelize.define(
    "MachineServiceInterval",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      machineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "machineries",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      serviceType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      intervalHours: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      intervalKm: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      intervalCalendarDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "machine_service_intervals",
      timestamps: true,
    }
  );

  MachineServiceInterval.associate = (models) => {
    MachineServiceInterval.belongsTo(models.Machinery, {
      foreignKey: "machineId",
      as: "machine",
    });
  };

  return MachineServiceInterval;
};
