const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const hpp = require('hpp');
const helmet = require('helmet');
const passport = require('passport');

dotenv.config();
const { sequelize } = require('./models');
const passportConfig = require('./passport');
const apiRouter = require('./routes/api');

const app = express();
app.set('PORT', process.env.PORT || 3095);
sequelize
  .sync()
  .then(() => {
    console.log('DB 연결 성공');
  })
  .catch(console.error);
passportConfig();
const prod = process.env.NODE_ENV === 'production';

if (prod) {
  app.enable('trust proxy');
  app.use(morgan('combined'));
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(hpp());
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
} else {
  app.use(morgan('dev'));
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
}
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

let sessionOption = {};
if (prod) {
  sessionOption = {
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      sameSite: 'none',
    },
  };
} else {
  sessionOption = {
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
    },
  };
}

// 1. 개발모드에서 sameSite: "none"를 하게되면 passport.deserializeUser가 호출이 안되서 req.user에 값이 셋팅이 안됨
// 2. 배포모드에서 sameSite: "none"가 없으면 페이지 이동이 안됨
if (prod) {
  sessionOption.cookie.secure = true;
  sessionOption.cookie.proxy = true;
}
app.use(session(sessionOption));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', apiRouter);
app.get('*', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(app.get('PORT'), () => {
  console.log(`listening on port ${app.get('PORT')}`);
});
