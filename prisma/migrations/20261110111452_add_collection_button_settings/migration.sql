-- CreateTable
CREATE TABLE "CollectionButtonSettings" (
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "placement" TEXT NOT NULL DEFAULT 'top_right',
    "customPosition" BOOLEAN NOT NULL DEFAULT false,
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFFE8',
    "activeBackgroundColor" TEXT NOT NULL DEFAULT '#F97316',
    "padding" INTEGER NOT NULL DEFAULT 5,
    "borderRadius" INTEGER NOT NULL DEFAULT 50,
    "showOnHover" BOOLEAN NOT NULL DEFAULT true,
    "overrideIconStyle" BOOLEAN NOT NULL DEFAULT true,
    "iconStyle" TEXT NOT NULL DEFAULT 'heart',
    "iconAnimation" TEXT NOT NULL DEFAULT 'none',
    "iconColor" TEXT NOT NULL DEFAULT '#737373',
    "activeIconColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "iconSize" INTEGER NOT NULL DEFAULT 22,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionButtonSettings_pkey" PRIMARY KEY ("shop")
);
