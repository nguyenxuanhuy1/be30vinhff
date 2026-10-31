const { z } = require("zod");

const usernameSchema = z
  .string({ required_error: "Tài khoản là bắt buộc" })
  .trim()
  .min(3, "Tài khoản phải dài tối thiểu 3 ký tự")
  .max(50, "Tài khoản tối đa 50 ký tự")
  .regex(/^[a-zA-Z0-9_]+$/, "Tài khoản chỉ được gồm chữ cái, chữ số hoặc dấu gạch dưới");

const passwordSchema = z
  .string({ required_error: "Mật khẩu là bắt buộc" })
  .min(8, "Mật khẩu phải từ 8 đến 72 ký tự")
  .max(72, "Mật khẩu phải từ 8 đến 72 ký tự");

const registerBodySchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  avatarUrl: z.string().max(2000).optional().nullable(),
  gender: z.string().max(20).optional().nullable(),
});

const loginBodySchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

module.exports = {
  usernameSchema,
  passwordSchema,
  registerBodySchema,
  loginBodySchema,
};
