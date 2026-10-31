const { AppError } = require("../utils/AppError");

/**
 * Middleware validate request với Zod schema
 * @param {object} schemas
 * @param {import("zod").ZodSchema} [schemas.body]
 * @param {import("zod").ZodSchema} [schemas.query]
 * @param {import("zod").ZodSchema} [schemas.params]
 */
function validate({ body, query, params } = {}) {
  return function validateMiddleware(req, res, next) {
    try {
      if (body) {
        req.body = body.parse(req.body || {});
      }
      if (query) {
        req.query = query.parse(req.query || {});
      }
      if (params) {
        req.params = params.parse(req.params || {});
      }
      return next();
    } catch (err) {
      if (err.name === "ZodError" || err.issues) {
        const firstIssue = err.issues?.[0];
        const fieldName = firstIssue?.path?.[0] || undefined;
        const message = firstIssue?.message || "Dữ liệu không hợp lệ";
        throw AppError.badRequest(message, {
          field: fieldName,
          issues: err.issues?.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }
      return next(err);
    }
  };
}

module.exports = { validate };
