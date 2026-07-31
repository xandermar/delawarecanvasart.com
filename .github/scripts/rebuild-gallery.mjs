/**
 * Rebuilds the gallery catalog from the artwork feed and canvas product index.
 *
 * - Removes all gallery product pages (keeps gallery/index.html)
 * - Writes a product detail page for each feed item
 * - Regenerates assets/js/products.js with every portrait/landscape size
 *
 * All products are listed on gallery/index.html via renderGalleryGrid("gallery-all").
 */
import fs from "node:fs";
import path from "node:path";

const FEED_URL = process.env.PRODUCTS_FEED_URL || "https://canvas.xdm.io/products.json";
const PRODUCT_INDEX_URL =
  process.env.PRODUCT_INDEX_URL ||
  "https://canvas.xdm.io/backend/product-index.json";
const galleryDir = path.resolve("gallery");
const productsPath = path.resolve("assets/js/products.js");

function slugify(title) {
  const base = String(title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "product";
}

function uniqueSlug(title, used) {
  let slug = slugify(title);
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  let n = 2;
  while (used.has(`${slug}-${n}`)) n += 1;
  const next = `${slug}-${n}`;
  used.add(next);
  return next;
}

function buildCanvasSizes(productIndex) {
  const entries = Object.entries(productIndex?.products || {});
  if (!entries.length) {
    throw new Error(
      `Product index at ${PRODUCT_INDEX_URL} has no products object.`
    );
  }

  return entries.flatMap(([prodigiSku, product]) => {
    const width = Number(product?.productDimensions?.width);
    const height = Number(product?.productDimensions?.height);
    const price = Number(product?.build_cost?.total);
    const currency = String(product?.build_cost?.currency || "").toUpperCase();

    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      throw new Error(`${prodigiSku} has invalid productDimensions.`);
    }
    if (!Number.isFinite(price) || price <= 0 || currency !== "USD") {
      throw new Error(
        `${prodigiSku} must have a positive USD build_cost.total.`
      );
    }

    const baseId = `${width}x${height}`.toLowerCase();
    return ["portrait", "landscape"].map((orientation) => {
      const displayWidth = orientation === "portrait" ? width : height;
      const displayHeight = orientation === "portrait" ? height : width;
      const pixels = product?.expectedPixels?.master300Dpi?.[orientation];
      if (!pixels?.width || !pixels?.height) {
        throw new Error(
          `${prodigiSku} is missing expectedPixels.master300Dpi.${orientation}.`
        );
      }

      return {
        id: `${baseId}-${orientation}`,
        sizeId: baseId,
        label: `${displayWidth}in wide by ${displayHeight}in high · ${
          orientation === "portrait" ? "Portrait" : "Landscape"
        }`,
        price,
        description: `${displayWidth}×${displayHeight} inch ${orientation} Stretched Canvas on a 38mm Standard Stretcher Bar.`,
        prodigiSku,
        orientation,
        width: displayWidth,
        height: displayHeight,
        aspectRatio: product.aspectRatio,
        masterPixels: {
          width: Number(pixels.width),
          height: Number(pixels.height)
        },
        buildCostTotal: price,
        currency
      };
    });
  });
}

function productPageHtml(productId, cacheBust) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Canvas Print · Delaware Canvas Art</title>
  <meta name="description" content="Premium Stretched Canvas on a 38mm Standard Stretcher Bar print from Delaware Canvas Art. Choose your size and purchase securely with Stripe.">
  <!-- Analytics deferred for mobile PageSpeed -->
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    function dcaLoadAnalytics() {
      var s = document.createElement('script');
      s.src = 'https://www.googletagmanager.com/gtag/js?id=G-YP4TG03PT7';
      s.async = true;
      s.onload = function () {
        gtag('js', new Date());
        gtag('config', 'G-YP4TG03PT7', { transport_type: 'beacon', anonymize_ip: true });
      };
      document.head.appendChild(s);
    }
    window.addEventListener('load', function () {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(dcaLoadAnalytics, { timeout: 4000 });
      } else {
        setTimeout(dcaLoadAnalytics, 3000);
      }
    });
  </script>
  <link rel="icon" href="../assets/images/logo.png" type="image/png">
  <link rel="preload" href="../assets/fonts/source-sans-3-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="../assets/fonts/cormorant-garamond-600-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preconnect" href="https://res.cloudinary.com" crossorigin>
  <link rel="stylesheet" href="../assets/css/styles.css?v=${cacheBust}">
