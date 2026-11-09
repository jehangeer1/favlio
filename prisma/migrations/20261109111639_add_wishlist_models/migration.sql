-- CreateEnum
CREATE TYPE "WishlistEventType" AS ENUM ('ITEM_ADDED', 'ITEM_REMOVED', 'WISHLIST_VIEWED', 'ADDED_TO_CART');

-- CreateTable
CREATE TABLE "ShopSettings" (
    "shop" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#F97316',
    "buttonText" TEXT NOT NULL DEFAULT 'Add to wishlist',
    "iconStyle" TEXT NOT NULL DEFAULT 'outline',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("shop")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "customerId" TEXT,
    "guestId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'My wishlist',
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productHandle" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "variantTitle" TEXT,
    "imageUrl" TEXT,
    "price" DECIMAL(12,2),
    "currencyCode" VARCHAR(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "wishlistId" TEXT,
    "type" "WishlistEventType" NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "customerId" TEXT,
    "guestId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Wishlist_shop_updatedAt_idx" ON "Wishlist"("shop", "updatedAt");

-- CreateIndex
CREATE INDEX "Wishlist_shop_customerId_idx" ON "Wishlist"("shop", "customerId");

-- CreateIndex
CREATE INDEX "Wishlist_shop_guestId_idx" ON "Wishlist"("shop", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_shop_customerId_name_key" ON "Wishlist"("shop", "customerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_shop_guestId_name_key" ON "Wishlist"("shop", "guestId", "name");

-- CreateIndex
CREATE INDEX "WishlistItem_productId_idx" ON "WishlistItem"("productId");

-- CreateIndex
CREATE INDEX "WishlistItem_variantId_idx" ON "WishlistItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_wishlistId_variantId_key" ON "WishlistItem"("wishlistId", "variantId");

-- CreateIndex
CREATE INDEX "WishlistEvent_shop_type_occurredAt_idx" ON "WishlistEvent"("shop", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "WishlistEvent_wishlistId_occurredAt_idx" ON "WishlistEvent"("wishlistId", "occurredAt");

-- CreateIndex
CREATE INDEX "WishlistEvent_productId_occurredAt_idx" ON "WishlistEvent"("productId", "occurredAt");

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistEvent" ADD CONSTRAINT "WishlistEvent_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
