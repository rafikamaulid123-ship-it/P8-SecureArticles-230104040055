const Article = require("../repositories/articles.repo");

async function getAllArticles(query) {
  // ... (kode sama persis dengan sebelumnya, copy bagian ini) ...
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.tag) filter.tags = query.tag;
  if (query.q) {
    filter.$or = [
      { title: { $regex: query.q, $options: "i" } },
      { content: { $regex: query.q, $options: "i" } },
    ];
  }
  const sortBy = query.sortBy || "createdAt";
  const order = query.order === "asc" ? 1 : -1;
  const results = await Article.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: order });
  const total = await Article.countDocuments(filter);
  return { page, limit, total, results };
}

// Update: terima parameter user
async function createArticle(data, user) {
  const article = new Article({
    ...data,
    author: user.email, // set author otomatis dari JWT
    authorId: user.id,
  });
  return await article.save();
}

// Update: terima parameter user & cek ownership
async function updateArticle(id, data, user) {
  const article = await Article.findById(id);
  if (!article) return null;

  // Cek apakah Owner ATAU Admin?
  const isOwner = article.authorId === user.id;
  const isAdmin = user.role === "admin";

  if (!isOwner && !isAdmin) {
    const err = new Error("Forbidden: not owner");
    err.statusCode = 403;
    throw err;
  }

  Object.assign(article, data);
  return await article.save();
}

// Tambah fitur delete
async function deleteArticle(id) {
  return await Article.findByIdAndDelete(id);
}

module.exports = { getAllArticles, createArticle, updateArticle, deleteArticle };