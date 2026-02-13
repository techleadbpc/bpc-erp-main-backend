module.exports = (sequelize, DataTypes) => {
  const MachineryItemCode = sequelize.define(
    "MachineryItemCode",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "machinery_item_codes", // Table name in your database
      timestamps: true,
      paranoid: true,
    }
  );
  return MachineryItemCode;
};
