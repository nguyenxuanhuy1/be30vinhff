const articleService = require("../services/article.service");
const { sendSuccess, sendCreated } = require("../utils/response");
const { withServedImage, dropUnchangedServedImage } = require("../utils/servedImage");

// Ảnh bìa Base64 -> đường dẫn /api/images/articles/... (xem utils/servedImage.js)
const served = (data) => withServedImage("articles", data);

async function listArticles(req, res) {
  const { category, search, page, limit } = req.query;
  const result = await articleService.listArticles({ category, search, page, limit });
  return sendSuccess(res, { ...result, articles: served(result.articles) }, "Danh sách bài viết");
}

async function getArticle(req, res) {
  const article = await articleService.getArticleBySlugOrId(req.params.id, {
    countView: req.user?.role !== "ADMIN",
  });
  return sendSuccess(res, served(article), "Chi tiết bài viết");
}

async function createArticle(req, res) {
  const article = await articleService.createArticle(req.body || {}, req.user?.id);
  return sendCreated(res, served(article), "Thêm bài viết thành công");
}

async function updateArticle(req, res) {
  const article = await articleService.updateArticle(
    req.params.id,
    dropUnchangedServedImage(req.body || {}, "coverImage"),
  );
  return sendSuccess(res, served(article), "Cập nhật bài viết thành công");
}

async function deleteArticle(req, res) {
  const result = await articleService.deleteArticle(req.params.id);
  return sendSuccess(res, result, "Đã xoá bài viết");
}

module.exports = {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
};
