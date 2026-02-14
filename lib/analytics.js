export function trackEvent(name, params = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", name, params);
  }
}

export function trackPageView(url) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("config", window.__GA4_ID, { page_path: url });
  }
  if (typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
}

export function trackAddToCart({ name, value, currency = "CAD", slug, quantity, pricingModel }) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", "add_to_cart", {
      currency,
      value: value / 100,
      items: [{ item_name: name, item_id: slug, quantity }],
      pricing_model: pricingModel,
    });
  }
  if (typeof window.fbq === "function") {
    window.fbq("track", "AddToCart", {
      content_name: name,
      content_ids: slug ? [slug] : undefined,
      value: value / 100,
      currency,
    });
  }
}

export function trackPurchase({ value, currency = "CAD", transactionId, items = [] }) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", "purchase", {
      transaction_id: transactionId,
      value: value / 100,
      currency,
      items: items.map((i) => ({ item_name: i.description, quantity: i.quantity })),
    });
  }
  if (typeof window.fbq === "function") {
    window.fbq("track", "Purchase", {
      value: value / 100,
      currency,
      num_items: items.length,
    });
  }
}

export function trackBeginCheckout({ value, currency = "CAD" }) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", "begin_checkout", { currency, value: value / 100 });
  }
  if (typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", { value: value / 100, currency });
  }
}

export function trackOptionChange({ slug, option, value, quantity, pricingModel }) {
  trackEvent("option_change", { slug, option, value, quantity, pricing_model: pricingModel });
}

export function trackQuoteLoaded({ slug, quantity, pricingModel, totalCents, unitCents }) {
  trackEvent("quote_loaded", {
    slug,
    quantity,
    pricing_model: pricingModel,
    value: totalCents / 100,
    unit_price: unitCents / 100,
  });
}

export function trackBuyNow({ name, value, currency = "CAD" }) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", "begin_checkout", {
      currency,
      value: value / 100,
      items: [{ item_name: name }],
    });
  }
  if (typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", { value: value / 100, currency });
  }
}

export function trackUploadStarted({ slug }) {
  trackEvent("upload_started", { slug });
}

export function trackUploadCompleted({ slug, fileName, fileSize }) {
  trackEvent("upload_completed", { slug, file_name: fileName, file_size: fileSize });
}
