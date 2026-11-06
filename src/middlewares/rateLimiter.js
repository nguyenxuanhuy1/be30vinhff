const { AppError } = require("../utils/AppError");

/**
 * Tạo middleware giới hạn số lượt gọi API theo IP (Rate Limit)
 * @param {object} options
 * @param {number} options.windowMs - Khung thời gian tính bằng ms (mặc định 15 phút)
 * @param {number} options.max - Số lần gọi tối đa trong khung thời gian
 * @param {string} options.message - Thông báo lỗi khi vượt quá giới hạn
 * @param {(req) => string | null} [options.key] - Tự chọn khoá đếm, trả null thì bỏ qua
 */

// IP thật của người dùng. KHÔNG đọc thẳng header X-Forwarded-For vì người dùng tự ghi được
// (đổi header mỗi lần là vượt giới hạn). req.ip đã được Express tính đúng nhờ
// app.set("trust proxy", 1): chỉ tin giá trị do proxy gần nhất (nginx / Next) thêm vào.
function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown_ip";
}

function createRateLimit({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.",
  key = getClientIp,
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
    const ip = key(req);
    if (!ip) {
      return next();
    }

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
