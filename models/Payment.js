// models/payment.model.js
module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE_PAYMENT', 'OTHER'),
      allowNull: false
    },
    referenceNumber: DataTypes.STRING,
    slipUrl: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
      defaultValue: 'PENDING'
    },
    remarks: DataTypes.TEXT
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice'
    });
  };

  return Payment;
};