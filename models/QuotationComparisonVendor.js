// models/QuotationComparisonVendor.js
module.exports = (sequelize, DataTypes) => {
  const QuotationComparisonVendor = sequelize.define('QuotationComparisonVendor', {
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
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    vendorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active', // active, rejected
    },
    // Attachment fields
    // attachmentFileName: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },
    attachmentFilePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // attachmentFileSize: {
    //   type: DataTypes.BIGINT,
    //   allowNull: true,
    // },
    // attachmentMimeType: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },
    attachmentUploadedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    attachmentUploadedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'quotation_comparison_vendors',
    timestamps: true,
  });

  QuotationComparisonVendor.associate = (models) => {
    QuotationComparisonVendor.belongsTo(models.QuotationComparison, {
      foreignKey: 'comparisonId',
      as: 'comparison',
    });
    QuotationComparisonVendor.belongsTo(models.Vendor, {
      foreignKey: 'vendorId',
      as: 'vendor',
    });
    QuotationComparisonVendor.hasMany(models.QuotationComparisonRate, {
      foreignKey: 'vendorId',
      as: 'rates',
    });
    QuotationComparisonVendor.belongsTo(models.User, {
      foreignKey: 'attachmentUploadedById',
      as: 'attachmentUploadedBy',
    });
  };

  return QuotationComparisonVendor;
};
