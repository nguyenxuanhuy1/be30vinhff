// Phải require ở dòng đầu: express-async-errors vá Express để lỗi promise trong
// controller tự được chuyển tới errorHandler, không cần try/catch
require("express-async-errors");

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { env } = require("./config/env");
const routes = require("./routes");
const { notFoundHandler } = require("./middlewares/notFound");
const { errorHandler } = require("./middlewares/errorHandler");

function createApp() {
  const app = express();

  // Để req.ip lấy đúng IP khi chạy sau reverse proxy
  app.set("trust proxy", 1);

  // CORS: frontend gọi API cùng domain (<domain>/api qua nginx hoặc rewrite của Next)
  // nên mặc định KHÔNG cho domain lạ nào gọi chéo. Trước đây server trả lại mọi Origin
  // kèm Allow-Credentials, trang bất kỳ đều được phép gọi API bằng phiên của người dùng.
  // Cần cho domain khác gọi thì khai báo CORS_ORIGINS trong .env (cách nhau dấu phẩy).
  // Chế độ phát triển: frontend (localhost:3000) gọi thẳng backend (localhost:8080) nên
  // phải cho phép máy local và mạng nội bộ (thử bằng điện thoại cùng wifi).
  // Production KHÔNG áp dụng: chỉ các domain khai báo trong CORS_ORIGINS.
  function isDevLocalOrigin(origin) {
    if (env.isProduction) return false;
    try {
      const { hostname, protocol } = new URL(origin);
      if (protocol !== "http:" && protocol !== "https:") return false;
      return (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "[::1]" ||
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
      );
    } catch {
      return false;
    }
  }

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const isAllowedOrigin =
      Boolean(origin) && (env.corsOrigins.includes(origin) || isDevLocalOrigin(origin));

    if (!isAllowedOrigin) {
      // Preflight từ domain lạ: trả về không kèm header CORS, trình duyệt sẽ tự chặn
      if (req.method === "OPTIONS") {
        return res.sendStatus(204);
      }
      return next();
    }

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie"
    );
    res.setHeader("Access-Control-Max-Age", "86400");

    // Xử lý preflight OPTIONS ngay lập tức
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(cookieParser());
  // Gói tin không bó hẹp: HTML bài học, nội dung tin tức dài bao nhiêu cũng được.
  // Chỉ ẢNH bị giới hạn 500KB (kiểm tra riêng trong utils/validators.js).
  // 50mb chỉ là mức trần chống gửi rác làm tràn RAM, HTML thực tế vài trăm KB.
  // Nhớ đặt client_max_body_size của nginx bằng mức này (xem nginx.snippet.conf).
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use(env.isProduction ? morgan("combined") : morgan("dev"));

  app.get("/", function root(req, res) {
    return res.json({
      success: true,
      message: "project30tr API",
      data: { docs: "/api", health: "/api/health" },
    });
  });

  app.use("/api", routes);

  // Thứ tự bắt buộc: 404 trước, errorHandler sau cùng
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
