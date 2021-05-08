const Sequelize = require("sequelize");

const User = require("./user");
const TodayCount = require("./todayCount");

const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = User;
db.TodayCount = TodayCount;

User.init(sequelize);
TodayCount.init(sequelize);

module.exports = db;
