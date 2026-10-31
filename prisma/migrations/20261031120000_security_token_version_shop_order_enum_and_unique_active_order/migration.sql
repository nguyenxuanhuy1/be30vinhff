-- AlterTable users
ALTER TABLE "users" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateEnum ShopOrderStatus
CREATE TYPE "ShopOrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- AlterTable shop_orders: convert status column to enum
ALTER TABLE "shop_orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "shop_orders" ALTER COLUMN "status" TYPE "ShopOrderStatus" USING ("status"::text::"ShopOrderStatus");
ALTER TABLE "shop_orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreatePartialUniqueIndex: Chống race condition và mua trùng vật phẩm ở tầng CSDL
CREATE UNIQUE INDEX "shop_orders_user_item_active_idx" ON "shop_orders" ("userId", "itemId") WHERE "status" IN ('PENDING', 'PROCESSING', 'COMPLETED');
