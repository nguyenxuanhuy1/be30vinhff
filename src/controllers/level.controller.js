const levelCompletionService = require("../services/levelCompletion.service");
const { sendSuccess } = require("../utils/response");
const { AppError } = require("../utils/AppError");

// POST /api/levels/:id/complete -> cấp đồ mở khoá theo màn, trả { rewards }
async function completeLevel(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const { score } = req.body || {};
  const result = await levelCompletionService.completeLevel(userId, req.params.id, score);
  return sendSuccess(res, result, "Đã hoàn thành màn");
}

module.exports = { completeLevel };
