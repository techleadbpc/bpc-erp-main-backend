// models/RequisitionSiteRejection.js
module.exports = (sequelize, DataTypes) => {
  const RequisitionSiteRejection = sequelize.define(
    "RequisitionSiteRejection",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      requisitionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      siteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rejectedById: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      rejectedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "requisition_site_rejections",
      timestamps: true,
      //   indexes: [
      //     {
      //       unique: true,
      //       fields: ["requisitionId", "siteId"], // Prevent duplicate rejections from same site
      //     },
      //   ],
      underscored: true,
    }
  );

  RequisitionSiteRejection.associate = (models) => {
    RequisitionSiteRejection.belongsTo(models.Requisition, {
      foreignKey: "requisitionId",
      as: "requisition",
    });
    RequisitionSiteRejection.belongsTo(models.Site, {
      foreignKey: "siteId",
      as: "site",
    });
    RequisitionSiteRejection.belongsTo(models.User, {
      foreignKey: "rejectedById",
      as: "rejectedBy",
    });
  };

  return RequisitionSiteRejection;
};
