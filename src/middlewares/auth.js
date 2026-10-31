const { AppError } = require("../utils/AppError");
const { verifyToken } = require("../utils/token");
const { prisma } = require("../config/db");

// Cache thông tin auth ngắn (10 giây) để tránh query DB dồn dập khi frontend gọi nhiều API cùng lúc
const authCache = new Map();

function invalidateUserAuthCache(userId) {
  if (userId) {
    authCache.delete(userId);
  }
}

async function getUserAuthRecord(userId) {
  const now = Date.now();
  const cached = authCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, tokenVersion: true },
  });

  if (!user) {
    authCache.delete(userId);
    return null;
  }

  authCache.set(userId, {
    data: user,
    expiresAt: now + 10 * 1000,
  });

  return user;
}

function extractBearerToken(req) {
  let token = null;

  // 1. Kiểm tra header Authorization: Bearer <token>
  const header = req.headers && req.headers.authorization;
  if (header && typeof header === "string") {
    const parts = header.trim().split(/\s+/);
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      token = parts[1];
    }
  }

  // 2. Fallback kiểm tra qua cookie (cookie-parser hoặc header Cookie thô)
  if (!token) {
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
      if (match) {
        try {
          token = decodeURIComponent(match[1]);
        } catch {
          token = match[1];
        }
      }
    }
  }

  // 3. Lọc bỏ các giá trị chuỗi rác hay gặp từ localStorage/client bị corrupt
  if (
    !token ||
    typeof token !== "string" ||
    token === "undefined" ||
    token === "null" ||
    token === "[object Object]" ||
    token.trim() === ""
  ) {
    return null;
  }

  return token.trim();
}

// Bắt buộc có token hợp lệ và query lại role/tokenVersion từ DB
async function requireAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return next(AppError.unauthorized("Thiếu token xác thực hoặc phiên đăng nhập đã kết thúc", "MISSING_TOKEN"));
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(AppError.unauthorized("Token đã hết hạn", "TOKEN_EXPIRED"));
    }
    if (err.name === "JsonWebTokenError") {
      return next(AppError.unauthorized("Token không hợp lệ hoặc sai định dạng", "INVALID_TOKEN"));
    }
    if (err.name === "NotBeforeError") {
      return next(AppError.unauthorized("Token chưa tới thời điểm có hiệu lực", "TOKEN_NOT_ACTIVE"));
    }
    return next(AppError.unauthorized("Xác thực người dùng thất bại", "UNAUTHORIZED"));
  }

  const userId = payload && (payload.sub || payload.id || payload.userId);
  if (!userId) {
    return next(AppError.unauthorized("Token không hợp lệ", "INVALID_TOKEN"));
  }

  // Query lại DB để lấy role chuẩn xác và kiểm tra user còn tồn tại không
  const dbUser = await getUserAuthRecord(userId);
  if (!dbUser) {
    return next(AppError.unauthorized("Người dùng không tồn tại hoặc đã bị khoá tài khoản", "USER_NOT_FOUND"));
  }

  // Kiểm tra tokenVersion: nếu token mang phiên bản cũ, huỷ token
  if (payload.tokenVersion !== undefined && payload.tokenVersion !== dbUser.tokenVersion) {
    return next(
      AppError.unauthorized("Phiên đăng nhập đã bị thu hồi do thông tin tài khoản đã thay đổi", "TOKEN_REVOKED")
    );
  }

  req.user = { id: dbUser.id, role: dbUser.role, tokenVersion: dbUser.tokenVersion };
  return next();
}

const requireUser = requireAuth;

// Chặn theo role, dùng sau requireAuth
function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(AppError.unauthorized("Chưa xác thực", "UNAUTHORIZED"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden("Không đủ quyền thực hiện thao tác này"));
    }
    return next();
  };
}

// Không bắt buộc có token, nhưng nếu có thì giải mã và đối chiếu DB
async function optionalAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = verifyToken(token);
    const userId = payload && (payload.sub || payload.id || payload.userId);
    if (userId) {
      const dbUser = await getUserAuthRecord(userId);
      if (dbUser && (payload.tokenVersion === undefined || payload.tokenVersion === dbUser.tokenVersion)) {
        req.user = { id: dbUser.id, role: dbUser.role, tokenVersion: dbUser.tokenVersion };
      }
    }
  } catch {
    // Bỏ qua lỗi token khi gọi endpoint public
  }

  return next();
}

module.exports = {
  requireAuth,
  requireUser,
  requireRole,
  optionalAuth,
  invalidateUserAuthCache,
};
