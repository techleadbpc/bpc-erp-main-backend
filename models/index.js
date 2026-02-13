"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const { sequelizeJoi, Joi } = require("sequelize-joi");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "dev";
const envFile = env === "prod" ? ".env.prod" : ".env.dev";
require("dotenv").config();
const config = require(__dirname + "/../configs/db.config")[env];
const db = {};
let sequelize;
if (config?.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    dialectOptions: {
      ssl: {
        require: true, // This will help you. But you will see nwe error
        rejectUnauthorized: false, // This line will fix new error
      },
    },
    logging: false,
  });
  // sequelize = new Sequelize(config.database, config.username, config.password, {
  //   ...config,
  // });
}
sequelizeJoi(sequelize);
if (env === "dev") {
  fs.readdirSync(__dirname)
    .filter((file) => {
      return (
        file.indexOf(".") !== 0 &&
        file !== basename &&
        file.slice(-3) === ".js" &&
        file.indexOf(".test.js") === -1
      );
    })
    .forEach((file) => {
      const model = require(path.join(__dirname, file))(
        sequelize,
        Sequelize.DataTypes,
        Joi
      );
      db[model.name] = model;
    });
} else {
  const modelContext = require.context(".", false, /\.js$/);
  modelContext.keys().forEach((file) => {
    if (file !== "./index.js" && file.slice(-8) !== ".test.js") {
      const model = modelContext(file)(sequelize, Sequelize.DataTypes, Joi);
      db[model.name] = model;
    }
  });
}

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
async function syncDatabase() {
  try {
    await db.Notification.sync({ alter: true });
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error("Error synchronizing the database:", error);
  }
}

// syncDatabase();
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
