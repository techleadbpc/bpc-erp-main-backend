// models/ProcurementItem.js
module.exports = (sequelize, DataTypes) => {
  const ProcurementItem = sequelize.define(
    "ProcurementItem",
    {
      procurementId: { type: DataTypes.INTEGER },
      requisitionItemId: { type: DataTypes.INTEGER },
      itemId: { type: DataTypes.INTEGER },
      quantity: { type: DataTypes.INTEGER },
      rate: { type: DataTypes.DECIMAL(10, 2) },
      amount: { type: DataTypes.DECIMAL(10, 2) },
      receivedQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: "procurement_items",
      timestamps: true,
    }
  );

  ProcurementItem.associate = (models) => {
    ProcurementItem.belongsTo(models.Procurement, { foreignKey: "procurementId" });
    ProcurementItem.belongsTo(models.RequisitionItem, { foreignKey: "requisitionItemId" });
    ProcurementItem.belongsTo(models.Item, { foreignKey: "itemId" });
    ProcurementItem.hasMany(models.InvoiceItem, { foreignKey: "procurementItemId" });
  };

  return ProcurementItem;
};
