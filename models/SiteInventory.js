// models/SiteInventory.js
module.exports = (sequelize, DataTypes) => {
  const SiteInventory = sequelize.define("SiteInventory", {
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    minimumLevel: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("In Stock", "Out of Stock", "Low Stock"),
      allowNull: false,
      defaultValue: "In Stock",
    },
    lockedQuantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: "site_inventories",
    timestamps: true,
  });

  SiteInventory.associate = (models) => {
    SiteInventory.belongsTo(models.Site, { foreignKey: "siteId" });
    SiteInventory.belongsTo(models.Item, { foreignKey: "itemId" });
  };

  return SiteInventory;
};
