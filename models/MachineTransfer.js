module.exports = (sequelize, DataTypes) => {
  const MachineTransfer = sequelize.define(
    "MachineTransfer",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      machineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      currentSiteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      destinationSiteId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      requestType: {
        type: DataTypes.ENUM("Site Transfer", "Sell Machine", "Scrap Machine"),
        defaultValue: "Site Transfer",
      },
      status: {
        type: DataTypes.ENUM(
          "Pending",
          "Approved",
          "Dispatched",
          "Received",
          "Rejected"
        ),
        defaultValue: "Pending",
      },
      vehicleType: {
        type: DataTypes.ENUM("self_carrying", "other_carrying"),
        allowNull: true,
        defaultValue: "other_carrying",
      },
      selfCarryingVehicle: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      reason: DataTypes.STRING,
      requestedBy: DataTypes.INTEGER,
      approvedBy: DataTypes.INTEGER,
      rejectedBy: DataTypes.INTEGER,
      dispatchedBy: DataTypes.INTEGER,
      receivedBy: DataTypes.INTEGER,
      requestedAt: DataTypes.DATE,
      approvedAt: DataTypes.DATE,
      dispatchedAt: DataTypes.DATE,
      receivedAt: DataTypes.DATE,
      rejectedAt: DataTypes.DATE,
      transportDetails: DataTypes.JSON,
      scrapDetails: DataTypes.JSON,
      buyerDetails: DataTypes.JSON,
      itemsIncluded: DataTypes.JSON,
      itemsReceived: DataTypes.JSON,
      odometerReading: DataTypes.STRING,
      fuelGaugeReading: DataTypes.STRING,
      hrsMeter: DataTypes.STRING,
      dispatchRemarks: DataTypes.STRING,
      approveRemarks: DataTypes.STRING,
      rejectionRemarks: { type: DataTypes.STRING },
      finalRemarks: { type: DataTypes.STRING },
      files: {
        type: DataTypes.JSON,
      },
    },
    {
      tableName: "machine_transfers",
      timestamps: true,
      paranoid: true,
      hooks: {
        afterCreate: async (transfer, options) => {
          let prefix = "MT"; // default

          switch (transfer.requestType) {
            case "Sell Machine":
              prefix = "MT-SL";
              break;
            case "Scrap Machine":
              prefix = "MT-SCR";
              break;
            case "Site Transfer":
            default:
              prefix = "MT-TR";
              break;
          }

          const name = `${prefix}-${String(transfer.id).padStart(4, "0")}`;
          await transfer.update({ name }, { transaction: options.transaction });
        },
      },
    }
  );

  MachineTransfer.associate = (models) => {
    MachineTransfer.belongsTo(models.Site, {
      foreignKey: "currentSiteId",
      as: "currentSite",
    });
    MachineTransfer.belongsTo(models.Site, {
      foreignKey: "destinationSiteId",
      as: "destinationSite",
    });
    MachineTransfer.belongsTo(models.Machinery, {
      foreignKey: "machineId",
      as: "machine",
    });
    MachineTransfer.belongsTo(models.User, {
      foreignKey: "requestedBy",
      as: "requester",
    });
    MachineTransfer.belongsTo(models.User, {
      foreignKey: "approvedBy",
      as: "approver",
    });
    MachineTransfer.belongsTo(models.User, {
      foreignKey: "dispatchedBy",
      as: "dispatcher",
    });
    MachineTransfer.belongsTo(models.User, {
      foreignKey: "receivedBy",
      as: "receiver",
    });
    MachineTransfer.belongsTo(models.User, {
      foreignKey: "rejectedBy",
      as: "rejecter",
    });
  };
  return MachineTransfer;
};
