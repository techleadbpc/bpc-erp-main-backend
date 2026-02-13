module.exports = (sequelize, DataTypes) => {
  const StockLog = sequelize.define(
    "StockLog",
    {
      siteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      change: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("IN", "OUT"),
        allowNull: false,
      },
      sourceType: {
        type: DataTypes.STRING, // e.g., "Requisition", "Issue", etc.
      },
      sourceId: {
        type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "stock_logs",
      timestamps: true,
    }
  );

  StockLog.associate = (models) => {
    StockLog.belongsTo(models.Site, { foreignKey: "siteId" });
    StockLog.belongsTo(models.Item, { foreignKey: "itemId" });
    StockLog.belongsTo(models.User, { foreignKey: "userId" });
  };

  return StockLog;
};
