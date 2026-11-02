const router = require("express").Router();
const articleController = require("../controllers/article.controller");
const { requireAuth, requireRole, optionalAuth } = require("../middlewares/auth");

// Đọc bài viết là công khai
router.get("/", articleController.listArticles);
// optionalAuth để admin mở bài (khi sửa) không bị tính thêm lượt xem
router.get("/:id", optionalAuth, articleController.getArticle);

// Thêm, sửa, xoá bài viết chỉ dành cho Quản trị viên (ADMIN)
router.post("/", requireAuth, requireRole("ADMIN"), articleController.createArticle);
router.put("/:id", requireAuth, requireRole("ADMIN"), articleController.updateArticle);
router.delete("/:id", requireAuth, requireRole("ADMIN"), articleController.deleteArticle);

module.exports = router;
