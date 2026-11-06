-- Migration vá: các bảng/cột này trước đây được tạo bằng `prisma db push`
-- nên không có trong lịch sử migration, làm `migrate deploy` trên DB mới bị lỗi
-- ở migration 20261031 (không tìm thấy bảng shop_orders).
-- Trạng thái ở đây là TRƯỚC 20261031 (status còn là TEXT, chưa có tokenVersion)
-- và TRƯỚC 20261102 (shop_items.imageUrl còn VARCHAR(500)).

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "lastStreakDate" VARCHAR(10),
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "lessons" ALTER COLUMN "imageUrl" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "rooms" ALTER COLUMN "imageUrl" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gender" VARCHAR(20),
ADD COLUMN     "inventoryAvatarUrl" TEXT,
ADD COLUMN     "lastLoginDate" VARCHAR(10),
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "avatarUrl" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'TIN TỨC',
    "author" VARCHAR(100) NOT NULL DEFAULT 'Ban Biên Tập',
    "authorRole" VARCHAR(100),
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readTime" VARCHAR(50),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "hot" BOOLEAN NOT NULL DEFAULT false,
    "tier" INTEGER NOT NULL DEFAULT 3,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_page_configs" (
    "id" TEXT NOT NULL DEFAULT 'fanpage',
    "profile" JSONB NOT NULL DEFAULT '{}',
    "stats" JSONB NOT NULL DEFAULT '[]',
    "channels" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_page_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reward_configs" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dayRewards" JSONB NOT NULL DEFAULT '[1, 2, 3, 4, 5, 6, 7]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "daily_reward_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_check_ins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lesson_rewards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_lesson_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_items" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "imageUrl" VARCHAR(500) NOT NULL,
    "coinPrice" INTEGER NOT NULL DEFAULT 0,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "coinPrice" INTEGER NOT NULL,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "contactInfo" VARCHAR(500),
    "note" VARCHAR(500),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_tier_publishedAt_idx" ON "articles"("tier", "publishedAt");

-- CreateIndex
CREATE INDEX "articles_category_publishedAt_idx" ON "articles"("category", "publishedAt");

-- CreateIndex
CREATE INDEX "articles_featured_publishedAt_idx" ON "articles"("featured", "publishedAt");

-- CreateIndex
CREATE INDEX "articles_createdAt_idx" ON "articles"("createdAt");

-- CreateIndex
CREATE INDEX "daily_check_ins_userId_createdAt_idx" ON "daily_check_ins"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "daily_check_ins_userId_date_key" ON "daily_check_ins"("userId", "date");

-- CreateIndex
CREATE INDEX "user_lesson_rewards_userId_idx" ON "user_lesson_rewards"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_lesson_rewards_userId_lessonId_key" ON "user_lesson_rewards"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "shop_items_isActive_createdAt_idx" ON "shop_items"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "shop_orders_userId_createdAt_idx" ON "shop_orders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "shop_orders_status_createdAt_idx" ON "shop_orders"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_check_ins" ADD CONSTRAINT "daily_check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_rewards" ADD CONSTRAINT "user_lesson_rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_rewards" ADD CONSTRAINT "user_lesson_rewards_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "shop_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

