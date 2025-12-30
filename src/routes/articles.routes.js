const router = require("express").Router();
const validate = require("../middlewares/validate.middleware");
const verifyToken = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");
const {
  createArticleSchema,
  updateArticleSchema,
  listArticlesSchema,
} = require("../utils/articles.validation");
const {
  listArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} = require("../controllers/articles.controller");

// Public: Semua orang bisa baca
router.get("/", validate(listArticlesSchema), listArticles);

// Protected: User & Admin bisa nulis
router.post(
  "/",
  verifyToken,
  requireRole("user", "admin"),
  validate(createArticleSchema),
  createArticle
);

// Protected: Owner bisa edit (cek di service), Admin juga bisa
router.put(
  "/:id",
  verifyToken,
  validate(updateArticleSchema),
  updateArticle
);

// Admin Only: Hanya admin yang bisa hapus
router.delete(
  "/:id",
  verifyToken,
  requireRole("admin"),
  deleteArticle
);

module.exports = router;