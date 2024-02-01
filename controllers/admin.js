const Post = require("../models/post");
const User = require("../models/user");
const deleteImg = require("../utils/delete-image");
const { validationResult } = require("express-validator");
const io = require("../socket");

exports.createPost = async (req, res, next) => {
  try {
    const title = req.body.title;
    const content = req.body.content;
    const userId = req.body.userId;
    const file = req.file;
    // console.log(title, content, file);

    // VALIDATION
    if (!userId) {
      return res.status(500).send();
    }
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
      return res.status(500).json(errors.errors[0]);
    }

    // Create a new post in database
    const newPost = new Post({
      title: title,
      content: content,
      image: file.path,
      userId: userId,
      date: new Date()
    });
    await newPost.save();
    const user = await User.findById(userId);
    // emitting a socket event to inform all users , a new post is created
    io.getIO().emit("posts", {
      action: "create",
      data: { ...newPost._doc, userId: { _id: userId, name: user.name } }
    });
    return res.status(201).json();
  } catch (err) {
    console.log(err);
  }
};

exports.fetchPosts = async (req, res, next) => {
  try {
    const postsArr = await Post.find()
      .populate("userId", "name")
      .sort({ date: -1 });
    return res.status(200).json({ data: postsArr });
  } catch (err) {
    console.log(err);
  }
};

exports.fetchPost = async (req, res, next) => {
  try {
    const prodId = req.params.prodId;
    const post = await Post.findOne({ _id: prodId }).populate("userId", "name");
    return res.status(200).json({ data: post });
  } catch (err) {
    console.log(err);
  }
};

exports.editPost = async (req, res, next) => {
  try {
    const prodId = req.params.prodId;
    const userId = req.body.userId;
    const title = req.body.title;
    const content = req.body.content;
    const image = req.file;
    const post = await Post.findOne({ _id: prodId, userId: userId }).populate(
      "userId",
      "name"
    );
    if (!post) {
      return res.status(500).json({ msg: "Internal error" });
    }
    post.title = title;
    post.content = content;
    if (image) {
      // delete current image
      deleteImg(post.image);
      // add new image
      post.image = image.path;
    }
    await post.save();
    io.getIO().emit("posts", { action: "update", data: post._doc });
    return res.status(200).send();
  } catch (err) {
    console.log(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const prodId = req.params.prodId;
    const userId = req.body.userId;

    // check if post exists
    const post = await Post.findOne({ _id: prodId, userId: userId });
    if (!post) {
      return res.status(500).json({ msg: "No post found." });
    }
    // delete image associated with the post
    if (post.image) {
      deleteImg(post.image);
    }
    // delete the post in db
    await Post.deleteOne({ _id: prodId, userId: userId });
    io.getIO().emit("posts", { action: "delete", data: post._doc._id });
    return res.status(200).send();
  } catch (err) {}
};
