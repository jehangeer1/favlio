import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import prisma from "../db.server";
import { authenticate } from "../shopify.server";

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function cleanString(value: unknown, maxLength = 255) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function identityFromRequest(request: Request) {
  const url = new URL(request.url);
  return {
    customerId: cleanString(url.searchParams.get("logged_in_customer_id"), 64),
    guestId: cleanString(url.searchParams.get("guest_id"), 100),
  };
}

async function authenticatedShop(request: Request) {
  const context = await authenticate.public.appProxy(request);
  const shop =
    context.session?.shop ?? new URL(request.url).searchParams.get("shop");
  if (!shop) throw new Response("Unauthorized", { status: 401 });
  return shop;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const shop = await authenticatedShop(request);
  const { customerId, guestId } = identityFromRequest(request);
  const settings = await prisma.collectionButtonSettings.findUnique({
    where: { shop },
  });

  let savedVariantIds: string[] = [];
  if (customerId || guestId) {
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        shop,
        ...(customerId ? { customerId } : { guestId }),
        isDefault: true,
      },
      select: {
        items: { select: { variantId: true } },
      },
    });
    savedVariantIds = wishlist?.items.map((item) => item.variantId) ?? [];
  }

  return json({
    enabled: settings?.enabled ?? false,
    settings: settings
      ? {
          placement: settings.placement,
          backgroundColor: settings.backgroundColor,
          activeBackgroundColor: settings.activeBackgroundColor,
          padding: settings.padding,
          borderRadius: settings.borderRadius,
          showOnHover: settings.showOnHover,
          iconStyle: settings.iconStyle,
          iconAnimation: settings.iconAnimation,
          iconColor: settings.iconColor,
          activeIconColor: settings.activeIconColor,
          iconSize: settings.iconSize,
        }
      : null,
    savedVariantIds,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);

  const shop = await authenticatedShop(request);
  const { customerId, guestId } = identityFromRequest(request);
  if (!customerId && !guestId)
    return json({ error: "Missing shopper identity" }, 400);

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) return json({ error: "Invalid request body" }, 400);

  const productId = cleanString(body.productId, 100);
  const variantId = cleanString(body.variantId, 100);
  const productHandle = cleanString(body.productHandle, 255);
  const productTitle = cleanString(body.productTitle, 255);
  const variantTitle = cleanString(body.variantTitle, 255) || null;
  const imageUrl = cleanString(body.imageUrl, 2000) || null;
  const currencyCode = cleanString(body.currencyCode, 3).toUpperCase() || null;
  const rawPrice = cleanString(body.price, 30);
  const price = /^\d+(\.\d{1,2})?$/.test(rawPrice) ? rawPrice : null;

  if (!productId || !variantId || !productHandle || !productTitle) {
    return json({ error: "Missing product information" }, 400);
  }

  const result = await prisma.$transaction(async (transaction) => {
    let wishlist = await transaction.wishlist.findFirst({
      where: {
        shop,
        ...(customerId ? { customerId } : { guestId }),
        isDefault: true,
      },
    });

    wishlist ??= await transaction.wishlist.create({
      data: {
        shop,
        customerId: customerId || null,
        guestId: customerId ? null : guestId,
      },
    });

    const existing = await transaction.wishlistItem.findUnique({
      where: {
        wishlistId_variantId: { wishlistId: wishlist.id, variantId },
      },
    });

    if (existing) {
      await transaction.wishlistItem.delete({ where: { id: existing.id } });
      await transaction.wishlistEvent.create({
        data: {
          shop,
          wishlistId: wishlist.id,
          type: "ITEM_REMOVED",
          productId,
          variantId,
          customerId: customerId || null,
          guestId: customerId ? null : guestId,
          metadata: { source: "collection_button" },
        },
      });
      return { active: false };
    }

    await transaction.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId,
        variantId,
        productHandle,
        productTitle,
        variantTitle,
        imageUrl,
        price,
        currencyCode,
      },
    });
    await transaction.wishlistEvent.create({
      data: {
        shop,
        wishlistId: wishlist.id,
        type: "ITEM_ADDED",
        productId,
        variantId,
        customerId: customerId || null,
        guestId: customerId ? null : guestId,
        metadata: { source: "collection_button" },
      },
    });
    return { active: true };
  });

  return json(result);
};
