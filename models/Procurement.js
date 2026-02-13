// models/Procurement.js
module.exports = (sequelize, DataTypes) => {
  const Procurement = sequelize.define(
    "Procurement",
    {
      procurementNo: { type: DataTypes.STRING, }, // e.g., "PRC-2025-0001" unique: true 
      requisitionId: { type: DataTypes.INTEGER, allowNull: false },
      vendorId: { type: DataTypes.INTEGER, allowNull: false },
      expectedDelivery: { type: DataTypes.DATE },
      notes: { type: DataTypes.TEXT },
      status: {
        type: DataTypes.ENUM("pending", "ordered", "accepted_at_virtual_site", "in_transit_to_requested_site", "delivered", "paid"),
        defaultValue: "pending",
      },
      totalAmount: { type: DataTypes.DECIMAL(10, 2) },
      quotationComparisonId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: "procurements",
      timestamps: true,
    }
  );

  Procurement.associate = (models) => {
    Procurement.belongsTo(models.Requisition, { foreignKey: "requisitionId" });
    Procurement.belongsTo(models.Vendor, { foreignKey: "vendorId" });
    Procurement.belongsTo(models.QuotationComparison, { foreignKey: "quotationComparisonId", as: "quotationComparison" });
    Procurement.hasMany(models.ProcurementItem, {
      foreignKey: "procurementId",
    });
    Procurement.hasMany(models.Invoice, {
      foreignKey: "procurementId",
      as: "invoices",
    });
    Procurement.hasMany(models.Dispatch, {
      foreignKey: "procurementId",
    });
  };

  return Procurement;
};
