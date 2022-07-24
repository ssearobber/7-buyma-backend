const { Op, QueryTypes, where } = require('sequelize');
const Sequelize = require('sequelize');
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const dayjs = require('dayjs');

const { sequelize } = require('../models');
const { isNotLoggedIn, isLoggedIn } = require('./middlewares');
const User = require('../models/user');
const TodayCount = require('../models/todayCount');
const Comment = require('../models/comment');
const Product = require('../models/product');
const Order = require('../models/order');

const OtherSeller = require('../models/otherSeller');
const OtherSellerProduct = require('../models/otherSellerProduct');
const OtherSellerProductTodayCount = require('../models/otherSellerProductTodayCount');

const router = express.Router();

router.get('/products', isLoggedIn, async (req, res, next) => {
  try {
    let buymaProductIds = await Product.findAll({ attributes: ['buyma_product_id'] });

    // if (!buymaProductIds) {
    //   return res.json('500');
    // }

    let buymaProductIdArray = buymaProductIds.map(({ buyma_product_id }) => buyma_product_id);

    // let yesterday = dayjs().subtract(1, 'day');
    // console.log("yesterday : ",yesterday);

    let result = await TodayCount.findOne({
      attributes: ['buyma_product_id', [sequelize.fn('max', sequelize.col('today')), 'today']],
      where: { buyma_product_id: { [Op.in]: buymaProductIdArray } },
      group: ['buyma_product_id'],
    });
    // console.log("lastDate",result);
    let todayCounts = await TodayCount.findAll({
      attributes: ['buyma_product_id', 'buyma_product_name', 'today', 'cart', 'wish', 'access'],
      where: {
        [Op.and]: [{ today: result.today }, { buyma_product_id: { [Op.in]: buymaProductIdArray } }],
      },
      order: [['access', 'DESC']],
    });
    // console.log("todayCounts : ",todayCounts);
    return res.json(todayCounts);
  } catch (error) {
    next(error);
  }
});

router.get('/product/:productId', isLoggedIn, async (req, res, next) => {
  try {
    const todayCounts = await TodayCount.findAll({
      attributes: [
        'buyma_product_id',
        'buyma_product_name',
        'today',
        'cart',
        'wish',
        'access',
        'link',
      ],
      where: { buyma_product_id: req.params.productId },
      order: [['today', 'ASC']],
    });
    return res.json(todayCounts);
  } catch (error) {
    next(error);
  }
});

router.post('/comments', isLoggedIn, async (req, res, next) => {
  if (!req.body.productId) {
    return res.status(403).send('productId가 없습니다.');
  }

  try {
    let buymaProductResult = await Product.findOne({
      where: { buyma_product_id: req.body.productId },
    });
    let today = dayjs().format('YYYY/MM/DD');

    const comment = await Comment.create({
      user_id: req.user.id,
      product_id: buymaProductResult.id,
      author: req.body.author,
      email: req.body.email,
      content: req.body.content,
      datetime: req.body.datetime,
      create_id: req.body.author,
      date_created: today,
      update_id: req.body.author,
      last_updated: today,
    });
    res.status(201).send('ok');
  } catch (error) {
    console.error(error);
    next(error); // status 500
  }
});

router.get('/comments/:productId', isLoggedIn, async (req, res, next) => {
  try {
    let buymaProductResult = await Product.findOne({
      where: { buyma_product_id: req.params.productId },
    });

    const comments = await Comment.findAll({
      attributes: ['author', 'email', 'content', 'datetime'],
      where: { product_id: buymaProductResult.id },
      order: [['datetime', 'ASC']],
    });
    return res.json(comments);
  } catch (error) {
    next(error);
  }
});

router.get('/users', (req, res, next) => {
  // console.log("req.user" , req.user);
  // console.log("req" , req);
  return res.json(req.user || false);
});

router.post('/users', isNotLoggedIn, async (req, res, next) => {
  try {
    const exUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (exUser) {
      return res.status(403).send('이미 사용 중인 아이디입니다.');
    }
    let today = dayjs().format('YYYY/MM/DD');
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hashedPassword,
      isblock: false,
      role: 'user',
      create_id: req.body.nickname,
      date_created: today,
      update_id: req.body.nickname,
      last_updated: today,
    });
    res.status(201).send('ok');
  } catch (error) {
    console.error(error);
    next(error); // status 500
  }
});

router.post('/users/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    if (info) {
      return res.status(401).send(info.reason);
    }
    return req.login(user, async (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return next(loginErr);
      }
      // console.log("user in user.id of api.js", user.id);
      return res.status(200).json(
        await User.findOne({
          where: { id: user.id },
          attributes: ['id', 'nickname', 'email'],
        }),
      );
    });
  })(req, res, next);
});

router.post('/users/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.send('ok');
});

