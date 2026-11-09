import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import "../styles/favlio-admin.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

const topProducts = [
  ["Serenity Floor Basket", 100],
  ["Serenity Alternative Casket Spray", 39],
  ["Poppy - Luxe Line", 39],
  ["June", 16],
  ["Rose Casket Spray", 8],
  ["Stately Casket Spray", 8],
  ["Serenity Wreath Easel", 8],
  ["Serenity Stylized", 5],
] as const;

function LineChart({ path, maxLabel }: { path: string; maxLabel: string }) {
  return (
    <svg
      className="favlio-line-chart"
      viewBox="0 0 520 205"
      role="img"
      aria-label="Thirty day trend chart"
    >
      {[35, 85, 135, 185].map((y) => (
        <line key={y} x1="42" x2="510" y1={y} y2={y} />
      ))}
      <text x="4" y="39">
        {maxLabel}
      </text>
      <text x="22" y="189">
        0
      </text>
      <path d={path} />
      <text x="42" y="203">
        Oct 10
      </text>
      <text x="178" y="203">
        Oct 18
      </text>
      <text x="318" y="203">
        Oct 26
      </text>
      <text x="454" y="203">
        Nov 7
      </text>
    </svg>
  );
}

export default function Analytics() {
  return (
    <s-page heading="Analytics">
      <div className="favlio-shell">
        <div className="favlio-heading-row">
          <s-paragraph color="subdued">Days are in UTC</s-paragraph>
          <s-badge tone="info">Last 30 days</s-badge>
        </div>

        <div className="favlio-metric-strip">
          <div>
            <span>Items saved</span>
            <strong>42</strong>
            <small>+18% from previous period</small>
          </div>
          <div>
            <span>Wishlist page views</span>
            <strong>17</strong>
            <small>8 unique shoppers</small>
          </div>
          <div>
            <span>Added to cart</span>
            <strong>6</strong>
            <small>14.3% conversion</small>
          </div>
        </div>

        <div className="favlio-analytics-grid">
          <article className="favlio-chart-card">
            <h2>Items saved</h2>
            <p>Times a product was added to a wishlist, per day.</p>
            <LineChart
              maxLabel="12"
              path="M42 172 C65 170 72 110 92 112 S103 30 119 25 S135 172 160 172 C205 172 199 148 230 158 S264 150 286 164 S345 170 366 171 S390 155 411 169 S439 170 452 93 S478 164 510 184"
            />
          </article>
          <article className="favlio-chart-card">
            <h2>Wishlist page views</h2>
            <p>Times shoppers opened the wishlist page, per day.</p>
            <LineChart
              maxLabel="2"
              path="M42 184 L230 184 C250 184 248 38 268 36 S287 184 310 184 L348 184 C363 184 362 93 378 92 S394 184 414 184 L510 184"
            />
          </article>
          <article className="favlio-chart-card">
            <h2>Added to cart from wishlist</h2>
            <p>Times a product was added to cart from a wishlist, per day.</p>
            <LineChart
              maxLabel="4"
              path="M42 184 L198 184 C211 184 211 136 224 135 S238 184 255 184 L365 184 C377 184 377 160 390 159 S405 184 421 184 L510 184"
            />
          </article>
          <article className="favlio-chart-card">
            <h2>Top products</h2>
            <p>Products saved to wishlists most often in the last 30 days.</p>
            <div className="favlio-bars">
              {topProducts.map(([label, width]) => (
                <div className="favlio-bar-row" key={label}>
                  <span>{label}</span>
                  <div>
                    <i style={{ width: `${width}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
