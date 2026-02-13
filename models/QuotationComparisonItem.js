// models/QuotationComparisonItem.js
module.exports = (sequelize, DataTypes) => {
  const QuotationComparisonItem = sequelize.define('QuotationComparisonItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    comparisonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quotation_comparisons',
        key: 'id',
      },
    },
    requisitionItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'requisition_items',
        key: 'id',
      },
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'items',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    selectedVendorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    selected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'quotation_comparison_items',
    timestamps: true,
  });

  QuotationComparisonItem.associate = (models) => {
    QuotationComparisonItem.belongsTo(models.QuotationComparison, {
      foreignKey: 'comparisonId',
      as: 'comparison',
    });
    QuotationComparisonItem.belongsTo(models.RequisitionItem, {
      foreignKey: 'requisitionItemId',
      as: 'requisitionItem',
    });
    QuotationComparisonItem.belongsTo(models.Item, {
      foreignKey: 'itemId',
      as: 'item',
    });
    QuotationComparisonItem.belongsTo(models.Vendor, {
      foreignKey: 'selectedVendorId',
      as: 'selectedVendor',
    });
    QuotationComparisonItem.hasMany(models.QuotationComparisonRate, {
      foreignKey: 'comparisonItemId',
      as: 'rates',
    });
 };

  return QuotationComparisonItem;
};
