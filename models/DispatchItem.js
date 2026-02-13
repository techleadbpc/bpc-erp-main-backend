module.exports = (sequelize, DataTypes) => {
    const DispatchItem = sequelize.define(
        "DispatchItem",
        {
            dispatchId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            itemId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: "dispatch_items",
            timestamps: true,
        }
    );

    DispatchItem.associate = (models) => {
        DispatchItem.belongsTo(models.Dispatch, { foreignKey: "dispatchId" });
        DispatchItem.belongsTo(models.Item, { foreignKey: "itemId" });
    };

    return DispatchItem;
};
