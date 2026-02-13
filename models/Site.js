module.exports = (sequelize, DataTypes) => {
  const Site = sequelize.define(
    "Site",
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
      type: {
        type: DataTypes.ENUM("virtual", "physical"),
        defaultValue: "physical",
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pincode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      mobileNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "closed", "paused"),
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      tableName: "sites",
      timestamps: true,
      paranoid: true,
      hooks: {
        afterCreate: async (site, options) => {
          const newCode = `SITE-${String(site.id).padStart(3, "0")}`;
          await site.update(
            { code: newCode },
            { transaction: options.transaction }
          );
        },
      },
    }
  );

  Site.associate = (models) => {
    Site.belongsTo(models.Department, {
      foreignKey: "departmentId",
    });
    Site.hasMany(models.User, {
      foreignKey: "siteId",
    });
    Site.hasMany(models.Machinery, {
      foreignKey: "siteId",
    });
  };

  return Site;
};
