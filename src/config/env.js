const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

function toInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: toInt(process.env.PORT, 8080),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: "3h",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: "7d",
  bcryptSaltRounds: 10,
  labSecret: process.env.LAB_SECRET,
  labTokenExpiresIn: "2h",
  // catalog.json nằm ở public của frontend (chung repo)
  labCatalogPath: path.resolve(__dirname, "../../../frontend/public/items/catalog.json"),
};

// Dừng server ngay nếu thiếu biến môi trường bắt buộc
function validateEnv() {
  const required = [
    { key: "DATABASE_URL", value: env.databaseUrl },
    { key: "JWT_SECRET", value: env.jwtSecret },
    { key: "JWT_REFRESH_SECRET", value: env.jwtRefreshSecret },
    { key: "LAB_SECRET", value: env.labSecret },
  ];

  const missing = required
    .filter(function checkItem(item) {
      return !item.value;
    })
    .map(function toKey(item) {
      return item.key;
    });

  if (missing.length > 0) {
    throw new Error(
      "Thiếu biến môi trường: " + missing.join(", ") + ". Hãy cấu hình đầy đủ trong file .env"
    );
  }

  // Khi chạy production: bắt buộc secret tối thiểu 32 ký tự và không được trùng nhau
  if (env.isProduction) {
    if (env.jwtSecret.length < 32) {
      throw new Error("JWT_SECRET phải dài tối thiểu 32 ký tự khi chạy production");
    }
    if (env.jwtRefreshSecret.length < 32) {
      throw new Error("JWT_REFRESH_SECRET phải dài tối thiểu 32 ký tự khi chạy production");
    }
    if (env.labSecret.length < 32) {
      throw new Error("LAB_SECRET phải dài tối thiểu 32 ký tự khi chạy production");
    }
    if (env.jwtRefreshSecret === env.jwtSecret) {
      throw new Error("JWT_REFRESH_SECRET không được trùng với JWT_SECRET khi chạy production");
    }
    if (env.labSecret === env.jwtSecret) {
      throw new Error("LAB_SECRET không được trùng với JWT_SECRET khi chạy production");
    }
  }
}

module.exports = { env, validateEnv };
