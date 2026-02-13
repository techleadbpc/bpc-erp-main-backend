const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
        // unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
          this.setDataValue(
            "password",
            bcrypt.hashSync(value, bcrypt.genSaltSync(10))
          );
        },
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Every user must have a role
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Every user must belong to a department
      },
      siteId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Users can be department-level or site-level
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "archived"),
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      tableName: "users", // Table name in your database
      timestamps: true,
      paranoid: true,
      hooks: {
        afterCreate: async (user, options) => {
          const newCode = `EMP-${String(user.id).padStart(3, "0")}`;
          await user.update(
            { code: newCode },
            { transaction: options.transaction }
          );
        },
      },
    }
  );
  User.prototype.validPassword = async function (password) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      // console.error("Error comparing passwords:", error);
      return false;
    }
  };

  //hash password
  User.hashPassword = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  };

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: "roleId" });
    User.belongsTo(models.Department, { foreignKey: "departmentId" });
    User.belongsTo(models.Site, { foreignKey: "siteId" });
    User.belongsToMany(models.Notification, {
      through: models.NotificationReadStatus,
      foreignKey: "userId",
    });
  };
  return User;
};
