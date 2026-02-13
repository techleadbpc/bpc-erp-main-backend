module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define(
    "Unit",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      shortName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      decimalPlaces: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "units",
      timestamps: false,
    }
  );

  Unit.associate = (models) => {
    Unit.hasMany(models.Item, { foreignKey: "unitId" });
  };

  return Unit;
};
