/**
 * Real-time Stripe Checkout Session endpoint for Delaware Canvas Art.
 *
 * Deploy this alongside the existing Stripe → Prodigi fulfillment webhook so
 * the storefront can create a Checkout Session on demand. Pricing is ALWAYS
 * read live from the canvas product index (build_cost.total) at the moment of
 * checkout, so Stripe can never charge a stale price.
 *
 * The browser never sends the price — it only sends which product + size
 * variant the shopper picked. This module looks up the authoritative price
 * server-side, keeping checkout in sync with the index.
 *
 * Portable: uses only the global fetch/Request/Response APIs, so it runs on
 * Node 18+, Cloudflare Workers, Vercel, Netlify, etc. See the adapters at the
 * bottom of this file for wiring into a specific host.
 *
 * Required env:
 *   STRIPE_SECRET_KEY   sk_live_... or sk_test_...
 * Optional env:
 *   SITE_URL            default https://www.delawarecanvasart.com
 *   PRODUCT_INDEX_URL   default https://canvas.xdm.io/backend/product-index.json
 *   ALLOWED_ORIGIN      CORS origin allowed to call this endpoint (default *)
 */

const DEFAULT_SITE_URL = "https://www.delawarecanvasart.com";
const DEFAULT_PRODUCT_INDEX_URL =
  "https://canvas.xdm.io/backend/product-index.json";
const PRODIGI_WRAP = "ImageWrap";

class CheckoutError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function requireField(payload, key) {
  const value = String(payload?.[key] ?? "").trim();
  if (!value) {
    throw new CheckoutError(400, `Missing required field: ${key}`);
  }
  return value;
}

/** Fetch the product index live and return the authoritative build_cost.total. */
async function resolveIndexPrice(prodigiSku, productIndexUrl) {
  let index;
  try {
    const res = await fetch(productIndexUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!res.ok) {
      throw new CheckoutError(
        502,
        `Product index request failed: HTTP ${res.status}`
      );
    }
    index = await res.json();
  } catch (err) {
    if (err instanceof CheckoutError) throw err;
    throw new CheckoutError(502, `Could not load product index: ${err.message}`);
  }

  const product = index?.products?.[prodigiSku];
  if (!product) {
    throw new CheckoutError(400, `Unknown Prodigi SKU: ${prodigiSku}`);
  }

  const total = Number(product?.build_cost?.total);
  const currency = String(product?.build_cost?.currency || "").toUpperCase();
  if (!Number.isFinite(total) || total <= 0 || currency !== "USD") {
    throw new CheckoutError(
      502,
      `Product index has no valid USD build_cost.total for ${prodigiSku}`
    );
  }

  return { total, unitAmount: Math.round(total * 100), currency };
}

/**
 * Core logic: validate the request, resolve the live price, create a Stripe
 * Checkout Session, and return its hosted URL.
 *
 * @returns {Promise<{ url: string, sessionId: string, price: number }>}
 */
export async function createCheckoutSession(payload, env = {}) {
  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new CheckoutError(500, "STRIPE_SECRET_KEY is not configured.");
  }

  const siteUrl = String(env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
  const productIndexUrl = env.PRODUCT_INDEX_URL || DEFAULT_PRODUCT_INDEX_URL;

  const prodigiSku = requireField(payload, "prodigiSku");
  const productId = requireField(payload, "productId");
  const productTitle = requireField(payload, "productTitle");
  const imageUrl = requireField(payload, "imageUrl");
  const variantId = String(payload?.variantId || "").trim();
  const sizeId = String(payload?.sizeId || variantId).trim();
  const orientation = String(payload?.orientation || "").trim().toLowerCase();
  const sizeLabel = String(payload?.sizeLabel || sizeId).trim();

  const { total, unitAmount } = await resolveIndexPrice(
    prodigiSku,
    productIndexUrl
  );

  const successUrl = `${siteUrl}/success.html?order={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${siteUrl}/cancel.html`;

  const metadata = {
    productId,
    product_id: productId,
    product_title: productTitle,
    name: productTitle,
    size: sizeLabel,
    size_id: sizeId,
    sizeId,
    variant_id: variantId,
    orientation,
    prodigi_sku: prodigiSku,
    prodigi_wrap: PRODIGI_WRAP,
    image_url: imageUrl,
    price: String(total)
  };

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set("allow_promotion_codes", "true");
  params.set("shipping_address_collection[allowed_countries][0]", "US");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(unitAmount));
  params.set(
    "line_items[0][price_data][product_data][name]",
    `${productTitle} — ${sizeLabel}`
  );
  params.set(
    "line_items[0][price_data][product_data][description]",
    `Gallery-wrapped canvas · ${sizeLabel} · Delaware Canvas Art`
  );

  // Store the same fulfillment metadata on both the session and the resulting
  // PaymentIntent so the webhook can read it from either object.
  for (const [k, v] of Object.entries(metadata)) {
    params.set(`metadata[${k}]`, v);
    params.set(`payment_intent_data[metadata][${k}]`, v);
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  const session = await res.json();
  if (!res.ok) {
    const msg = session?.error?.message || JSON.stringify(session);
    throw new CheckoutError(502, `Stripe error: ${msg}`);
  }

  return { url: session.url, sessionId: session.id, price: total };
}

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

/**
 * Web-standard handler (Cloudflare Workers, Vercel Edge, Deno, Bun, etc.).
 * Mount it at e.g. POST /create-checkout-session on your webhook host.
 */
export async function handleRequest(request, env = {}) {
  const headers = { "Content-Type": "application/json", ...corsHeaders(env) };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(env) });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers
    });
  }

  try {
    const payload = await request.json();
    const result = await createCheckoutSession(payload, env);
    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    const status = err instanceof CheckoutError ? err.statusCode : 500;
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers
    });
  }
}

/**
 * Node http(s) adapter (Express-style req/res) for hosts that don't expose the
 * Web Request API. Example:
 *
 *   import { nodeHandler } from "./create-checkout-session.mjs";
 *   app.post("/create-checkout-session", (req, res) =>
 *     nodeHandler(req, res, process.env)
 *   );
 */
export async function nodeHandler(req, res, env = {}) {
  const cors = corsHeaders(env);
  for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await createCheckoutSession(body, env);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result));
  } catch (err) {
    const status = err instanceof CheckoutError ? err.statusCode : 500;
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err.message }));
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new CheckoutError(413, "Payload too large"));
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new CheckoutError(400, "Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
