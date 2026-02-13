module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true, // Ensure no duplicate roles
      },
    },
    {
      tableName: "roles", // Table name in your database
      timestamps: true,
      paranoid: true,
    }
  );
  Role.associate = (models) => {
    Role.belongsTo(models.Department, {
      foreignKey: "departmentId",
    });
    Role.hasMany(models.User, { foreignKey: "id" });
    Role.belongsToMany(models.Notification, {
      through: models.NotificationRole,
      foreignKey: "roleId",
    });
  };

  return Role;
};
