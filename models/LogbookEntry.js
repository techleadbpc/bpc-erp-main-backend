module.exports = (sequelize, DataTypes) => {
    const LogbookEntry = sequelize.define(
        "LogbookEntry",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            date: { type: DataTypes.DATE, allowNull: false },
            machineId: { type: DataTypes.INTEGER, allowNull: false },
            siteId: { type: DataTypes.INTEGER, allowNull: false },
            location: { type: DataTypes.STRING, allowNull: true },
            name: { type: DataTypes.STRING, allowNull: true, unique: true },
            dieselOpeningBalance: { type: DataTypes.FLOAT, defaultValue: 0 },
            dieselIssue: { type: DataTypes.FLOAT, defaultValue: 0 },
            dieselClosingBalance: { type: DataTypes.FLOAT, defaultValue: 0 },
            openingKmReading: { type: DataTypes.FLOAT, defaultValue: 0 },
            closingKmReading: { type: DataTypes.FLOAT, defaultValue: 0 },
            openingHrsMeter: { type: DataTypes.FLOAT, defaultValue: 0 },
            closingHrsMeter: { type: DataTypes.FLOAT, defaultValue: 0 },
            workingDetails: { type: DataTypes.TEXT, allowNull: true },
            createdBy: { type: DataTypes.INTEGER, allowNull: false },
            totalRunKM: { type: DataTypes.FLOAT, allowNull: true },
            dieselAvgKM: { type: DataTypes.FLOAT, allowNull: true },
            totalRunHrsMeter: { type: DataTypes.FLOAT, allowNull: true },
            dieselAvgHrsMeter: { type: DataTypes.FLOAT, allowNull: true },
            status: {
                type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
                defaultValue: "Pending",
            },
            approvedById: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            approvedAt: {
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
            rejectionRemarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: "logbook_entries",
            timestamps: true,
            hooks: {
                afterCreate: async (logbookEntry, options) => {
                    const newName = `LOG-${String(logbookEntry.id).padStart(3, "0")}`;
                    await logbookEntry.update({ name: newName }, { transaction: options.transaction });
                },
            }
        }
    );

    LogbookEntry.associate = (models) => {
        LogbookEntry.belongsTo(models.Site, {
            foreignKey: "siteId",
            as: "site",
        });
        LogbookEntry.belongsTo(models.Machinery, {
            foreignKey: "machineId",
            as: "machine",
        });
        LogbookEntry.belongsTo(models.User, {
            foreignKey: "createdBy",
            as: "creater",
        });
        LogbookEntry.belongsTo(models.User, {
            foreignKey: "approvedById",
            as: "approvedBy",
        });
        LogbookEntry.belongsTo(models.User, {
            foreignKey: "rejectedById",
            as: "rejectedBy",
        });
    };
    return LogbookEntry;
};
