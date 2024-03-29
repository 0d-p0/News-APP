const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    // fullDescription: { type: String, required: true },
    image: { type: String, required: true },
    originalPost: { type: String, required: true },
    originalPostBy: { type: String, required: true },
    publishDate: { type: Number, required: true },
  },

  {
    timestamps: true, // Add createdAt and updatedAt fields
  }
);

const PostDetails = mongoose.model("allPost", postSchema);

module.exports = PostDetails;
