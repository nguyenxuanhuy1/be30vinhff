const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth");
const { createRateLimit } = require("../middlewares/rateLimiter");
const { validate } = require("../middlewares/validate");
const { registerBodySchema, loginBodySchema } = require("../schemas/auth.schema");

// Giới hạn 10 lần gọi trong 15 phút theo IP để chống brute-force đăng nhập / spam đăng ký
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Bạn đã thử quá nhiều lần. Vui lòng đợi 15 phút trước khi thử lại.",
});

router.post("/register", authRateLimit, validate({ body: registerBodySchema }), authController.register);
router.post("/login", authRateLimit, validate({ body: loginBodySchema }), authController.login);
router.post("/refresh", authController.refresh);
router.get("/me", requireAuth, authController.me);

module.exports = router;
