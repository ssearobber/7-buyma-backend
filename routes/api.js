const { Op } = require("sequelize");
const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const { sequelize } = require("../models");
const { isNotLoggedIn, isLoggedIn } = require("./middlewares");
const User = require("../models/user");
const TodayCount = require("../models/todayCount");
// const Workspace = require("../models/workspace");
// const Channel = require("../models/channel");
// const ChannelChat = require("../models/channelChat");
// const DM = require("../models/dm");

const router = express.Router();

router.get("/todayCount", async (req, res, next) => {
  try {
    const todayCounts = await TodayCount.findAll(
      { attributes: ['productId', 'productName' ], where: {cart:0}});
    return res.json(todayCounts);
  } catch (error) {
    next(error);
  }
});
// router.get("/workspaces", isLoggedIn, async (req, res, next) => {
//   try {
//     const workspaces = await Workspace.findAll({
//       include: [
//         {
//           model: User,
//           as: "Members",
//           attributes: ["id"],
//           through: {
//             where: { UserId: req.user.id },
//             attributes: ["UserId"],
//           },
//         },
//       ],
//     });
//     return res.json(workspaces);
//   } catch (error) {
//     next(error);
//   }
// });

// router.post("/workspaces", isLoggedIn, async (req, res, next) => {
//   const t = await sequelize.transaction();
//   try {
//     const exWorkspace = await Workspace.findOne({
//       where: { url: req.body.url },
//     });
//     if (exWorkspace) {
//       await t.rollback();
//       return res.status(404).send("사용중인 워크스페이스 URL입니다.");
//     }
//     const workspace = await Workspace.create(
//       {
//         name: req.body.workspace,
//         url: req.body.url,
//         OwnerId: req.user.id,
//       },
//       {
//         transaction: t,
//       }
//     );
//     await workspace.addMembers(req.user.id, { transaction: t });
//     const channel = await Channel.create(
//       {
//         name: "일반",
//         WorkspaceId: workspace.id,
//       },
//       {
//         transaction: t,
//       }
//     );
//     await channel.addMembers(req.user.id, { transaction: t });
//     await t.commit();
//     return res.json(workspace);
//   } catch (error) {
//     await t.rollback();
//     next(error);
//   }
// });

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
