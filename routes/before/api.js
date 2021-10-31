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

const router = express.Router();

router.get("/products", isLoggedIn , async (req, res, next) => {
  try {
    let query = `
      SELECT distinct productId FROM todayCount
    `;
    let productIds = await sequelize.query(query, 
        {
          type: QueryTypes.SELECT, 
          raw: true
    });
    
    let productIdArray = productIds.map(({ productId }) => productId)

    let yesterday = dayjs().subtract(1, 'day');
    // console.log("yesterday : ",yesterday);
    let todayCounts = await TodayCount.findAll(
      { attributes: ['productId', 'productName', 'today', 'cart', 'wish', 'access'], 
        where: {[Op.and]: [{ today: {[Op.gte]: yesterday }},{productId : {[Op.in]: productIdArray}}]},
        order: [["access", "DESC"]]
      });
    // let todayCounts = await TodayCount.findAll(
    //   { attributes: ['productId', 'productName', 'today', 'cart', 'wish', 'access'], 
    //     where: {[Op.and]: [{ id: {[Op.between]: [99344, 99994] }},{productId : {[Op.in]: productIdArray}}]},
    //     order: [["access", "DESC"]]
    //   });
    // console.log("todayCounts : ",todayCounts);
    return res.json(todayCounts);
  } catch (error) {
    next(error);
  }
});

router.get("/product/:productId", isLoggedIn , async (req, res, next) => {
  try {
    const todayCounts = await TodayCount.findAll(
      { attributes: ['productId', 'productName', 'today', 'cart' , 'wish', 'access', 'link'], where: { productId: req.params.productId }, order: [["today", "ASC"]],});
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
    const comment = await Comment.create({
      author: req.body.author,
      email: req.body.email,
      content: req.body.content,
      datetime: req.body.datetime,
      productId: req.body.productId,
    });
    res.status(201).send("ok");
  } catch (error) {
      console.error(error);
      next(error); // status 500
  }
})

router.get("/comments/:productId", isLoggedIn, async (req, res, next) => {
  try {
    const comments = await Comment.findAll(
      { attributes: ['author', 'email', 'content', 'datetime' , 'productId'], where: { productId: req.params.productId }, order: [["datetime", "ASC"]],});
    return res.json(comments);
  } catch (error) {
    next(error);
  }
})

router.get("/users", (req, res, next) => {
  // console.log("req.user" , req.user);
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
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hashedPassword,
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
