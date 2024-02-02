const mongoose = require("mongoose");
const express = require("express");
const fs = require("fs");
const https = require("https");
const cors = require("cors");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

// MONGODB -----------------------------------
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);

// configure where to store session
const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.uksrjq4.mongodb.net/${process.env.MONGODB_DEFAULT_DATABASE}?retryWrites=true&w=majority`;
console.log(MONGODB_URI);
const store = new MongoDbStore({ uri: MONGODB_URI, collection: "sessions" });

// IMAGE UPLOAD ------------------------------
// configure where to store uploaded images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + "-" + file.originalname);
  }
});

// filter unexcepted file format
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// MODELS ---------------------------------
const User = require("./models/user");

// CONTROLLERS ----------------------------
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

// SSL SETUP ----------------------------
// read private key & cert
// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

const app = express();

app.use(
  cors({
    origin:
      "https://65bb659e7810d70009c54afd--velvety-meringue-2cfa3e.netlify.app",
    credentials: true,
    methods: ["GET, POST, PUT, DELETE, OPTIONS, HEAD"],
    allowedHeaders: "Content-Type,Authorization"
  })
);

app.set("trust proxy", 1);

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"), // store logging in this file
  { flags: "a" } // append new logging, not overwrite
);

app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// image's path: 'public/images/...' => must expose 'public' folder to root & target request sent to '/public'
app.use("/public", express.static(path.join(__dirname, "public")));

// configure uploaded files
app.use(
  multer({ storage: imageStorage, fileFilter: fileFilter }).single("image")
);

// session middleware
app.use(
  session({
    secret: "my super extra secret key",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      sameSite: "lax",
      secure: true,
      maxAge: 1000 * 60 * 60
    }
  })
);

app.use(async (req, res, next) => {
  // console.log(req.session);
  try {
    if (!req.session.user) {
      return next();
    }
    // Find user object and its method => add them to every request
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return next();
    }
    req.user = user;
    next();
  } catch (err) {
    return next(err);
  }
});

app.use(adminRoutes);
app.use(authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ msg: message, data: data });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
    const server = app.listen(process.env.PORT || 5000);
    // const server = https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    //   .listen(process.env.PORT || 5000);
    // io set up all the web socket stuffs behind the scene for us
    // use http to establish socket's connection
    const io = require("./socket").init(server);
    // wait a new connection (whenever a new client connects to us)
    io.on("connection", (socket) => {
      // socket represents the connection between server and client
      // this function will be executed for every new client that connects
      console.log("Client connected");
    });
  })
  .catch((err) => {
    console.log(err);
  });
