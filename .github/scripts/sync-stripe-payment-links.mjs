/**
 * Uses STRIPE_SECRET_KEY from GitHub Secrets to create (or reuse) Stripe
 * Prices + Payment Links for every product × canvas size.
 *
 * Writes assets/js/stripe-links.generated.js — loaded by the static site.
 * No Cloudflare or other host required.
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

const siteUrl = (
  process.env.SITE_URL || "https://www.delawarecanvasart.com"
).replace(/\/$/, "");
// Stripe replaces {CHECKOUT_SESSION_ID} after payment (usable as order reference).
const successUrl = `${siteUrl}/success.html?order={CHECKOUT_SESSION_ID}`;
const outPath = path.resolve("assets/js/stripe-links.generated.js");

console.log(
  `Stripe mode: ${stripeMode}${forceResync ? " (FORCE_RESYNC enabled)" : ""}`
);

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
  if (existing?.priceId) {
    return existing.priceId;
  }

  const sku = `${product.id}:${size.id}`;
  const params = new URLSearchParams();
  params.set("name", `${product.title} — ${size.label}`);
  params.set(
    "description",
    `Gallery-wrapped canvas · ${size.label} · Delaware Canvas Art`
  );
  params.set("metadata[dca_sku]", sku);
  params.set("metadata[productId]", product.id);
  params.set("metadata[sizeId]", size.id);
  params.set("metadata[dca_mode]", stripeMode);
  params.set("default_price_data[currency]", "usd");
  params.set(
    "default_price_data[unit_amount]",
    String(Math.round(Number(size.price) * 100))
  );

  const created = await stripe("POST", "products", params);
  const priceId = created.default_price;
  if (!priceId) throw new Error(`No default_price for ${sku}`);
  console.log(`Created product/price for ${sku} → ${priceId}`);
  return typeof priceId === "string" ? priceId : priceId.id;
}

async function ensurePaymentLink(priceId, product, size, existing) {
  if (existing?.url && existing?.paymentLinkId) {
    // Keep the buy URL; refresh redirect so success page gets ?order=…
    const update = new URLSearchParams();
    update.set("after_completion[type]", "redirect");
    update.set("after_completion[redirect][url]", successUrl);
    await stripe("POST", `payment_links/${existing.paymentLinkId}`, update);
    console.log(
      `Updated redirect for ${product.id}/${size.id} → ${successUrl}`
    );
    return { url: existing.url, paymentLinkId: existing.paymentLinkId };
  }

  const params = new URLSearchParams();
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("after_completion[type]", "redirect");
  params.set("after_completion[redirect][url]", successUrl);
  params.set("metadata[productId]", product.id);
  params.set("metadata[sizeId]", size.id);
  params.set("metadata[name]", product.title);
  params.set("metadata[size]", size.label);
  params.set("metadata[price]", String(size.price));
  params.set("metadata[dca_mode]", stripeMode);

  const link = await stripe("POST", "payment_links", params);
  console.log(`Payment link ${product.id}/${size.id} → ${link.url}`);
  return { url: link.url, paymentLinkId: link.id };
}

const { products, sizes } = loadCatalog();
const existingAll = loadExisting();
const result = {};
let created = 0;
let reused = 0;

for (const product of products) {
  result[product.id] = {};
  for (const size of sizes) {
    const prev = reusableEntry(existingAll[product.id]?.[size.id] || {});
    const wasReuse = Boolean(prev.priceId && prev.url);
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