</head>
<body data-product="${productId}">
  <div id="site-nav"></div>

  <section class="product-hero">
    <div class="container">
      <p class="mb-3"><a href="index.html">&larr; Back to Gallery</a></p>
      <div class="row g-4 g-lg-5 align-items-start">
        <div class="col-lg-7">
          <div class="product-image-wrap reveal">
            <img id="product-image" src="" alt="" width="1200" height="900" fetchpriority="high" decoding="async">
          </div>
        </div>
        <div class="col-lg-5 product-info reveal">
          <p class="section-kicker">Canvas Print</p>
          <h1 id="product-title">Loading…</h1>
          <p id="product-description"></p>
          <div id="product-sizes"></div>
          <p class="product-price" id="product-price"></p>
          <p class="size-description" id="size-description"></p>
          <ul class="product-meta" id="product-meta"></ul>
          <div class="stripe-checkout" id="stripe-buy"></div>
        </div>
      </div>
    </div>
  </section>

  <div class="modal" id="stripeSetupModal" tabindex="-1" aria-labelledby="stripeSetupLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="border-radius:2px;border:none">
        <div class="modal-header border-0">
          <h2 class="modal-title fs-5" id="stripeSetupLabel" style="font-family:var(--font-display)">Connect Stripe for this size</h2>
          <button type="button" class="btn-close" data-close-modal aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p>This size and orientation has no Stripe Payment Link yet. Links are generated per size from the current catalog and pricing.</p>
          <ol class="mb-3">
            <li>Confirm repository secret <code>STRIPE_SECRET_KEY</code> is set (<code>sk_test_...</code> or <code>sk_live_...</code>).</li>
            <li>Run Action <strong>Sync Stripe payment links</strong> to create links for every size and orientation.</li>
            <li>Reload this page — Purchase will open Stripe checkout.</li>
          </ol>
          <p class="mb-0 small text-secondary">No Cloudflare or other host is required. Never put the Secret key in frontend JS.</p>
        </div>
        <div class="modal-footer border-0">
          <a class="btn btn-navy" href="https://github.com/xandermar/delawarecanvasart.com/settings/secrets/actions" target="_blank" rel="noopener">GitHub Secrets</a>
          <button type="button" class="btn btn-outline-navy" data-close-modal>Close</button>
        </div>
      </div>
    </div>
  </div>

  <div id="site-footer"></div>

  <script src="../assets/js/config.js?v=${cacheBust}" defer></script>
  <script src="../assets/js/products.js?v=${cacheBust}" defer></script>
  <script src="../assets/js/stripe-links.generated.js?v=${cacheBust}" defer></script>
  <script src="../assets/js/main.js?v=${cacheBust}" defer></script>
</body>
</html>
`;
}

function writeProductsJs(sizes, products, generatedAt) {
  const banner = `/**
 * Product catalog — portrait and landscape canvas variants per print.
 *
 * AUTO-GENERATED by .github/scripts/rebuild-gallery.mjs
 * Artwork source: ${FEED_URL}
 * Size/price source: ${PRODUCT_INDEX_URL} (build_cost.total)
 * Generated: ${generatedAt}
 *
 * Checkout: store STRIPE_SECRET_KEY in GitHub Secrets, then run Action
 * "Sync Stripe payment links". That writes Payment Links into
 * stripe-links.generated.js — no Cloudflare or other host.
 */
