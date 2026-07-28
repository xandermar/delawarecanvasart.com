/**
 * Uses STRIPE_SECRET_KEY from GitHub Secrets to create (or reuse) Stripe
 * Prices + Payment Links for every product × canvas size.
 *
 * Writes assets/js/stripe-links.generated.js — loaded by the static site.
 * No Cloudflare or other host required.
 *
 * Each size maps to a Prodigi Standard stretched canvas SKU (GLOBAL-CAN-*).
 * Fulfillment metadata on Price + Payment Link (snake_case for webhook):
 *   size_id, prodigi_sku, prodigi_wrap, image_url, product_title
 *
 * If you switch from sk_test_… to sk_live_… (or back), this script discards
 * existing links from the other mode and creates new ones. Set FORCE_RESYNC=1
 * to recreate all links even when the mode matches.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is missing (GitHub → Settings → Secrets).");
  process.exit(1);
}

const stripeMode = key.startsWith("sk_live_")
  ? "live"
  : key.startsWith("sk_test_")
    ? "test"
    : null;

if (!stripeMode) {
  console.error("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.");
  process.exit(1);
}

const forceResync = ["1", "true", "yes"].includes(
  String(process.env.FORCE_RESYNC || "").toLowerCase()
);

/** Prodigi Standard stretched canvas (gallery / image wrap). */
const PRODIGI_WRAP = "ImageWrap";
const PRODIGI_SKUS = {
  "8x10": "GLOBAL-CAN-8X10",
  "11x14": "GLOBAL-CAN-11X14",
  "12x12": "GLOBAL-CAN-12X12",
  "16x20": "GLOBAL-CAN-16X20"
};

const siteUrl = (
  process.env.SITE_URL || "https://www.delawarecanvasart.com"
).replace(/\/$/, "");
// Stripe replaces {CHECKOUT_SESSION_ID} after payment (usable as order reference).
const successUrl = `${siteUrl}/success.html?order={CHECKOUT_SESSION_ID}`;
const outPath = path.resolve("assets/js/stripe-links.generated.js");

console.log(
  `Stripe mode: ${stripeMode}${forceResync ? " (FORCE_RESYNC enabled)" : ""}`
);

function prodigiForSize(sizeId) {
  const sku = PRODIGI_SKUS[sizeId];
  if (!sku) {
    throw new Error(
      `No Prodigi SKU mapped for size "${sizeId}". Add it to PRODIGI_SKUS.`
    );
  }
  return { sku, wrap: PRODIGI_WRAP };
}

