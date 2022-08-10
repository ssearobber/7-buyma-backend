const Sequelize = require('sequelize');

const User = require('./user');
const TodayCount = require('./todayCount');
const Comment = require('./comment');
const Product = require('./product');
const Order = require('./order');
const OtherSeller = require('./otherSeller');
const OtherSellerProductTodayCount = require('./otherSellerProductTodayCount');
const OtherSellerProduct = require('./otherSellerProduct');
const TemporaryProductCount = require('./temporaryProductCount');
const TemporaryOtherSellerProductCount = require('./temporaryOtherSellerProductCount');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = User;
db.TodayCount = TodayCount;
db.Comment = Comment;
db.Product = Product;
db.Order = Order;
db.OtherSeller = OtherSeller;
db.OtherSellerProduct = OtherSellerProduct;
db.OtherSellerProductTodayCount = OtherSellerProductTodayCount;
db.TemporaryProductCount = TemporaryProductCount;
db.TemporaryOtherSellerProductCount = TemporaryOtherSellerProductCount;

User.init(sequelize);
TodayCount.init(sequelize);
Comment.init(sequelize);
Product.init(sequelize);
Order.init(sequelize);
OtherSeller.init(sequelize);
OtherSellerProduct.init(sequelize);
OtherSellerProductTodayCount.init(sequelize);
TemporaryProductCount.init(sequelize);
TemporaryOtherSellerProductCount.init(sequelize);

TemporaryProductCount.belongsTo(TodayCount, {
  foreignKey: 'buyma_product_id',
  targetKey: 'buyma_product_id',
});
TemporaryOtherSellerProductCount.belongsTo(OtherSellerProductTodayCount, {
  foreignKey: {
    name: 'buyma_product_id',
    allowNull: true,
  },
  targetKey: 'buyma_product_id',
});
// User.associate(db);
// Comment.associate(db);

module.exports = db;
