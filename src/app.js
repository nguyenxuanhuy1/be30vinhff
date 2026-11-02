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

  // Xử lý CORS hỗ trợ cả môi trường dev (localhost:3000 gọi 8080) và production
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
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
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

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
