const groupService = require("../services/group.service");
const { AppError } = require("../utils/AppError");
const { sendSuccess, sendCreated } = require("../utils/response");

async function createGroup(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const name = req.body?.name;
  const group = await groupService.createGroup({ name, userId });
  return sendCreated(res, group, "Tạo nhóm thành công");
}

async function getMyGroup(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const group = await groupService.getMyGroup(userId);
  return sendSuccess(res, group, group ? "Thông tin nhóm của bạn" : "Bạn chưa có nhóm nào");
}

async function searchFriends(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const results = await groupService.searchFriends({
    keyword: req.query?.keyword,
    userId,
  });
  return sendSuccess(res, results, "Kết quả tìm bạn bè");
}

async function inviteToGroup(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const { inviteeId } = req.body || {};
  if (!inviteeId) {
    throw AppError.badRequest("Thiếu người dùng cần mời", { field: "inviteeId" });
  }

  const invitation = await groupService.inviteToGroup({
    groupId: req.params.id,
    inviteeId,
    userId,
  });

  return sendCreated(res, invitation, "Đã gửi lời mời, chờ người nhận chấp nhận");
}

async function listReceivedInvitations(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const invitations = await groupService.listReceivedInvitations(userId);
  return sendSuccess(res, invitations, "Danh sách lời mời nhận được");
}

async function listSentInvitations(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const invitations = await groupService.listSentInvitations(userId);
  return sendSuccess(res, invitations, "Danh sách lời mời đã gửi");
}

async function respondToInvitation(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const { action } = req.body || {};
  if (action !== "ACCEPT" && action !== "REJECT") {
    throw AppError.badRequest("Hành động phải là ACCEPT hoặc REJECT", { field: "action" });
  }

  const invitation = await groupService.respondToInvitation({
    id: req.params.id,
    action,
    userId,
  });

  const message = action === "ACCEPT" ? "Bạn đã tham gia nhóm" : "Đã từ chối lời mời";
  return sendSuccess(res, invitation, message);
}

async function leaveGroup(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Chưa đăng nhập", "UNAUTHORIZED");
  }
  const result = await groupService.leaveGroup(userId);
  return sendSuccess(res, result, result.message);
}

module.exports = {
  createGroup,
  getMyGroup,
  searchFriends,
  inviteToGroup,
  listReceivedInvitations,
  listSentInvitations,
  respondToInvitation,
  leaveGroup,
};
