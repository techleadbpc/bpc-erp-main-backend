module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define(
    "Department",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true, // Ensure no duplicate Departments
      },
    },
    {
      tableName: "departments", // Table name in your database
      timestamps: true,
      paranoid: true,
    }
  );
  Department.associate = (models) => {
    Department.belongsTo(models.User, {
      foreignKey: "id",
    });
    Department.hasMany(models.Site, { foreignKey: "id" });
  };
  return Department;
};
