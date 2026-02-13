module.exports = (sequelize, DataTypes) => {
  const MaterialIssue = sequelize.define(
    "MaterialIssue",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      issueNumber: {
        type: DataTypes.STRING,
        unique: true,
      },
      issueDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      issueType: {
        type: DataTypes.ENUM("Consumption", "Site Transfer"),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "Pending",
      },
      siteId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      otherSiteId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      requisitionId: {
        type: DataTypes.INTEGER,
        allowNull: true, // only present if issued against a requisition
      },
      approvedById: {
        type: DataTypes.INTEGER,
        allowNull: true, // ID of the user who approved the issue
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true, // timestamp of when the issue was approved
      },
      issuedById: {
        type: DataTypes.INTEGER,
        allowNull: true, // ID of the user who issued the materials
      },
      issuedAt: {
        type: DataTypes.DATE,
        allowNull: true, // timestamp of when the materials were issued
      },
      consumedById: {
        type: DataTypes.INTEGER,
        allowNull: true, // ID of the user who consumed the materials
      },
      consumedAt: {
        type: DataTypes.DATE,
        allowNull: true, // timestamp of when the materials were consumed
      },
      dispatchedById: {
        type: DataTypes.INTEGER,
        allowNull: true, // ID of the user who dispatched the materials
      },
      dispatchedAt: {
        type: DataTypes.DATE,
        allowNull: true, // timestamp of when the materials were dispatched
      },
      receivedById: {
        type: DataTypes.INTEGER,
        allowNull: true, // ID of the user who received the materials
      },
      receivedAt: {
        type: DataTypes.DATE,
        allowNull: true, // timestamp of when the materials were received
      },
      rejectedById: {
        type: DataTypes.INTEGER,
        allowNull: true, // ID of the user who rejected the issue
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true, // timestamp of when the issue was rejected
      },
      rejectionReason: {
        type: DataTypes.STRING,
        allowNull: true, // Optional rejection reason
      },
    },
    {
      tableName: "material_issues",
      timestamps: true,
      hooks: {
        afterCreate: async (issue, options) => {
          const code = `ISS-${String(issue.id).padStart(3, "0")}`;
          await issue.update(
            { issueNumber: code },
            { transaction: options.transaction }
          );
        },
      },
    }
  );

  MaterialIssue.associate = (models) => {
    MaterialIssue.hasMany(models.MaterialIssueItem, {
      foreignKey: "materialIssueId",
      as: "items",
    });
    MaterialIssue.belongsTo(models.Site, {
      foreignKey: "siteId",
      as: "fromSite",
    });
    MaterialIssue.belongsTo(models.Site, {
      foreignKey: "otherSiteId",
      as: "toSite",
    });
    MaterialIssue.belongsTo(models.Requisition, {
      foreignKey: "requisitionId",
      as: "requisition",
    });
    MaterialIssue.belongsTo(models.User, {
      foreignKey: "issuedById",
      as: "issuedBy",
    });
    MaterialIssue.belongsTo(models.User, {
      foreignKey: "approvedById",
      as: "approvedBy",
    });
    MaterialIssue.belongsTo(models.User, {
      foreignKey: "dispatchedById",
      as: "dispatchedBy",
    });
    MaterialIssue.belongsTo(models.User, {
      foreignKey: "receivedById",
      as: "receivedBy",
    });
    MaterialIssue.belongsTo(models.User, {
      foreignKey: "rejectedById",
      as: "rejectedBy",
    });
    MaterialIssue.belongsTo(models.User, {
      foreignKey: "consumedById",
      as: "consumedBy",
    });

  };

  return MaterialIssue;
};
