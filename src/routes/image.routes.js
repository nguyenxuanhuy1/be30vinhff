const router = require("express").Router();
const { prisma } = require("../config/db");
const { optionalAuth } = require("../middlewares/auth");
const { AppError } = require("../utils/AppError");
const { IMAGE_KINDS, imageVersion, decodeDataImage } = require("../utils/servedImage");

// GET /api/images/:kind/:id/:version
// Đọc ảnh Base64 trong DB, giải mã thành ảnh thật rồi trả về như một file ảnh bình thường.
//
// Cache:
//  - :version đúng với ảnh hiện tại -> cho trình duyệt/CDN lưu 1 năm (immutable): đổi ảnh
//    thì API danh sách trả đường dẫn có version mới, ảnh cũ không bao giờ bị dùng nhầm.
//  - :version cũ (ai đó giữ link cũ) -> vẫn trả ảnh hiện tại nhưng bắt hỏi lại mỗi lần.
//  - Có ETag: trình duyệt hỏi lại sẽ nhận 304, không tải lại ảnh.
router.get("/:kind/:id/:version", optionalAuth, async function serveImage(req, res) {
  const { kind, id, version } = req.params;
  const config = IMAGE_KINDS[kind];
  if (!config) {
    throw AppError.notFound("Không tìm thấy ảnh");
  }

  const select = { [config.field]: true, updatedAt: true };
  // Bài học chưa xuất bản: chỉ admin xem được ảnh
  if (config.model === "lesson") select.published = true;

  const record = await prisma[config.model]
    .findUnique({ where: { id }, select })
    .catch(() => null); // id sai định dạng (không phải uuid) -> coi như không có

  if (!record || (config.model === "lesson" && !record.published && req.user?.role !== "ADMIN")) {
    throw AppError.notFound("Không tìm thấy ảnh");
  }

  const dataUrl = record[config.field];
  const image = decodeDataImage(dataUrl);
  if (!image) {
    throw AppError.notFound("Không tìm thấy ảnh");
  }

  const currentVersion = imageVersion(id, dataUrl, record.updatedAt);
  const etag = `"${currentVersion}"`;

  res.setHeader("Content-Type", image.mime);
  res.setHeader("Content-Length", String(image.buffer.length));
  res.setHeader("ETag", etag);
  res.setHeader(
    "Cache-Control",
    version === currentVersion ? "public, max-age=31536000, immutable" : "public, no-cache",
  );
  // Ảnh SVG có thể chứa mã script: nếu ai mở thẳng link ảnh thì cũng không cho chạy
  res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }
  return res.end(image.buffer);
});

module.exports = router;
