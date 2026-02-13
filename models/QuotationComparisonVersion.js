// models/QuotationComparisonVersion.js
module.exports = (sequelize, DataTypes) => {
  const QuotationComparisonVersion = sequelize.define('QuotationComparisonVersion', {
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
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    changes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    changedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
    },
  }, {
    tableName: 'quotation_comparison_versions',
    timestamps: false,
  });

  QuotationComparisonVersion.associate = (models) => {
    QuotationComparisonVersion.belongsTo(models.QuotationComparison, {
      foreignKey: 'comparisonId',
      as: 'comparison',
    });
    QuotationComparisonVersion.belongsTo(models.User, {
      foreignKey: 'changedById',
      as: 'changedBy',
    });
  };

  return QuotationComparisonVersion;
};
