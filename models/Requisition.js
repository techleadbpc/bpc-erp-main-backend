// models/Requisition.js
module.exports = (sequelize, DataTypes) => {
  const Requisition = sequelize.define(
    "Requisition",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      requisitionNo: {
        type: DataTypes.STRING,
        unique: true,
      },
      requestedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      requestingSiteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      requestedFor: {
        type: DataTypes.STRING, // could be department, user, etc.
      },
      chargeType: {
        type: DataTypes.STRING, // enum-like: "Capex", "Opex", etc.
      },
      requestPriority: {
        type: DataTypes.STRING, // enum-like: "High", "Medium", "Low"
      },
      dueDate: {
        type: DataTypes.DATE,
      },
      preparedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING, // "pending", "approved", "received", "rejected", "approvedByPm", "approvedByHo", "completed"
        defaultValue: "pending",
      },
      approvedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      approvedByPM: {
        type: DataTypes.INTEGER,
        allowNull: true, // ID of the user who approved the requisition
      },
      approvedAtPM: {
        type: DataTypes.DATE,
        allowNull: true, // timestamp of when the requisition was approved
      },
      approvedByHO: {
        type: DataTypes.INTEGER,
        allowNull: true, // ID of the user who approved the requisition
      },
      approvedAtHO: {
        type: DataTypes.DATE,
        allowNull: true, // timestamp of when the requisition was approved
      },
    },
    {
      tableName: "requisitions",
      timestamps: true,
      hooks: {
        afterCreate: async (requisition, options) => {
          const newCode = `REQ-${String(requisition.id).padStart(4, "0")}`;
          await requisition.update(
            { requisitionNo: newCode },
            { transaction: options.transaction }
          );
        },
      },
    }
  );

  Requisition.associate = (models) => {
    Requisition.hasMany(models.RequisitionItem, {
      foreignKey: "requisitionId",
      as: "items",
    });
    Requisition.belongsTo(models.User, {
      foreignKey: "preparedById",
      as: "preparedBy",
    });
    Requisition.belongsTo(models.User, {
      foreignKey: "approvedById",
      as: "approvedBy",
    });
    Requisition.belongsTo(models.User, {
      foreignKey: "completedById",
      as: "completedBy",
    });
    Requisition.belongsTo(models.User, {
      foreignKey: "rejectedById",
      as: "rejectedBy",
    });
    Requisition.belongsTo(models.User, {
      foreignKey: "approvedByPM",
      as: "approvedByPMUser",
    });
    Requisition.belongsTo(models.User, {
      foreignKey: "approvedByHO",
      as: "approvedByHOUser",
    });
    Requisition.belongsTo(models.Site, {
      foreignKey: "requestingSiteId",
      as: "requestingSite",
    });
    Requisition.hasMany(models.MaterialIssue, {
      foreignKey: "requisitionId",
      as: "materialIssues",
    });
    Requisition.hasMany(models.Procurement, {
      foreignKey: "requisitionId",
      as: "procurements",
    });
    Requisition.hasMany(models.RequisitionSiteRejection, {
      foreignKey: "requisitionId",
      as: "siteRejections",
    });
  };

  return Requisition;
};