router.get('/orders', isNotLoggedIn, async (req, res, next) => {
  let orders = await Order.findAll({
    attributes: [
      'transaction_id',
      'product_order_date',
      'progress',
      'order',
      'row_num',
      'product_url',
      'product_count',
      'product_color',
      'product_delivery_method',
      'product_customer_jp_name',
      'product_customer_jp_address',
      'product_customer_en_name',
      'product_customer_postal_code',
      'product_customer_en_address',
      'product_customer_cell_phone_number',
      'tracking_number',
      'product_profit',
      'shipping_total_cost',
      'product_type_en',
      'product_weight',
      'product_price_en',
      'confirmation_id',
      'product_customer_en_address_1',
      'product_customer_en_address_2',
      'product_customer_en_address_3',
      'product_customer_en_address_4',
      'comment',
      'product_title',
      'naver_item_id',
      'invoice_number',
    ],
    where: {
      [Op.or]: [{ progress: 'FALSE' }, { order: 'FALSE' }],
    },
    order: [['last_updated', 'ASC']],
  });
  // console.log('orders', orders);
  return res.json(orders);
});

router.get('/otherSellers', async (req, res, next) => {
  try {
    const otherSellers = await OtherSeller.findAll({
      attributes: ['buyma_user_id', 'buyma_user_name', 'buyma_home_url'],
    });
    return res.json(otherSellers);
  } catch (error) {
    next(error);
  }
});

router.get('/otherSellers/:buymaId', isLoggedIn, async (req, res, next) => {
  try {
    // console.log(req.params.buymaId);
    if (!req.params.buymaId) return res.json([]);

    let buymaProductIds = await OtherSellerProduct.findAll({
      attributes: ['buyma_product_id'],
      where: { other_seller_id: req.params.buymaId },
    });

    // console.log('buymaProductIds', buymaProductIds);

    let buymaProductIdArray = buymaProductIds.map(({ buyma_product_id }) => buyma_product_id);

    // let yesterday = dayjs().subtract(1, 'day');
    // console.log("yesterday : ",yesterday);

    let result = await OtherSellerProductTodayCount.findOne({
      attributes: ['buyma_product_id', [sequelize.fn('max', sequelize.col('today')), 'today']],
      where: { buyma_product_id: { [Op.in]: buymaProductIdArray } },
      group: ['buyma_product_id'],
    });
    // console.log("lastDate",result);
    let todayCounts = await OtherSellerProductTodayCount.findAll({
      attributes: ['buyma_product_id', 'buyma_product_name', 'today', 'wish', 'access'],
      where: {
        [Op.and]: [{ today: result.today }, { buyma_product_id: { [Op.in]: buymaProductIdArray } }],
      },
      order: [['access', 'DESC']],
    });
    // console.log('todayCounts : ', todayCounts);
    return res.json(todayCounts);
  } catch (error) {
    next(error);
  }
});

router.get('/otherSeller-product/:productId', isLoggedIn, async (req, res, next) => {
  try {
    const todayCounts = await OtherSellerProductTodayCount.findAll({
      attributes: ['buyma_product_id', 'buyma_product_name', 'today', 'wish', 'access', 'link'],
      where: { buyma_product_id: req.params.productId },
      order: [['today', 'ASC']],
    });
    return res.json(todayCounts);
  } catch (error) {
    next(error);
  }
});

router.post('/otherSeller-comments', isLoggedIn, async (req, res, next) => {
  if (!req.body.productId) {
    return res.status(403).send('productId가 없습니다.');
  }

  try {
    let buymaProductResult = await OtherSellerProduct.findOne({
      where: { buyma_product_id: req.body.productId },
    });
    let today = dayjs().format('YYYY/MM/DD');

    const comment = await Comment.create({
      user_id: req.user.id,
      product_id: buymaProductResult.id,
      author: req.body.author,
      email: req.body.email,
      content: req.body.content,
      datetime: req.body.datetime,
      create_id: req.body.author,
      date_created: today,
      update_id: req.body.author,
      last_updated: today,
    });
    res.status(201).send('ok');
  } catch (error) {
    console.error(error);
    next(error); // status 500
  }
});

router.get('/otherSeller-comments/:productId', isLoggedIn, async (req, res, next) => {
  try {
    let buymaProductResult = await OtherSellerProduct.findOne({
      where: { buyma_product_id: req.params.productId },
    });
    let comments;
    if (buymaProductResult) {
      comments = await Comment.findAll({
        attributes: ['author', 'email', 'content', 'datetime'],
        where: { product_id: buymaProductResult.id },
        order: [['datetime', 'ASC']],
      });
    } else {
      comments = [];
    }
    return res.json(comments);
  } catch (error) {
    next(error);
  }
});
module.exports = router;
