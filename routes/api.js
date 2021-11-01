const { Op, QueryTypes } = require("sequelize");
const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const dayjs = require("dayjs");

const { sequelize } = require("../models");
const { isNotLoggedIn, isLoggedIn } = require("./middlewares");
const User = require("../models/user");
const TodayCount = require("../models/todayCount");
const Comment = require("../models/comment");
const Product = require('../models/product');

const router = express.Router();

router.get("/products", isLoggedIn , async (req, res, next) => {
  try {
    let buymaProductIds = await Product.findAll({attributes: ['buyma_product_id']});
    
    let buymaProductIdArray = buymaProductIds.map(({ buyma_product_id }) => buyma_product_id);

    let yesterday = dayjs().subtract(1, 'day');
    // console.log("yesterday : ",yesterday);
    let todayCounts = await TodayCount.findAll(
      { attributes: ['buyma_product_id', 'buyma_product_name', 'today', 'cart', 'wish', 'access'], 
        where: {[Op.and]: [{ today: {[Op.gte]: yesterday }},{buyma_product_id : {[Op.in]: buymaProductIdArray}}]},
        order: [["access", "DESC"]]
      });
    return res.json(todayCounts);
  } catch (error) {
    next(error);
  }
});

router.get("/product/:productId", isLoggedIn , async (req, res, next) => {
  try {
    const todayCounts = await TodayCount.findAll(
      { attributes: ['buyma_product_id', 'buyma_product_name', 'today', 'cart' , 'wish', 'access', 'link'], where: { buyma_product_id: req.params.productId }, order: [["today", "ASC"]],});
    return res.json(todayCounts);
  } catch (error) {
    next(error);
  }
});

router.post("/comments", isLoggedIn, async (req, res, next) => {
  if (!req.body.productId ) {
    return res.status(403).send("productId가 없습니다.");
  }

  try {
    let buymaProductResult = await Product.findOne({
                    where: { buyma_product_id: req.body.productId}});
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
    res.status(201).send("ok");
  } catch (error) {
      console.error(error);
      next(error); // status 500
  }
})

router.get("/comments/:productId", isLoggedIn, async (req, res, next) => {
  try {
    let buymaProductResult = await Product.findOne({
                    where: { buyma_product_id: req.params.productId}});

    const comments = await Comment.findAll(
      { attributes: ['author', 'email', 'content', 'datetime'], where: { product_id: buymaProductResult.id }, order: [["datetime", "ASC"]],});
    return res.json(comments);
  } catch (error) {
    next(error);
  }
})

router.get("/users", (req, res, next) => {
  // console.log("req.user" , req.user);
  // console.log("req" , req);
  return res.json(req.user || false);
});

router.post("/users", isNotLoggedIn, async (req, res, next) => {
  try {
    const exUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (exUser) {
      return res.status(403).send("이미 사용 중인 아이디입니다.");
    }
    let today = dayjs().format('YYYY/MM/DD');
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hashedPassword,
      isblock: false,
      role: "user",
      create_id: req.body.nickname,
      date_created: today,
      update_id: req.body.nickname,
      last_updated: today,
    });
    res.status(201).send("ok");
  } catch (error) {
    console.error(error);
    next(error); // status 500
  }
});

router.post("/users/login", isNotLoggedIn, (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
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
          attributes: ["id", "nickname", "email"],
        })
      );
    });
  })(req, res, next);
});

router.post("/users/logout", isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.send("ok");
});

module.exports = router;
