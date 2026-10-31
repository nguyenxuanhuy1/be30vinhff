const { prisma } = require("../config/db");
const { AppError } = require("../utils/AppError");
const { validateImageUrl, validateCapturedAt } = require("../utils/validators");
const { JOURNAL_IMAGE_SELECT } = require("../utils/select");

// Lọc theo khoảng thời gian chụp, tham số from/to là chuỗi ISO 8601
function buildWhere({ currentUser, targetUserId, from, to }) {
  const where = {};

  // Bảo vệ IDOR: Nếu không phải ADMIN, bắt buộc chỉ xem được ảnh của chính mình
  if (currentUser?.role === "ADMIN") {
    if (targetUserId) {
      where.userId = targetUserId;
    }
  } else {
    where.userId = currentUser?.id;
  }

  if (from || to) {
    where.capturedAt = {};
    if (from) {
      where.capturedAt.gte = validateCapturedAt(from);
    }
    if (to) {
      where.capturedAt.lte = validateCapturedAt(to);
    }
  }

  return where;
}

async function listImages({ page, pageSize, currentUser, targetUserId, from, to }) {
  const where = buildWhere({ currentUser, targetUserId, from, to });

  const [total, data] = await prisma.$transaction([
    prisma.journalImage.count({ where }),
    prisma.journalImage.findMany({
      where,
      select: JOURNAL_IMAGE_SELECT,
      orderBy: { capturedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { data, total };
}

async function getImageById(id, currentUser = null) {
  const image = await prisma.journalImage.findUnique({
    where: { id },
    select: JOURNAL_IMAGE_SELECT,
  });

  if (!image) {
    throw AppError.notFound("Không tìm thấy ảnh");
  }

  // Chống IDOR: Không phải chủ sở hữu và không phải ADMIN thì trả 404
  if (currentUser && currentUser.role !== "ADMIN" && image.userId !== currentUser.id) {
    throw AppError.notFound("Không tìm thấy ảnh");
  }

  return image;
}

async function createImage({ imageUrl, capturedAt, userId }) {
  validateImageUrl(imageUrl);
  const captured = validateCapturedAt(capturedAt || new Date());

  // Chủ sở hữu phải tồn tại, kiểm tra trước để trả lỗi rõ ràng thay vì lỗi FK
  const owner = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!owner) {
    throw AppError.notFound("Không tìm thấy người dùng sở hữu ảnh");
  }

  return prisma.journalImage.create({
    data: { imageUrl: imageUrl.trim(), capturedAt: captured, userId },
    select: JOURNAL_IMAGE_SELECT,
  });
}

async function updateImage(id, { imageUrl, capturedAt }, currentUser = null) {
  await getImageById(id, currentUser);

  const data = {};

  if (imageUrl !== undefined) {
    validateImageUrl(imageUrl);
    data.imageUrl = imageUrl.trim();
  }
  if (capturedAt !== undefined) {
    data.capturedAt = validateCapturedAt(capturedAt);
  }

  if (Object.keys(data).length === 0) {
    throw AppError.badRequest("Không có trường nào để cập nhật");
  }

  return prisma.journalImage.update({
    where: { id },
    data,
    select: JOURNAL_IMAGE_SELECT,
  });
}

async function deleteImage(id, currentUser = null) {
  await getImageById(id, currentUser);
  await prisma.journalImage.delete({ where: { id } });
  return { id };
}

module.exports = { listImages, getImageById, createImage, updateImage, deleteImage };
