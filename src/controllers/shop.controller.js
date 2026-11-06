const shopService = require("../services/shop.service");
const { sendSuccess } = require("../utils/response");
const { AppError } = require("../utils/AppError");
const { withServedImage, dropUnchangedServedImage } = require("../utils/servedImage");

// Ảnh sản phẩm Base64 -> đường dẫn /api/images/shop-items/... (xem utils/servedImage.js).
// Chỉ đổi ở bước trả ra: logic bên trong (đồng bộ tủ đồ theo /items/...) vẫn dùng dữ liệu gốc.
const servedItem = (data) => withServedImage("shop-items", data);
const servedOrder = (order) => (order && order.item ? { ...order, item: servedItem(order.item) } : order);
const servedOrders = (orders) => (Array.isArray(orders) ? orders.map(servedOrder) : orders);

async function listItems(req, res) {
  const includeInactive = req.user?.role === "ADMIN" && req.query?.all === "true";
  const items = await shopService.getItems({
    includeInactive,
    search: req.query?.search,
    userId: req.user?.id || null,
  });
  return sendSuccess(res, servedItem(items), "Lấy danh sách sản phẩm thành công");
}

async function getAvailableAssets(req, res) {
  const assets = shopService.getAvailableAssets();
  return sendSuccess(res, assets, "Lấy danh sách vật phẩm có sẵn thành công");
}

async function getItem(req, res) {
  const item = await shopService.getItemById(req.params.id, req.user?.id || null);
  return sendSuccess(res, servedItem(item), "Lấy thông tin sản phẩm thành công");
}

async function purchaseItem(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const { itemId, contactInfo, note } = req.body || {};
  const result = await shopService.purchaseItem({
    userId,
    itemId,
    contactInfo,
    note,
  });
  return sendSuccess(res, result, result.message);
}

async function getMyOrders(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const orders = await shopService.getUserOrders(userId);
  return sendSuccess(res, servedOrders(orders), "Lấy lịch sử mua hàng thành công");
}

async function createItem(req, res) {
  const item = await shopService.createItem(req.body || {});
  return sendSuccess(res, servedItem(item), "Thêm sản phẩm mới thành công", 201);
}

async function updateItem(req, res) {
  const item = await shopService.updateItem(
    req.params.id,
    dropUnchangedServedImage(req.body || {}, "imageUrl"),
  );
  return sendSuccess(res, servedItem(item), "Cập nhật sản phẩm thành công");
}

async function deleteItem(req, res) {
  await shopService.deleteItem(req.params.id);
  return sendSuccess(res, null, "Xoá sản phẩm thành công");
}

async function getAdminOrders(req, res) {
  const { status, search, page, limit } = req.query || {};
  const result = await shopService.getAdminOrders({
    status,
    search,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 50,
  });
  return sendSuccess(res, { ...result, orders: servedOrders(result.orders) }, "Lấy danh sách đơn hàng thành công");
}

async function updateOrderStatus(req, res) {
  const { status } = req.body || {};
  const order = await shopService.updateOrderStatus(req.params.id, status);
  return sendSuccess(res, servedOrder(order), "Cập nhật trạng thái đơn hàng thành công");
}

module.exports = {
  listItems,
  getAvailableAssets,
  getItem,
  purchaseItem,
  getMyOrders,
  createItem,
  updateItem,
  deleteItem,
  getAdminOrders,
  updateOrderStatus,
};
