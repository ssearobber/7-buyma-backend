const passport = require("passport");
const local = require("./local");
const User = require("../models/user");

module.exports = () => {
  passport.serializeUser((user, done) => {
    // 서버쪽에 [{ id: 1, cookie: 'clhxy' }]
    // console.log("user in user.id of serializeUser in index.js", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    // console.log("user in user.id of deserializeUser in index.js", id);
    try {
      const user = await User.findOne({
        where: { id },
        attributes: ["id", "nickname", "email"],
      });
      done(null, user); // req.user
    } catch (error) {
      console.error(error);
      done(error);
    }
  });

  local();
};
