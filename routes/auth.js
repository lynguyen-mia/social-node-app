const express = require("express");
const router = express.Router();
const isAuth = require("../middlewares/isAuth");
const { check } = require("express-validator");

const authController = require("../controllers/auth");

router.post(
  "/register",
  [
    check("email").trim().isEmail().withMessage("Invalid email"),
    check("name").trim().notEmpty().withMessage("Invalid name"),
    check("password")
      .trim()
      .isString()
      .isLength({ min: 6 })
      .withMessage("Password must have at least 6 characters")
  ],
  authController.postRegister
);

router.post(
  "/login",
  [
    check("email").trim().isEmail().withMessage("Invalid email"),
    check("password")
      .trim()
      .isString()
      .isLength({ min: 6 })
      .withMessage("Password must have at least 6 characters")
  ],
  authController.postLogin
);

router.use("/logout", isAuth, authController.logout);

module.exports = router;
