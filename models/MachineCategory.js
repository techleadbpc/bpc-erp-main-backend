module.exports = (sequelize, DataTypes) => {
  const MachineCategory = sequelize.define(
    "MachineCategory",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false, unique:true },
      primaryCategoryId: { type: DataTypes.INTEGER, allowNull: true },
      averageBase: {
        type: DataTypes.ENUM("Distance", "Time", "Both", "None"),
        allowNull: true,
      },
      standardKmRun: { type: DataTypes.FLOAT, allowNull: true },
      standardMileage: { type: DataTypes.FLOAT, allowNull: true },
      standardHrsRun: { type: DataTypes.FLOAT, allowNull: true },
      ltrPerHour: { type: DataTypes.FLOAT, allowNull: true },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      useFor: { type: DataTypes.STRING, allowNull: true },
      machineType: {
        type: DataTypes.ENUM("Vehicle", "Machine", "Drilling"),
        allowNull: true,
      },
      unitPerHour: { type: DataTypes.FLOAT, allowNull: true },
      isApplicable: { type: DataTypes.JSON, allowNull: true },
      other: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: "machine_categories", timestamps: true }
  );

  MachineCategory.associate = (models) => {
    MachineCategory.belongsTo(models.PrimaryCategory, {
      foreignKey: "primaryCategoryId",
      as: "primaryCategory",
    });

    MachineCategory.hasMany(models.Machinery, {
      foreignKey: "machineCategoryId",
      as: "machineries",
      onDelete: "CASCADE",
    });
  };

  return MachineCategory;
};