async function stripe(method, urlPath, params) {
  const res = await fetch(`https://api.stripe.com/v1/${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params ? params : undefined
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error?.message || JSON.stringify(data);
    throw new Error(`Stripe ${method} ${urlPath}: ${msg}`);
  }
  return data;
}

function bustProductPageCaches() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const gallery = path.resolve("gallery");
  for (const name of fs.readdirSync(gallery)) {
    if (!name.endsWith(".html") || name === "index.html") continue;
    const file = path.join(gallery, name);
    let html = fs.readFileSync(file, "utf8");
    const next = html.replace(
      /(stripe-links\.generated\.js\?v=)[^"']+/g,
      `$1${stamp}`
    );
    if (next !== html) {
      fs.writeFileSync(file, next);
      console.log(`Cache-busted ${name} → v=${stamp}`);
    }
  }
}

function loadCatalog() {
  const src = fs.readFileSync("assets/js/products.js", "utf8");
  const ctx = { window: {} };
  vm.runInNewContext(src, ctx);
  const products = ctx.window.DCA_PRODUCTS;
  const sizes = ctx.window.DCA_CANVAS_SIZES;
  if (!products?.length || !sizes?.length) {
    throw new Error("Could not load DCA_PRODUCTS / DCA_CANVAS_SIZES from products.js");
  }
  return { products, sizes };
}

function detectLinkMode(entry) {
  if (!entry) return null;
  if (entry.mode === "live" || entry.mode === "test") return entry.mode;
  const url = String(entry.url || "");
  // Test Payment Links use /test_ in the path; live links do not.
  if (url.includes("buy.stripe.com/test_")) return "test";
  if (url.includes("buy.stripe.com/")) return "live";
  return null;
}

function loadExisting() {
  if (!fs.existsSync(outPath)) return {};
  try {
    const src = fs.readFileSync(outPath, "utf8");
    const ctx = { window: {} };
    vm.runInNewContext(src, ctx);
    return ctx.window.DCA_STRIPE_LINKS || {};
  } catch {
    return {};
  }
}

/** Keep prior entry only when it matches the current Stripe mode and reuse is allowed. */
function reusableEntry(existing) {
  if (forceResync) return {};
  if (!existing?.url || !existing?.priceId || !existing?.paymentLinkId) return {};
  const linkMode = detectLinkMode(existing);
  if (linkMode && linkMode !== stripeMode) {
    console.log(
      `Discarding ${linkMode} link (url mode mismatch for ${stripeMode} key): ${existing.url}`
    );
    return {};
  }
  return existing;
}

async function ensurePrice(product, size, existing) {
  const dcaSku = `${product.id}:${size.id}`;
  const prodigi = prodigiForSize(size.id);
  const meta = fulfillmentMetadata(product, size);

  if (existing?.priceId) {
    // Refresh Price metadata so webhook can resolve SKU from price or session.
    const update = new URLSearchParams();
    for (const [key, value] of Object.entries(meta)) {
      update.set(`metadata[${key}]`, value);
    }
    await stripe("POST", `prices/${existing.priceId}`, update);
    return existing.priceId;
  }

  const params = new URLSearchParams();
  params.set("name", `${product.title} — ${size.label}`);
  params.set(
    "description",
    `Gallery-wrapped canvas · ${size.label} · Delaware Canvas Art`
  );
  for (const [key, value] of Object.entries(meta)) {
    params.set(`metadata[${key}]`, value);
  }
  params.set("metadata[dca_sku]", dcaSku);
  params.set("metadata[dca_mode]", stripeMode);
  params.set("default_price_data[currency]", "usd");
  params.set(
    "default_price_data[unit_amount]",
    String(Math.round(Number(size.price) * 100))
  );
  // Propagate the same fulfillment keys onto the default Price.
  for (const [key, value] of Object.entries(meta)) {
    params.set(`default_price_data[metadata][${key}]`, value);
  }

  const created = await stripe("POST", "products", params);
  const priceId = created.default_price;
  if (!priceId) throw new Error(`No default_price for ${dcaSku}`);
  console.log(
    `Created product/price for ${dcaSku} (${prodigi.sku}) → ${priceId}`
  );
  return typeof priceId === "string" ? priceId : priceId.id;
}

/** Metadata keys expected by the Stripe → Prodigi fulfill webhook. */
function fulfillmentMetadata(product, size) {
  const prodigi = prodigiForSize(size.id);
  const imageUrl = String(product.image || "").trim();
  if (!imageUrl) {
    throw new Error(`Product "${product.id}" is missing image URL for Prodigi.`);
  }
  return {
    size_id: size.id,
    prodigi_sku: prodigi.sku,
    prodigi_wrap: prodigi.wrap,
    image_url: imageUrl,
    product_title: product.title,
    product_id: product.id,
    size_label: size.label,
    price: String(size.price)
  };
}

function paymentLinkMetadata(product, size) {
  const meta = fulfillmentMetadata(product, size);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(meta)) {
    params.set(`metadata[${key}]`, value);
  }
  params.set("metadata[dca_mode]", stripeMode);
  return params;
}

async function ensurePaymentLink(priceId, product, size, existing) {
  const prodigi = prodigiForSize(size.id);

  if (existing?.url && existing?.paymentLinkId) {
    // Keep the buy URL; refresh redirect, coupons, and Prodigi metadata.
    const update = paymentLinkMetadata(product, size);
    update.set("after_completion[type]", "redirect");
    update.set("after_completion[redirect][url]", successUrl);
    update.set("allow_promotion_codes", "true");
    await stripe("POST", `payment_links/${existing.paymentLinkId}`, update);
    console.log(
      `Updated ${product.id}/${size.id} (${prodigi.sku}) → ${successUrl}`
    );
    return { url: existing.url, paymentLinkId: existing.paymentLinkId };
  }

  const params = paymentLinkMetadata(product, size);
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("after_completion[type]", "redirect");
  params.set("after_completion[redirect][url]", successUrl);
  params.set("allow_promotion_codes", "true");

  const link = await stripe("POST", "payment_links", params);
  console.log(
    `Payment link ${product.id}/${size.id} (${prodigi.sku}) → ${link.url}`
  );
  return { url: link.url, paymentLinkId: link.id };
}

const { products, sizes } = loadCatalog();
for (const size of sizes) {
  prodigiForSize(size.id); // fail fast if a catalog size lacks a Prodigi SKU
}

const existingAll = loadExisting();
const result = {};
let created = 0;
let reused = 0;

for (const product of products) {
  result[product.id] = {};
  for (const size of sizes) {
    const prev = reusableEntry(existingAll[product.id]?.[size.id] || {});
    const wasReuse = Boolean(prev.priceId && prev.url);
    const prodigi = prodigiForSize(size.id);
    const priceId = await ensurePrice(product, size, prev);
    const link = await ensurePaymentLink(priceId, product, size, prev);
    if (wasReuse) reused += 1;
    else created += 1;
    result[product.id][size.id] = {
      url: link.url,
      paymentLinkId: link.paymentLinkId,
      priceId,
      name: product.title,
      size: size.label,
      price: size.price,
      size_id: size.id,
      prodigi_sku: prodigi.sku,
      prodigi_wrap: prodigi.wrap,
      image_url: String(product.image || ""),
      mode: stripeMode
    };
  }
}

const banner = `/**
 * AUTO-GENERATED by .github/scripts/sync-stripe-payment-links.mjs
 * Do not edit by hand. Re-run workflow "Sync Stripe payment links".
 * Generated: ${new Date().toISOString()}
 * Stripe mode: ${stripeMode}
 */
window.DCA_STRIPE_LINKS = ${JSON.stringify(result, null, 2)};
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, banner);
console.log(`Wrote ${outPath}`);
bustProductPageCaches();
console.log(
  `Synced ${products.length} products × ${sizes.length} sizes (${created} created, ${reused} reused) in ${stripeMode} mode.`
);
