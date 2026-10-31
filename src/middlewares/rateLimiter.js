const { AppError } = require("../utils/AppError");

/**
 * Tạo middleware giới hạn số lượt gọi API theo IP (Rate Limit)
 * @param {object} options
 * @param {number} options.windowMs - Khung thời gian tính bằng ms (mặc định 15 phút)
 * @param {number} options.max - Số lần gọi tối đa trong khung thời gian
 * @param {string} options.message - Thông báo lỗi khi vượt quá giới hạn
 */
function createRateLimit({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.",
} = {}) {
  const store = new Map();

  // Dọn dẹp các IP đã hết hạn định kỳ mỗi 5 phút để chống rò rỉ RAM
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of store.entries()) {
      if (record.resetTime <= now) {
        store.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  if (typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }

  return function rateLimitMiddleware(req, res, next) {
    const ip =
      (typeof req.headers["x-forwarded-for"] === "string"
        ? req.headers["x-forwarded-for"].split(",")[0].trim()
        : null) ||
      req.ip ||
      req.socket?.remoteAddress ||
      "unknown_ip";

    const now = Date.now();
    const record = store.get(ip);

    if (!record || record.resetTime <= now) {
      store.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      throw AppError.tooManyRequests(message, {
        retryAfter: retryAfterSec,
      });
    }

    record.count += 1;
    return next();
  };
}

module.exports = { createRateLimit };
