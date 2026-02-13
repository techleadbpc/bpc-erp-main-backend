// models/InvoiceItem.js
module.exports = (sequelize, DataTypes) => {
  const InvoiceItem = sequelize.define(
    "InvoiceItem",
    {
      invoiceId: { type: DataTypes.INTEGER, allowNull: false },
      procurementItemId: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      rate: { type: DataTypes.DECIMAL(10, 2) },
      amount: { type: DataTypes.DECIMAL(10, 2) },
    },
    {
      tableName: "invoice_items",
      timestamps: true,
    }
  );

  InvoiceItem.associate = (models) => {
    InvoiceItem.belongsTo(models.Invoice, { foreignKey: "invoiceId" });
    InvoiceItem.belongsTo(models.ProcurementItem, {
      foreignKey: "procurementItemId",
    });
  };

  return InvoiceItem;
};
