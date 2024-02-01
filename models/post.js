const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  image: { type: String, required: true }, // store image path in BE
  content: { type: String, required: true },
  date: { type: Date, required: true }
});

module.exports = mongoose.model("Post", postSchema);
