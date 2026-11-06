const crypto = require("crypto");

// =============================================================================
// ẢNH BASE64: VẪN LƯU TRONG DB, NHƯNG TRẢ RA NGOÀI DƯỚI DẠNG ĐƯỜNG DẪN ẢNH THẬT
//
// Trước đây API danh sách trả nguyên chuỗi "data:image/...;base64,..." (mỗi ảnh ~1MB)
// nên /api/rooms nặng 3,4MB và trình duyệt không lưu riêng được từng ảnh.
//
// Giờ: API trả "/api/images/<loại>/<id>/<phiên-bản>". Trình duyệt tải ảnh riêng, song
// song, lazy load được, và lưu vĩnh viễn vì phiên bản = mã băm nội dung ảnh: đổi ảnh
// thì đường dẫn đổi theo, không bao giờ hiện ảnh cũ.
// Backend giải mã Base64 -> ảnh thật ở routes/image.routes.js (~0,5ms / ảnh).
// =============================================================================

/** Các loại ảnh được phục vụ: tên trên đường dẫn -> bảng + cột trong DB */
const IMAGE_KINDS = {
  rooms: { model: "room", field: "imageUrl" },
  lessons: { model: "lesson", field: "imageUrl" },
  articles: { model: "article", field: "coverImage" },
  "shop-items": { model: "shopItem", field: "imageUrl" },
};

const SERVED_PREFIX = "/api/images/";
const DATA_IMAGE_RE = /^data:(image\/[a-z0-9.+-]+);base64,/i;

// Nhớ mã băm theo (id + updatedAt + độ dài) để danh sách không phải băm lại ảnh mỗi lần.
// updatedAt luôn đổi khi bản ghi bị sửa (Prisma @updatedAt) nên không bao giờ trả nhầm
// phiên bản cũ. Không có updatedAt thì luôn băm lại cho chắc.
const versionMemo = new Map();
const VERSION_MEMO_MAX = 2000;

function hashImage(dataUrl) {
  return crypto.createHash("md5").update(dataUrl).digest("hex").slice(0, 16);
}

function imageVersion(id, dataUrl, updatedAt) {
  const stamp = updatedAt ? new Date(updatedAt).getTime() : NaN;
  if (Number.isNaN(stamp)) {
    return hashImage(dataUrl);
  }

  const memoKey = `${id}:${stamp}:${dataUrl.length}`;
  const hit = versionMemo.get(memoKey);
  if (hit) return hit;

  const version = hashImage(dataUrl);
  if (versionMemo.size >= VERSION_MEMO_MAX) versionMemo.clear();
  versionMemo.set(memoKey, version);
  return version;
}

/** Chuỗi Base64 -> đường dẫn ảnh. Link http(s) hoặc /items/... giữ nguyên. */
function toServedImageUrl(kind, id, value, updatedAt) {
  if (typeof value !== "string" || !id || !DATA_IMAGE_RE.test(value)) {
    return value;
  }
  return `${SERVED_PREFIX}${kind}/${id}/${imageVersion(id, value, updatedAt)}`;
}

/** Thay ảnh Base64 trong 1 bản ghi (hoặc mảng bản ghi) bằng đường dẫn ảnh. Không sửa bản gốc. */
function withServedImage(kind, recordOrList) {
  const { field } = IMAGE_KINDS[kind];
  const mapOne = (record) => {
    if (!record || typeof record !== "object" || typeof record[field] !== "string") {
      return record;
    }
    return {
      ...record,
      [field]: toServedImageUrl(kind, record.id, record[field], record.updatedAt),
    };
  };
  return Array.isArray(recordOrList) ? recordOrList.map(mapOne) : mapOne(recordOrList);
}

/**
 * Form của admin nạp lại ảnh cũ dưới dạng đường dẫn /api/images/... rồi gửi nguyên lên khi
 * lưu. Nếu lưu thẳng thì DB mất ảnh Base64 thật (ảnh trỏ vào chính nó -> hỏng ảnh).
 * -> Gặp đường dẫn do chính server phục vụ thì coi như "không đổi ảnh": bỏ trường đó.
 */
function dropUnchangedServedImage(body, field) {
  if (!body || typeof body !== "object") return body;
  const value = body[field];
  if (typeof value === "string" && /^(https?:\/\/[^/]+)?\/api\/images\//i.test(value.trim())) {
    const copy = { ...body };
    delete copy[field];
    return copy;
  }
  return body;
}

/** Giải mã "data:image/png;base64,..." -> { mime, buffer }. Sai định dạng trả null. */
function decodeDataImage(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const match = DATA_IMAGE_RE.exec(dataUrl);
  if (!match) return null;
  const buffer = Buffer.from(dataUrl.slice(match[0].length), "base64");
  if (buffer.length === 0) return null;
  return { mime: match[1].toLowerCase(), buffer };
}

module.exports = {
  IMAGE_KINDS,
  imageVersion,
  toServedImageUrl,
  withServedImage,
  dropUnchangedServedImage,
  decodeDataImage,
};