`;

  const productBlocks = products.map((product) => {
    const data = { ...product };
    delete data.stripe;
    const lines = Object.entries(data).map(
      ([key, value]) => `    ${key}: ${JSON.stringify(value)}`
    );
    lines.push("    stripe: dcaEmptySizeLinks()");
    return `  {\n${lines.join(",\n")}\n  }`;
  });

  const body = `${banner}
window.DCA_CANVAS_SIZES = ${JSON.stringify(sizes, null, 2)};

function dcaEmptySizeLinks() {
  return Object.fromEntries(
    window.DCA_CANVAS_SIZES.map((size) => [
      size.id,
      { stripePaymentLink: "", stripePriceId: "" }
    ])
  );
}

window.DCA_PRODUCTS = [
${productBlocks.join(",\n")}
];
`;

  fs.writeFileSync(productsPath, body);
}

function removeProductPages() {
  const entries = fs.readdirSync(galleryDir);
  let removed = 0;
  for (const name of entries) {
    if (name === "index.html") continue;
    if (!name.endsWith(".html")) continue;
    fs.unlinkSync(path.join(galleryDir, name));
    removed += 1;
  }
  return removed;
}

const [feedRes, productIndexRes] = await Promise.all([
  fetch(FEED_URL, { headers: { Accept: "application/json" } }),
  fetch(PRODUCT_INDEX_URL, { headers: { Accept: "application/json" } })
]);
if (!feedRes.ok) {
  throw new Error(`Failed to fetch ${FEED_URL}: HTTP ${feedRes.status}`);
}
if (!productIndexRes.ok) {
  throw new Error(
    `Failed to fetch ${PRODUCT_INDEX_URL}: HTTP ${productIndexRes.status}`
  );
}

const [feed, productIndex] = await Promise.all([
  feedRes.json(),
  productIndexRes.json()
]);
if (!Array.isArray(feed) || !feed.length) {
  throw new Error(`Feed at ${FEED_URL} did not return a non-empty array.`);
}

const sizes = buildCanvasSizes(productIndex);
const usedSlugs = new Set();
const products = feed.map((item, index) => {
  const title = String(item?.title || "").trim();
  const description = String(item?.description || "").trim();
  const image = String(item?.path_to_image || "").trim();
  if (!title) {
    throw new Error(`Feed item ${index} is missing title.`);
  }
  if (!image) {
    throw new Error(`Feed item "${title}" is missing path_to_image.`);
  }

  const id = uniqueSlug(title, usedSlugs);
  return {
    id,
    title,
    slug: `${id}.html`,
    image,
    medium: "Stretched Canvas on a 38mm Standard Stretcher Bar",
    category: "Featured",
    location: "Sussex County",
    description:
      description ||
      "Premium Stretched Canvas on a 38mm Standard Stretcher Bar print from Delaware Canvas Art.",
    featured: true
  };
});

const generatedAt = new Date().toISOString();
// Second-level precision so rebuilding twice in one day still busts caches.
const cacheBust = generatedAt.replace(/[-:TZ.]/g, "").slice(0, 14);

const removed = removeProductPages();
writeProductsJs(sizes, products, generatedAt);

for (const product of products) {
  const filePath = path.join(galleryDir, product.slug);
  fs.writeFileSync(filePath, productPageHtml(product.id, cacheBust));
}

console.log(`Fetched ${feed.length} products from ${FEED_URL}`);
console.log(
  `Loaded ${sizes.length} size/orientation variants from ${PRODUCT_INDEX_URL}`
);
console.log(`Removed ${removed} old gallery product page(s).`);
console.log(`Wrote ${products.length} product page(s) and ${productsPath}`);
console.log("All products are featured on gallery/index.html.");

const { spawnSync } = await import("node:child_process");
const sitemapResult = spawnSync(
  process.execPath,
  [path.resolve(".github/scripts/generate-sitemap.mjs")],
  {
    stdio: "inherit",
    env: process.env
  }
);
if (sitemapResult.status !== 0) {
  throw new Error("Sitemap generation failed.");
}
