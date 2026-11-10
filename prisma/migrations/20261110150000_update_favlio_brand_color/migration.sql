ALTER TABLE "ShopSettings"
ALTER COLUMN "primaryColor" SET DEFAULT '#7212DA';

UPDATE "ShopSettings"
SET "primaryColor" = '#7212DA'
WHERE UPPER("primaryColor") = '#F97316';

ALTER TABLE "CollectionButtonSettings"
ALTER COLUMN "activeBackgroundColor" SET DEFAULT '#7212DA';

UPDATE "CollectionButtonSettings"
SET "activeBackgroundColor" = '#7212DA'
WHERE UPPER("activeBackgroundColor") = '#F97316';
