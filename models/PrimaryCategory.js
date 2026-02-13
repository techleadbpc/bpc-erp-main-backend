module.exports = (sequelize, DataTypes) => {
  const PrimaryCategory = sequelize.define(
    "PrimaryCategory",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
    },
    { tableName: "primary_categories", timestamps: true }
  );

  PrimaryCategory.associate = (models) => {
    PrimaryCategory.hasMany(models.MachineCategory, {
      foreignKey: "primaryCategoryId",
      as: "machineCategories",
      onDelete: "CASCADE",
    });

    PrimaryCategory.hasMany(models.Machinery, {
      foreignKey: "primaryCategoryId",
      as: "machineries",
      onDelete: "CASCADE",
    });
  };

  return PrimaryCategory;
};
