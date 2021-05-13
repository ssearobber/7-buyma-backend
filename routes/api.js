const { Op, QueryTypes } = require("sequelize");
const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const dayjs = require("dayjs");

const { sequelize } = require("../models");
const { isNotLoggedIn, isLoggedIn } = require("./middlewares");
const User = require("../models/user");
const TodayCount = require("../models/todayCount");

const router = express.Router();

router.get("/products", isNotLoggedIn , async (req, res, next) => {
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

    // let yesterday = dayjs().subtract(1, 'day').format("YYYY-MM-DD");
    let yesterday = dayjs().subtract(1, 'day');
    console.log("yesterday", yesterday);

    let todayCounts = await TodayCount.findAll(
      { attributes: ['productId', 'productName', 'today', 'cart', 'wish', 'access'], 
        where: {[Op.and]: [{ today: {[Op.gte]: yesterday }},{productId : {[Op.in]: productIdArray}}]},
        order: [["access", "ASC"]]
      });
    
      // console.log("todayCounts",todayCounts);
    
    // productId의 중복을 제거한 모든 레코드 취득
    // todayCounts = todayCounts.filter((item, i) => {
    //   return (
    //     todayCounts.findIndex((item2, j) => {
    //       return item.dataValues.productId === item2.dataValues.productId;
    //     }) === i
    //   );
    // });
    return res.json(todayCounts);
  } catch (error) {
    next(error);
  }
});

router.get("/product/:productId", isLoggedIn , async (req, res, next) => {
  try {
    const todayCounts = await TodayCount.findAll(
      { attributes: ['productId', 'productName', 'today', 'cart' , 'wish', 'access' ], where: { productId: req.params.productId }, order: [["today", "ASC"]],});
    return res.json(todayCounts);
  } catch (error) {
    next(error);
  }
});

router.get("/users", (req, res, next) => {
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
