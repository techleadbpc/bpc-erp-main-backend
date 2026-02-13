module.exports = (sequelize, DataTypes) => {
  const ItemGroup = sequelize.define(
    "ItemGroup",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      shortName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      itemType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "item_groups",
      timestamps: false,
    }
  );

  ItemGroup.associate = (models) => {
    ItemGroup.hasMany(models.Item, { foreignKey: "itemGroupId" });
  };

  return ItemGroup;
};
