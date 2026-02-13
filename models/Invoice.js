// models/invoice.model.js
module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    "Invoice",
    {
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      invoiceDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "DRAFT",
          "SENT",
          "PAID",
          "PARTIALLY_PAID",
          "CANCELLED"
        ),
        defaultValue: "DRAFT",
      },
      files: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      notes: DataTypes.TEXT,
      isInventoryUpdated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "invoices",
      timestamps: true,
    }
  );

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Procurement, {
      foreignKey: "procurementId",
      as: "procurement",
    });
    Invoice.hasMany(models.Payment, {
      foreignKey: "invoiceId",
      as: "payments",
    });
    Invoice.hasMany(models.InvoiceItem, {
      foreignKey: "invoiceId",
      as: "items",
    });
  };

  return Invoice;
};
