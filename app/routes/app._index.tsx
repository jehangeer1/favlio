import { useEffect, useMemo, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";

import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import "../styles/favlio-admin.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [settings, totalWishlists, totalSavedItems, customerWishlists] =
    await Promise.all([
      prisma.collectionButtonSettings.findUnique({
        where: { shop: session.shop },
        select: { enabled: true },
      }),
      prisma.wishlist.count({ where: { shop: session.shop } }),
      prisma.wishlistItem.count({
        where: { wishlist: { shop: session.shop } },
      }),
      prisma.wishlist.findMany({
        where: { shop: session.shop, customerId: { not: null } },
        distinct: ["customerId"],
        select: { customerId: true },
      }),
    ]);

  const apiKey = process.env.SHOPIFY_API_KEY ?? "";
  const appEmbedHandle = "favlio-wishlist";

  return {
    collectionButtonEnabled: settings?.enabled ?? false,
    metrics: {
      wishlists: totalWishlists,
      customers: customerWishlists.length,
      savedItems: totalSavedItems,
    },
    themeEditorUrl: `https://${session.shop}/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/${appEmbedHandle}`,
  };
};

const slides = [
  {
    eyebrow: "Storefront ready",
    title: "Turn product discovery into saved favorites",
    description:
      "Let shoppers save products from collection pages and return when they are ready to buy.",
  },
  {
    eyebrow: "Designed for every device",
    title: "A fast wishlist experience on mobile and desktop",
    description:
      "Favlio uses your configured colors, icon style and placement across responsive product grids.",
  },
  {
    eyebrow: "Built for growth",
    title: "Learn which products shoppers want most",
    description:
      "Wishlist activity is stored in your app database and is ready to power product insights.",
  },
] as const;

export default function Home() {
  const data = useLoaderData<typeof loader>();
  const shopify = useAppBridge();
  const [embedActive, setEmbedActive] = useState<boolean | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    shopify.app
      .extensions()
      .then((extensions) => {
        const isActive = extensions.some((extension) => {
          if (extension.type !== "theme_app_extension") return false;
          const activations = extension.activations as Array<{
            handle: string;
            status: string;
          }>;
          return activations.some(
            (activation) =>
              activation.handle === "favlio-wishlist" &&
              activation.status === "active",
          );
        });

        if (!cancelled) setEmbedActive(isActive);
      })
      .catch(() => {
        if (!cancelled) setEmbedActive(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shopify]);

  useEffect(() => {
    const interval = window.setInterval(
      () => setSlideIndex((current) => (current + 1) % slides.length),
      7000,
    );
    return () => window.clearInterval(interval);
  }, []);

  const setupSteps = useMemo(
    () => [
      {
        complete: embedActive === true,
        title: "Enable the Favlio Wishlist app embed",
        description:
          "Open the current theme, switch on Favlio Wishlist under App embeds, and save the theme.",
        action: "Enable app embed",
        href: data.themeEditorUrl,
        external: true,
      },
      {
        complete: data.collectionButtonEnabled,
        title: "Enable the collection wishlist button",
        description:
          "Customize the collection button, turn it on, and save your storefront settings.",
        action: "Configure button",
        href: "/app/features",
        external: false,
      },
    ],
    [data.collectionButtonEnabled, data.themeEditorUrl, embedActive],
  );
  const completedSteps = setupSteps.filter((step) => step.complete).length;
  const slide = slides[slideIndex];

  return (
    <s-page heading="Favlio Wishlist" inlineSize="base">
      <div className="favlio-shell favlio-home-shell">
        <s-section heading="Favlio Wishlist storefront">
          <s-badge
            slot="supplemental"
            tone={embedActive ? "success" : "warning"}
          >
            {embedActive === null
              ? "Checking"
              : embedActive
                ? "Active"
                : "Action required"}
          </s-badge>
          <div className="favlio-home-brand">
            <img src="/favlio-icon.png" alt="Favlio Wishlist" />
            <div>
              <s-paragraph color="subdued">
                Enable the app embed to load Favlio wishlist features on your
                live theme.
              </s-paragraph>
              <div className="favlio-home-primary-action">
                <s-button
                  variant="primary"
                  href={data.themeEditorUrl}
                  target="_top"
                >
                  {embedActive ? "Open theme editor" : "Enable app embed"}
                </s-button>
              </div>
            </div>
          </div>
        </s-section>

        <s-section heading="Setup guide">
          <s-badge slot="supplemental">
            {completedSteps === setupSteps.length ? "Complete" : "About 4 min"}
          </s-badge>
          <s-paragraph color="subdued">
            {completedSteps} of {setupSteps.length} completed
          </s-paragraph>
          <div className="favlio-setup-progress" aria-hidden="true">
            <span
              style={{
                width: `${(completedSteps / setupSteps.length) * 100}%`,
              }}
            />
          </div>
          <div className="favlio-setup-list">
            {setupSteps.map((step) => (
              <div className="favlio-setup-step" key={step.title}>
                <span
                  className={`favlio-step-marker ${step.complete ? "complete" : ""}`}
                  aria-hidden="true"
                >
                  {step.complete ? "✓" : ""}
                </span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                  {!step.complete && (
                    <s-button
                      href={step.href}
                      {...(step.external ? { target: "_top" as const } : {})}
                    >
                      {step.action}
                    </s-button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </s-section>

        <s-section padding="none" accessibilityLabel="Wishlist metrics">
          <div className="favlio-home-metrics">
            <div>
              <span>Total wishlists</span>
              <strong>{data.metrics.wishlists}</strong>
            </div>
            <div>
              <span>Total customers</span>
              <strong>{data.metrics.customers}</strong>
            </div>
            <div>
              <span>Total saved items</span>
              <strong>{data.metrics.savedItems}</strong>
            </div>
          </div>
        </s-section>

        <section
          className="favlio-home-carousel"
          aria-label="Favlio highlights"
        >
          <div className="favlio-carousel-copy">
            <span>{slide.eyebrow}</span>
            <h2>{slide.title}</h2>
            <p>{slide.description}</p>
            <s-button href="/app/features">Explore features</s-button>
          </div>
          <div className="favlio-carousel-art" aria-hidden="true">
            <span className="favlio-art-card card-one">♥</span>
            <span className="favlio-art-card card-two">
              <img src="/favlio-icon.png" alt="" />
            </span>
            <span className="favlio-art-card card-three">+1</span>
          </div>
          <div className="favlio-carousel-dots" aria-label="Choose slide">
            {slides.map((item, index) => (
              <button
                type="button"
                key={item.title}
                aria-label={`Show slide ${index + 1}`}
                aria-pressed={slideIndex === index}
                onClick={() => setSlideIndex(index)}
              />
            ))}
          </div>
        </section>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
