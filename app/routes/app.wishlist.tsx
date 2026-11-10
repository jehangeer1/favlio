import { useMemo, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import "../styles/favlio-admin.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const items = await prisma.wishlistItem.findMany({
    where: { wishlist: { shop: session.shop } },
    orderBy: { updatedAt: "desc" },
    select: {
      productId: true,
      productTitle: true,
      imageUrl: true,
      updatedAt: true,
    },
  });

  const products = Array.from(
    items.reduce((grouped, item) => {
      const existing = grouped.get(item.productId);
      if (existing) {
        existing.quantity += 1;
      } else {
        grouped.set(item.productId, {
          id: item.productId,
          title: item.productTitle,
          imageUrl: item.imageUrl,
          quantity: 1,
          updatedAt: item.updatedAt.toISOString(),
        });
      }
      return grouped;
    }, new Map<string, { id: string; title: string; imageUrl: string | null; quantity: number; updatedAt: string }>()),
  ).map(([, product]) => product);

  return { products };
};

export default function WishlistProducts() {
  const { products } = useLoaderData<typeof loader>();
  const [query, setQuery] = useState("");
  const [descending, setDescending] = useState(true);
  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? products.filter((product) =>
          product.title.toLowerCase().includes(normalizedQuery),
        )
      : products;
    return [...filtered].sort((first, second) =>
      descending
        ? second.quantity - first.quantity
        : first.quantity - second.quantity,
    );
  }, [descending, products, query]);

  return (
    <s-page heading="Wishlist products">
      <div className="favlio-shell">
        <s-section padding="none">
          <div className="favlio-table-toolbar">
            <s-search-field
              label="Search wishlist products"
              labelAccessibilityVisibility="exclusive"
              placeholder="Searching in all"
              value={query}
              onInput={(event) => setQuery(event.currentTarget.value)}
            />
            <s-button
              accessibilityLabel="Sort by quantity"
              onClick={() => setDescending((current) => !current)}
            >
              {descending ? "Most saved" : "Least saved"}
            </s-button>
          </div>
          <s-table variant="auto">
            <s-table-header-row>
              <s-table-header listSlot="kicker">Image</s-table-header>
              <s-table-header listSlot="primary">Title</s-table-header>
              <s-table-header listSlot="labeled" format="numeric">
                Quantity
              </s-table-header>
              <s-table-header listSlot="secondary">Updated at</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {visibleProducts.map((product) => (
                <s-table-row key={product.title}>
                  <s-table-cell>
                    <span className="favlio-product-thumb" aria-hidden="true">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" />
                      ) : (
                        "♥"
                      )}
                    </span>
                  </s-table-cell>
                  <s-table-cell>
                    <s-text type="strong">{product.title}</s-text>
                  </s-table-cell>
                  <s-table-cell>{product.quantity}</s-table-cell>
                  <s-table-cell>
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                    }).format(new Date(product.updatedAt))}
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
          {visibleProducts.length === 0 && (
            <div className="favlio-empty">
              No wishlist products match “{query}”.
            </div>
          )}
        </s-section>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
