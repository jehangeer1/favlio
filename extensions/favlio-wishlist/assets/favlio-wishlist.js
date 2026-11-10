(() => {
  const root = document.getElementById("favlio-wishlist-root");
  if (!root || root.dataset.initialized === "true") return;
  root.dataset.initialized = "true";

  const supportedPages = new Set(["index", "collection", "search"]);
  if (!supportedPages.has(root.dataset.pageType || "")) return;

  const endpoint = root.dataset.endpoint || "/apps/favlio-wishlist";
  const labels = {
    add: root.dataset.addLabel || "Add to wishlist",
    remove: root.dataset.removeLabel || "Remove from wishlist",
    error: root.dataset.errorLabel || "Unable to update wishlist",
  };
  const icons = { heart: "♥", star: "★", bookmark: "▮", custom: "✦" };
  const productCache = new Map();
  let config = null;
  let savedVariantIds = new Set();

  const guestId = (() => {
    const key = "favlio_guest_id";
    let value = localStorage.getItem(key);
    if (!value) {
      value =
        window.crypto?.randomUUID?.() ||
        `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, value);
    }
    return value;
  })();

  function productHandle(link) {
    try {
      const match = new URL(link.href, location.origin).pathname.match(
        /\/products\/([^/?#]+)/,
      );
      return match?.[1] || "";
    } catch {
      return "";
    }
  }

  function productCard(link) {
    return link.closest(
      "[data-product-card], .card-wrapper, .product-card-wrapper, .product-card, .grid__item, li",
    );
  }

  function productAnchor(card, link) {
    return (
      card.querySelector(
        ".card__inner, .card__media, .product-card__image, .media",
      ) ||
      link.closest(".media") ||
      card
    );
  }

  async function loadProduct(handle) {
    if (!productCache.has(handle)) {
      productCache.set(
        handle,
        fetch(`/products/${encodeURIComponent(handle)}.js`, {
          headers: { Accept: "application/json" },
        }).then((response) => {
          if (!response.ok) throw new Error("Product unavailable");
          return response.json();
        }),
      );
    }
    return productCache.get(handle);
  }

  function setButtonState(button, active) {
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", active ? labels.remove : labels.add);
    button.title = active ? labels.remove : labels.add;
  }

  function applySettings(button) {
    const settings = config.settings;
    button.dataset.placement = settings.placement;
    button.classList.toggle("favlio-hover-only", settings.showOnHover);
    button.classList.add(`favlio-animation-${settings.iconAnimation}`);
    button.style.setProperty("--favlio-background", settings.backgroundColor);
    button.style.setProperty(
      "--favlio-active-background",
      settings.activeBackgroundColor,
    );
    button.style.setProperty("--favlio-padding", `${settings.padding}px`);
    button.style.setProperty("--favlio-radius", `${settings.borderRadius}%`);
    button.style.setProperty("--favlio-icon-color", settings.iconColor);
    button.style.setProperty(
      "--favlio-active-icon-color",
      settings.activeIconColor,
    );
    button.style.setProperty("--favlio-icon-size", `${settings.iconSize}px`);
    button.textContent = icons[settings.iconStyle] || icons.heart;
  }

  async function hydrateButton(button, handle) {
    try {
      const product = await loadProduct(handle);
      const variant =
        product.variants.find((item) => item.available) || product.variants[0];
      if (!variant) return;
      button.favlioProduct = { product, variant, handle };
      setButtonState(button, savedVariantIds.has(String(variant.id)));
    } catch {
      button.remove();
    }
  }

  function injectButtons() {
    if (!config?.enabled || !config.settings) return;

    document.querySelectorAll('a[href*="/products/"]').forEach((link) => {
      const handle = productHandle(link);
      const card = productCard(link);
      if (!handle || !card || card.querySelector(".favlio-wishlist-button"))
        return;
      if (!card.querySelector("img")) return;

      const anchor = productAnchor(card, link);
      card.classList.add("favlio-product-card");
      anchor.classList.add("favlio-product-anchor");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "favlio-wishlist-button";
      button.dataset.productHandle = handle;
      setButtonState(button, false);
      applySettings(button);
      anchor.append(button);
      void hydrateButton(button, handle);
    });
  }

  async function toggleWishlist(button) {
    const data = button.favlioProduct;
    if (!data || button.disabled) return;

    button.disabled = true;
    try {
      const { product, variant, handle } = data;
      const response = await fetch(
        `${endpoint}?guest_id=${encodeURIComponent(guestId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            productId: `gid://shopify/Product/${product.id}`,
            variantId: String(variant.id),
            productHandle: handle,
            productTitle: product.title,
            variantTitle: variant.title,
            imageUrl: product.featured_image || product.images?.[0] || "",
            price: (Number(variant.price) / 100).toFixed(2),
            currencyCode: root.dataset.currency || "",
          }),
        },
      );
      if (!response.ok) throw new Error(labels.error);
      const result = await response.json();
      if (result.active) savedVariantIds.add(String(variant.id));
      else savedVariantIds.delete(String(variant.id));
      document
        .querySelectorAll(
          `.favlio-wishlist-button[data-product-handle="${CSS.escape(handle)}"]`,
        )
        .forEach((match) => setButtonState(match, result.active));
    } catch (error) {
      console.error("Favlio Wishlist:", error);
    } finally {
      button.disabled = false;
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".favlio-wishlist-button");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    void toggleWishlist(button);
  });

  fetch(`${endpoint}?guest_id=${encodeURIComponent(guestId)}`, {
    headers: { Accept: "application/json" },
  })
    .then((response) => {
      if (!response.ok) throw new Error("Settings unavailable");
      return response.json();
    })
    .then((data) => {
      config = data;
      savedVariantIds = new Set((data.savedVariantIds || []).map(String));
      injectButtons();
      const observer = new MutationObserver(() => injectButtons());
      observer.observe(document.body, { childList: true, subtree: true });
      document.addEventListener("shopify:section:load", injectButtons);
    })
    .catch((error) => console.error("Favlio Wishlist:", error));
})();
