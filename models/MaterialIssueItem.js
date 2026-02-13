module.exports = (sequelize, DataTypes) => {
  const MaterialIssueItem = sequelize.define(
    "MaterialIssueItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      materialIssueId: {
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
      },
      issueTo: {
        type: DataTypes.STRING, // could be vehicle number, person, etc.
        allowNull: true,
      },
      siteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      otherSiteId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      machineId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "material_issue_items",
      timestamps: false,
    }
  );

  MaterialIssueItem.associate = (models) => {
    MaterialIssueItem.belongsTo(models.Item, { foreignKey: "itemId" });
    MaterialIssueItem.belongsTo(models.MaterialIssue, {
      foreignKey: "materialIssueId",
    });
    MaterialIssueItem.belongsTo(models.Site, {
      foreignKey: "siteId",
      as: "fromSite",
    });
    MaterialIssueItem.belongsTo(models.Site, {
      foreignKey: "otherSiteId",
      as: "toSite",
    });
    MaterialIssueItem.belongsTo(models.Machinery, {
      foreignKey: "machineId",
      as: "machine",
    });
  };

  return MaterialIssueItem;
};
