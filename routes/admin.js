const express = require("express");
const isAuth = require("../middlewares/isAuth");
const router = express.Router();
const { check } = require("express-validator");
const adminController = require("../controllers/admin");

router.post(
  "/create-post",
  [
    check("title").trim().notEmpty().withMessage("Please enter invalid title"),
    check("content")
      .trim()
      .notEmpty()
      .withMessage("Please enter invalid content"),
    check("file").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("Please upload an image");
      }
      return true;
    })
  ],
  isAuth,
  adminController.createPost
);

router.get("/fetch-posts", adminController.fetchPosts);

router.get("/fetch-post/:prodId", adminController.fetchPost);

router.post("/edit-post/:prodId", isAuth, adminController.editPost);

router.delete("/delete/:prodId", isAuth, adminController.deletePost);

module.exports = router;
