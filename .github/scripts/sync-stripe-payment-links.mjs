/**
 * Uses STRIPE_SECRET_KEY from GitHub Secrets to create (or reuse) Stripe
 * Prices + Payment Links for every product × canvas size.
 *
 * Writes assets/js/stripe-links.generated.js — loaded by the static site.
 * No Cloudflare or other host required.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is missing (GitHub → Settings → Secrets).");
  process.exit(1);
}

const siteUrl = (process.env.SITE_URL || "https://delawarecanvasart.com").replace(
  /\/$/,
  ""
);
const successUrl = `${siteUrl}/success.html`;
const cancelUrl = `${siteUrl}/cancel.html`;
const outPath = path.resolve("assets/js/stripe-links.generated.js");

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
    return { url: existing.url, paymentLinkId: existing.paymentLinkId };
  }

  const params = new URLSearchParams();
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("after_completion[type]", "redirect");
  params.set("after_completion[redirect][url]", successUrl);
  // Payment Links use after_completion; cancel is browser back — also set metadata
  params.set("metadata[productId]", product.id);
  params.set("metadata[sizeId]", size.id);
  params.set("metadata[name]", product.title);
  params.set("metadata[size]", size.label);
  params.set("metadata[price]", String(size.price));

  const link = await stripe("POST", "payment_links", params);
  console.log(
    `Payment link ${product.id}/${size.id} → ${link.url}`
  );
  return { url: link.url, paymentLinkId: link.id };
}

const { products, sizes } = loadCatalog();
const existingAll = loadExisting();
const result = {};

for (const product of products) {
  result[product.id] = {};
  for (const size of sizes) {
    const prev = existingAll[product.id]?.[size.id] || {};
    const priceId = await ensurePrice(product, size, prev);
    const link = await ensurePaymentLink(priceId, product, size, prev);
    result[product.id][size.id] = {
      url: link.url,
      paymentLinkId: link.paymentLinkId,
      priceId,
      name: product.title,
      size: size.label,
      price: size.price
    };
  }
}

const banner = `/**
 * AUTO-GENERATED by .github/scripts/sync-stripe-payment-links.mjs
 * Do not edit by hand. Re-run workflow "Sync Stripe payment links".
 * Generated: ${new Date().toISOString()}
 */
window.DCA_STRIPE_LINKS = ${JSON.stringify(result, null, 2)};
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, banner);
console.log(`Wrote ${outPath}`);
bustProductPageCaches();
console.log(
  `Synced ${products.length} products × ${sizes.length} sizes using GitHub secret STRIPE_SECRET_KEY.`
);
