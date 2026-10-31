const dailyRewardService = require("../services/dailyReward.service");
const { sendSuccess } = require("../utils/response");
const { AppError } = require("../utils/AppError");

async function getStatus(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const status = await dailyRewardService.getStatus(userId);
  return sendSuccess(res, status, "Trạng thái điểm danh nhận xu");
}

async function claimDailyReward(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const result = await dailyRewardService.claimDailyReward(userId);
  return sendSuccess(res, result, result.message);
}

async function getConfig(req, res) {
  const config = await dailyRewardService.getConfig();
  return sendSuccess(res, config, "Cấu hình điểm danh nhận xu");
}

async function updateConfig(req, res) {
  const adminId = req.user?.id;
  const config = await dailyRewardService.updateConfig(req.body || {}, adminId);
  return sendSuccess(res, config, "Cập nhật cấu hình nhận xu thành công");
}

async function listUsersWithCoins(req, res) {
  const { search, page, limit } = req.query || {};
  const result = await dailyRewardService.listUsersWithCoins({ search, page, limit });
  return sendSuccess(res, result, "Danh sách xu người dùng");
}

async function adjustUserCoins(req, res) {
  const { userId, amount } = req.body || {};
  if (!userId) {
    throw AppError.badRequest("Thiếu userId cần điều chỉnh", { field: "userId" });
  }
  const result = await dailyRewardService.adjustUserCoins({ userId, amount });
  return sendSuccess(res, result, "Điều chỉnh xu thành công");
}

module.exports = {
  getStatus,
  claimDailyReward,
  getConfig,
  updateConfig,
  listUsersWithCoins,
  adjustUserCoins,
};
