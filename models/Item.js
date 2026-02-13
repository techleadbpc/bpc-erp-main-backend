module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define(
    "Item",
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
        allowNull: true,
      },
      partNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hsnCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      itemGroupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "items",
      timestamps: false,
    }
  );

  Item.associate = (models) => {
    Item.belongsTo(models.ItemGroup, { foreignKey: "itemGroupId" });
    Item.belongsTo(models.Unit, { foreignKey: "unitId" });
    Item.hasMany(models.SiteInventory, { foreignKey: "itemId" });
  };

  return Item;
};
