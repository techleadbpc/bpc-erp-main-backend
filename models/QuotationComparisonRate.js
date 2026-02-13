// models/QuotationComparisonRate.js
module.exports = (sequelize, DataTypes) => {
  const QuotationComparisonRate = sequelize.define('QuotationComparisonRate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    comparisonItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quotation_comparison_items',
        key: 'id',
      },
    },
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isLowest: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'quotation_comparison_rates',
    timestamps: true,
  });

  QuotationComparisonRate.associate = (models) => {
    QuotationComparisonRate.belongsTo(models.QuotationComparisonItem, {
      foreignKey: 'comparisonItemId',
      as: 'comparisonItem',
    });
    QuotationComparisonRate.belongsTo(models.Vendor, {
      foreignKey: 'vendorId',
      as: 'vendor',
    });
  };

  return QuotationComparisonRate;
};
