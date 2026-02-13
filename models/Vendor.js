// models/Vendor.js
module.exports = (sequelize, DataTypes) => {
  const Vendor = sequelize.define(
    "Vendor",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      contactPerson: { type: DataTypes.STRING },
      phone: { type: DataTypes.STRING },
      address: { type: DataTypes.TEXT },
    },
    {
      tableName: "vendors",
      timestamps: true,
    }
  );

  Vendor.associate = (models) => {
    Vendor.hasMany(models.Procurement, { foreignKey: "vendorId" });
  };

  return Vendor;
};
