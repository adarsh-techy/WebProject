// var createError = require("http-errors");
require("dotenv").config(); 
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const mongoose = require("mongoose");
const session = require("express-session");
// const multer = require("multer");
// const upload = multer();

var app = express();

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true for HTTPS
  })
);

app.use((req, res, next) => {
  res.locals.userEmail = req.session.userEmail || null;
  res.locals.userName = req.session.userName || null;
  next();
});

const connectDB = require("./database/db.js");
connectDB();

const expressLayouts = require("express-ejs-layouts");
var indexRouter = require("./routes/index.js");
var userRouter = require("./routes/user.js");
var concertRouter = require("./routes/concert.js");
// var apiRouter = require("./routes/api.js");
var contactRouter = require("./routes/contact.js");
// const eventRouter = require("./routes/events.js");
const adminRouter = require("./routes/admin.js");
// const userApiRouter = require("./routes/api/user.js")

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set("layout", "layouts/main-layout");

app.use(expressLayouts);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));




app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/concert", concertRouter);
// app.use("/api", apiRouter);
app.use("/cntact", contactRouter);
// app.use("/events", eventRouter);
app.use("/admin", adminRouter);
// app.use("/userApi",userApiRouter);


// ─── JWT‐BASED (JSON) API ROUTES ───────────────────────────────────────────────
// Each of these files should export an Express.Router()
// and use your models + verifyToken middleware where appropriate.
app.use("/api/admin",    require("./routes/api/admin.js"));      // e.g. POST /api/admin/login (returns JWT)
app.use("/api/user",     require("./routes/api/user.js"));       // e.g. POST /api/user/register, /api/user/login
app.use("/api/concerts", require("./routes/api/concert.js"));    // GET /api/concerts  & GET /api/concerts/:id
app.use("/api/bookings", require("./routes/api/bookings.js"));   // POST /api/bookings/:concertId, GET /api/bookings/my

// asdfghjkl;

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
