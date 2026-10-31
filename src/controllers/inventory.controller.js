const inventoryService = require("../services/inventory.service");
const { sendSuccess } = require("../utils/response");
const { AppError } = require("../utils/AppError");

// GET /api/inventory -> { owned, equipped }
async function getInventory(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const inventory = await inventoryService.listInventory(userId);
  return sendSuccess(res, inventory, "Tủ đồ");
}

// POST /api/inventory/equip { itemId } -> { equipped }
async function equipItem(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const itemId = req.body?.itemId;
  if (!itemId) {
    throw AppError.badRequest("Thiếu itemId trang bị", { field: "itemId" });
  }
  const result = await inventoryService.equipItem(userId, itemId);
  return sendSuccess(res, result, "Đã trang bị");
}

// POST /api/inventory/unequip { itemId } -> { equipped }
async function unequipItem(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const itemId = req.body?.itemId;
  if (!itemId) {
    throw AppError.badRequest("Thiếu itemId tháo đồ", { field: "itemId" });
  }
  const result = await inventoryService.unequipItem(userId, itemId);
  return sendSuccess(res, result, "Đã tháo đồ");
}

module.exports = { getInventory, equipItem, unequipItem };
