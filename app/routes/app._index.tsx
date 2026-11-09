import { useMemo, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import "../styles/favlio-admin.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

const products = [
  {
    icon: "🌿",
    title: "Serenity Floor Basket",
    quantity: 5,
    updatedAt: "November 2, 2026",
  },
  {
    icon: "🎄",
    title: "Traditional Large Angel Arrangement",
    quantity: 4,
    updatedAt: "October 8, 2026",
  },
  {
    icon: "🌹",
    title: "Rose Casket Spray",
    quantity: 3,
    updatedAt: "October 3, 2026",
  },
  {
    icon: "🌸",
    title: "Serenity Alternative Casket Spray",
    quantity: 2,
    updatedAt: "September 28, 2026",
  },
  {
    icon: "🌼",
    title: "Serenity Lily Garden",
    quantity: 1,
    updatedAt: "September 21, 2026",
  },
];

export default function WishlistProducts() {
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
  }, [descending, query]);

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
                      {product.icon}
                    </span>
                  </s-table-cell>
                  <s-table-cell>
                    <s-text type="strong">{product.title}</s-text>
                  </s-table-cell>
                  <s-table-cell>{product.quantity}</s-table-cell>
                  <s-table-cell>{product.updatedAt}</s-table-cell>
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
