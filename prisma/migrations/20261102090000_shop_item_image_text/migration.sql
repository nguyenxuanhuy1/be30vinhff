-- Cho phép lưu ảnh Base64 tải lên từ máy cho sản phẩm cửa hàng
ALTER TABLE "shop_items" ALTER COLUMN "imageUrl" SET DATA TYPE TEXT;
