const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    author: { type: String },
    authorId: { type: String }, // <--- Tambahan penting
  },
  { timestamps: true }
);

ArticleSchema.pre("validate", function () {
  if (this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
});

const ArticleModel = mongoose.model("Article", ArticleSchema);
module.exports = ArticleModel;