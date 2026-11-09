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

type CustomerType = "All" | "Users" | "Guests";
const customers = [
  {
    id: "Guest",
    name: "Guest",
    email: "No account",
    products: 1,
    firstSaved: "Nov 7, 2026",
    type: "Guests",
  },
  {
    id: "8027768520739",
    name: "Jackson Scott",
    email: "jackson.scott@example.com",
    products: 5,
    firstSaved: "Nov 3, 2026",
    type: "Users",
  },
  {
    id: "8027814439011",
    name: "Mia Thompson",
    email: "mia.thompson@example.com",
    products: 3,
    firstSaved: "Oct 29, 2026",
    type: "Users",
  },
  {
    id: "Guest-9f21",
    name: "Guest",
    email: "Browser wishlist",
    products: 2,
    firstSaved: "Oct 22, 2026",
    type: "Guests",
  },
] as const;

export default function Customers() {
  const [segment, setSegment] = useState<CustomerType>("All");
  const [query, setQuery] = useState("");
  const [descending, setDescending] = useState(true);

  const visibleCustomers = useMemo(
    () =>
      customers
        .filter((customer) => segment === "All" || customer.type === segment)
        .filter((customer) =>
          `${customer.name} ${customer.email} ${customer.id}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .sort((first, second) =>
          descending
            ? second.products - first.products
            : first.products - second.products,
        ),
    [descending, query, segment],
  );

  return (
    <s-page heading="Customers">
      <div className="favlio-shell">
        <s-section padding="none">
          <div className="favlio-customer-toolbar">
            <div className="favlio-segments" aria-label="Customer type">
              {(["All", "Users", "Guests"] as CustomerType[]).map((item) => (
                <button
                  className={segment === item ? "active" : ""}
                  key={item}
                  onClick={() => setSegment(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="favlio-customer-actions">
              <s-search-field
                label="Search customers"
                labelAccessibilityVisibility="exclusive"
                placeholder="Search customers"
                value={query}
                onInput={(event) => setQuery(event.currentTarget.value)}
              />
              <s-button
                accessibilityLabel="Sort customers"
                onClick={() => setDescending((current) => !current)}
              >
                Sort
              </s-button>
            </div>
          </div>
          <s-table variant="auto">
            <s-table-header-row>
              <s-table-header listSlot="kicker">ID</s-table-header>
              <s-table-header listSlot="primary">Customer</s-table-header>
              <s-table-header listSlot="labeled" format="numeric">
                Products count
              </s-table-header>
              <s-table-header listSlot="secondary">First saved</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {visibleCustomers.map((customer) => (
                <s-table-row key={customer.id}>
                  <s-table-cell>
                    {customer.type === "Guests" ? (
                      <s-badge>Guest</s-badge>
                    ) : (
                      customer.id
                    )}
                  </s-table-cell>
                  <s-table-cell>
                    <div className="favlio-customer-name">
                      <s-text type="strong">{customer.name}</s-text>
                      <small>{customer.email}</small>
                    </div>
                  </s-table-cell>
                  <s-table-cell>{customer.products}</s-table-cell>
                  <s-table-cell>{customer.firstSaved}</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
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
