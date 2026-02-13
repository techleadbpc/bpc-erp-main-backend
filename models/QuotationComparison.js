// models/QuotationComparison.js
module.exports = (sequelize, DataTypes) => {
  const QuotationComparison = sequelize.define('QuotationComparison', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    requisitionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'requisitions',
        key: 'id',
      },
    },
    comparisonNo: {
      type: DataTypes.STRING,
      unique: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'draft', // draft, submitted, approved, locked
    },
    submittedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    submissionRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvalRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lockRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
    },
  }, {
    tableName: 'quotation_comparisons',
    timestamps: true,
    hooks: {
      afterCreate: async (comparison, options) => {
        const newCode = `QC-${String(comparison.id).padStart(4, '0')}`;
        await comparison.update(
          { comparisonNo: newCode },
          { transaction: options.transaction }
        );
      },
    },
  });

  QuotationComparison.associate = (models) => {
    QuotationComparison.belongsTo(models.Requisition, {
      foreignKey: 'requisitionId',
      as: 'requisition',
    });
    QuotationComparison.belongsTo(models.User, {
      foreignKey: 'submittedById',
      as: 'submittedBy',
    });
    QuotationComparison.belongsTo(models.User, {
      foreignKey: 'approvedById',
      as: 'approvedBy',
    });
    QuotationComparison.hasMany(models.QuotationComparisonItem, {
      foreignKey: 'comparisonId',
      as: 'items',
    });
    QuotationComparison.hasMany(models.QuotationComparisonVendor, {
      foreignKey: 'comparisonId',
      as: 'vendors',
    });
    QuotationComparison.hasMany(models.QuotationComparisonVersion, {
      foreignKey: 'comparisonId',
      as: 'versions',
    });
  };

  return QuotationComparison;
};
