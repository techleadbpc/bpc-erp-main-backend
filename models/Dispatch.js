module.exports = (sequelize, DataTypes) => {
    const Dispatch = sequelize.define(
        "Dispatch",
        {
            vehicleNo: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            driverName: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            remarks: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            procurementId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            fromSiteId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            toSiteId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM("dispatched", "received"),
                defaultValue: "dispatched",
            },
        },
        {
            tableName: "dispatches",
            timestamps: true,
        }
    );

    Dispatch.associate = (models) => {
        Dispatch.belongsTo(models.Procurement, { foreignKey: "procurementId" });
        Dispatch.belongsTo(models.Site, { as: "fromSite", foreignKey: "fromSiteId" });
        Dispatch.belongsTo(models.Site, { as: "toSite", foreignKey: "toSiteId" });
        Dispatch.hasMany(models.DispatchItem, { foreignKey: "dispatchId", as: "items" });
    };

    return Dispatch;
};
