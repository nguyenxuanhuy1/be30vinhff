const journalImageService = require("../services/journalImage.service");
const { sendSuccess, sendCreated, sendPaginated } = require("../utils/response");
const { getPagination } = require("../utils/pagination");
const { AppError } = require("../utils/AppError");

async function listImages(req, res) {
  const { page, pageSize } = getPagination(req.query);
  const { from, to, userId: queryUserId } = req.query || {};

  const { data, total } = await journalImageService.listImages({
    page,
    pageSize,
    from,
    to,
    targetUserId: queryUserId,
    currentUser: req.user,
  });

  return sendPaginated(res, data, { page, pageSize, total }, "Danh sách ảnh nhật kí");
}

async function getImage(req, res) {
  const image = await journalImageService.getImageById(req.params.id, req.user);
  return sendSuccess(res, image, "Thông tin ảnh");
}

async function createImage(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const { imageUrl, capturedAt } = req.body || {};
  // Không cho tự chỉ định chủ sở hữu, chỉ dùng user trong token
  const image = await journalImageService.createImage({
    imageUrl,
    capturedAt,
    userId,
  });

  return sendCreated(res, image, "Thêm ảnh thành công");
}

async function updateImage(req, res) {
  const image = await journalImageService.updateImage(req.params.id, req.body || {}, req.user);
  return sendSuccess(res, image, "Cập nhật ảnh thành công");
}

async function deleteImage(req, res) {
  const result = await journalImageService.deleteImage(req.params.id, req.user);
  return sendSuccess(res, result, "Đã xoá ảnh");
}

module.exports = { listImages, getImage, createImage, updateImage, deleteImage };
