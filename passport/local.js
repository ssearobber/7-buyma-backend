const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt');

const User = require('../models/user');

module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    //session: true, // 세션에 저장 여부 (20211031 추가)
    //passReqToCallback: true, //  (20211031 추가)
  }, async (email, password, done) => {
    try {
      const user = await User.findOne({
        where: { email }
      });
      // console.log("user in local.js", user);
      if (!user) {
        return done(null, false, { reason: '존재하지 않는 이메일입니다!' });
      }
      const result = await bcrypt.compare(password, user.password);
      // console.log("result in local.js", result);
      if (result) {
        return done(null, user);
      }
      return done(null, false, { reason: '비밀번호가 틀렸습니다.' });
    } catch (error) {
      console.error(error);
      return done(error);
    }
  }));
};
