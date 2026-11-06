const roomService = require("../services/room.service");
const { sendSuccess, sendCreated } = require("../utils/response");
const { withServedImage, dropUnchangedServedImage } = require("../utils/servedImage");

// Ảnh Base64 -> đường dẫn /api/images/rooms/... (xem utils/servedImage.js)
const served = (data) => withServedImage("rooms", data);

async function listRooms(req, res) {
  const rooms = await roomService.listRooms();
  return sendSuccess(res, served(rooms), "Danh sách phòng");
}

async function getRoom(req, res) {
  const room = await roomService.getRoomById(req.params.id);
  return sendSuccess(res, served(room), "Thông tin phòng");
}

async function createRoom(req, res) {
  const { name, imageUrl, order } = req.body || {};
  const room = await roomService.createRoom({
    name,
    imageUrl,
    order,
  });

  return sendCreated(res, served(room), "Thêm phòng thành công");
}

async function updateRoom(req, res) {
  const room = await roomService.updateRoom(req.params.id, dropUnchangedServedImage(req.body, "imageUrl"));
  return sendSuccess(res, served(room), "Cập nhật phòng thành công");
}

async function deleteRoom(req, res) {
  const result = await roomService.deleteRoom(req.params.id);
  return sendSuccess(res, result, "Đã xoá phòng");
}

module.exports = { listRooms, getRoom, createRoom, updateRoom, deleteRoom };
