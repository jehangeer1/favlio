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

type FeatureCategory = "Buttons" | "Widgets" | "Wishlist page" | "Features";
type Feature = {
  id: string;
  title: string;
  category: FeatureCategory;
  description: string;
  locked?: boolean;
  customizable?: boolean;
};

const features: Feature[] = [
  {
    id: "collection-button",
    title: "Collection Wishlist Button",
    category: "Buttons",
    description:
      "Adds a wishlist button to product cards on collection and catalog pages.",
    customizable: true,
  },
  {
    id: "product-button",
    title: "Product Page Wishlist Button",
    category: "Buttons",
    description:
      "Displays a wishlist button on individual product detail pages.",
    customizable: true,
  },
  {
    id: "floating-button",
    title: "Floating Wishlist Button",
    category: "Buttons",
    description:
      "Enables a floating button for quick wishlist access with configurable position and style.",
    customizable: true,
  },
  {
    id: "wishlist-page",
    title: "Wishlist Page",
    category: "Wishlist page",
    description:
      "Provides a dedicated page to view and manage all wishlist items.",
    customizable: true,
  },
  {
    id: "wishlist-icon",
    title: "Wishlist Icon",
    category: "Widgets",
    description:
      "Customizes the wishlist icon’s style, animation, size, and colors.",
    customizable: true,
  },
  {
    id: "wishlist-header",
    title: "Wishlist Header",
    category: "Widgets",
    description: "Displays a wishlist icon with a count in the store header.",
    customizable: true,
  },
  {
    id: "notifications",
    title: "Notifications",
    category: "Widgets",
    description: "Shows customizable popup notifications for wishlist actions.",
    customizable: true,
  },
  {
    id: "guest-wishlist",
    title: "Guest Wishlist",
    category: "Features",
    description:
      "Allows guest visitors to create wishlists without logging in.",
  },
  {
    id: "tooltips",
    title: "Show Tooltips",
    category: "Features",
    description: "Shows helper tooltips across wishlist features.",
  },
  {
    id: "analytics",
    title: "Wishlist Analytics",
    category: "Features",
    description: "Tracks wishlist activity to power the Analytics page.",
  },
  {
    id: "variants",
    title: "Add Wishlist by Variant",
    category: "Features",
    description:
      "Saves individual product variants so customers can keep exactly what they want.",
    customizable: true,
  },
  {
    id: "save-later",
    title: "Save For Later",
    category: "Features",
    description:
      "Lets shoppers move cart items to the wishlist for later purchase.",
    customizable: true,
  },
  {
    id: "hide-price",
    title: "Hide Price On Wishlist",
    category: "Wishlist page",
    description:
      "Hides prices for selected collections, products, tags, or types.",
    customizable: true,
  },
  {
    id: "hide-button",
    title: "Hide Wishlist Button",
    category: "Buttons",
    description: "Hides wishlist actions for products that are not eligible.",
    customizable: true,
  },
  {
    id: "custom-code",
    title: "Custom Code",
    category: "Features",
    description:
      "Adds custom CSS and JavaScript for advanced storefront styling.",
    customizable: true,
  },
  {
    id: "multiple",
    title: "Multiple Wishlists",
    category: "Features",
    description:
      "Allows shoppers to create separate wishlists for different purposes.",
    customizable: true,
  },
  {
    id: "account-page",
    title: "Wishlist In Account Page",
    category: "Features",
    description: "Integrates wishlist content into the customer account page.",
    locked: true,
  },
  {
    id: "translations",
    title: "Translations",
    category: "Features",
    description: "Exports storefront text for translation and imports it back.",
    customizable: true,
  },
] as const;

function FeaturePreview({ feature }: { feature: Feature }) {
  return (
    <div
      className={`favlio-feature-preview preview-${feature.category.toLowerCase().replace(" ", "-")}`}
      aria-hidden="true"
    >
      <span className="preview-line wide" />
      <span className="preview-line" />
      <div className="preview-content">
        <span />
        <span className="preview-heart">♥</span>
        <span />
      </div>
      <span className="preview-action">
        {feature.category === "Buttons"
          ? "♡ Add to wishlist"
          : feature.title.split(" ")[0]}
      </span>
    </div>
  );
}

export default function Features() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | FeatureCategory>("All");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "collection-button": true,
    "guest-wishlist": true,
    analytics: true,
  });

  const visibleFeatures = useMemo(
    () =>
      features.filter(
        (feature) =>
          (category === "All" || feature.category === category) &&
          `${feature.title} ${feature.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [category, query],
  );

  return (
    <s-page heading="All features" inlineSize="large">
      <s-app-window
        id="collection-button-settings-window"
        src="/app/features/collection-button"
      />
      <div className="favlio-shell favlio-feature-shell">
        <div className="favlio-feature-search">
          <s-search-field
            label="Search features"
            labelAccessibilityVisibility="exclusive"
            placeholder="Search features, e.g. back in stock, upsell, POS..."
            value={query}
            onInput={(event) => setQuery(event.currentTarget.value)}
          />
        </div>
        <div className="favlio-filter-row" aria-label="Feature category">
          {(
            ["All", "Buttons", "Widgets", "Wishlist page", "Features"] as const
          ).map((item) => (
            <button
              className={category === item ? "active" : ""}
              key={item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="favlio-feature-grid">
          {visibleFeatures.map((feature) => (
            <article className="favlio-feature-card" key={feature.id}>
              <div className="favlio-card-heading">
                <h2>
                  {feature.locked && <span aria-label="Locked">⌾ </span>}
                  {feature.title}
                </h2>
                <span className="favlio-type-badge">
                  {feature.category === "Wishlist page"
                    ? "Page"
                    : feature.category.slice(0, -1) || "Feature"}
                </span>
              </div>
              <FeaturePreview feature={feature} />
              <p>{feature.description}</p>
              <div className="favlio-card-actions">
                {feature.locked ? (
                  <s-badge>Available later</s-badge>
                ) : (
                  <s-switch
                    label={`Enable ${feature.title}`}
                    checked={Boolean(enabled[feature.id])}
                    onChange={(event) =>
                      setEnabled((current) => ({
                        ...current,
                        [feature.id]: event.currentTarget.checked,
                      }))
                    }
                  />
                )}
                {feature.customizable && (
                  <s-button
                    {...(feature.id === "collection-button"
                      ? {
                          command: "--show" as const,
                          commandFor: "collection-button-settings-window",
                        }
                      : {})}
                  >
                    Customize
                  </s-button>
                )}
              </div>
            </article>
          ))}
        </div>
        {visibleFeatures.length === 0 && (
          <div className="favlio-empty">No features match your search.</div>
        )}
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
