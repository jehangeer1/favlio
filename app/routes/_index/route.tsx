import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect, Form, useActionData, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <img
          className={styles.logo}
          src="/favlio-icon.png"
          alt="Favlio Wishlist"
        />
        <h1 className={styles.heading}>Favlio Wishlist</h1>
        <p className={styles.text}>
          Help shoppers save favorite products and return when they are ready to
          buy.
        </p>
        {showForm && (
          <Form className={styles.form} method="post">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>{errors?.shop ?? "e.g: my-shop-domain.myshopify.com"}</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Customizable buttons</strong>. Match wishlist actions to
            your storefront style.
          </li>
          <li>
            <strong>Guest wishlists</strong>. Let shoppers save products without
            signing in.
          </li>
          <li>
            <strong>Wishlist insights</strong>. See which products your
            customers save most often.
          </li>
        </ul>
      </div>
    </div>
  );
}
