require('dotenv').config();

module.exports = {
  //   "development": {
  //   "username": "root",
  //   "password": "1234",
  //   "database": "buyma_test",
  //   "host": "127.0.0.1",
  //   "dialect": "mysql"
  // },
  "development": {
    "username": process.env.MYSQL_USERNAME || mysqlUsername,
    "password": process.env.MYSQL_PASSWORD || mysqlPassword,
    "database": process.env.MYSQL_DATABASE || mysqlDatabase,
    "host": process.env.MYSQL_HOST || mysqlHost,
    "dialect": "mysql"
  },
  "test": {
    "username": "root",
    "password": process.env.MYSQL_PASSWORD,
    "database": "buyma_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": process.env.MYSQL_USERNAME || mysqlUsername,
    "password": process.env.MYSQL_PASSWORD || mysqlPassword,
    "database": process.env.MYSQL_DATABASE || mysqlDatabase,
    "host": process.env.MYSQL_HOST || mysqlHost,
    "dialect": "mysql"
  }
}
