/**
 * Creates a Stripe Checkout Session using STRIPE_SECRET_KEY from the environment.
 * Used by the GitHub Action workflow for payment processing / smoke tests.
 *
 * Env:
 *   STRIPE_SECRET_KEY (required)
 *   PRODUCT_NAME, PRODUCT_SIZE, PRODUCT_PRICE, PRODUCT_ID, SIZE_ID
 *   SUCCESS_URL, CANCEL_URL
 */
const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is missing. Add it under GitHub → Settings → Secrets.");
  process.exit(1);
}

const name = process.env.PRODUCT_NAME || "Delaware Canvas Art Print";
const size = process.env.PRODUCT_SIZE || '11" × 14"';
const price = Number(process.env.PRODUCT_PRICE || "199.99");
const productId = process.env.PRODUCT_ID || "manual";
const sizeId = process.env.SIZE_ID || "11x14";
const successUrl =
  process.env.SUCCESS_URL || "https://delawarecanvasart.com/success.html";
const cancelUrl =
  process.env.CANCEL_URL || "https://delawarecanvasart.com/cancel.html";

if (!Number.isFinite(price) || price <= 0) {
  console.error("PRODUCT_PRICE must be a positive number.");
  process.exit(1);
}

const unitAmount = Math.round(price * 100);
const params = new URLSearchParams();
params.set("mode", "payment");
params.set("success_url", successUrl);
params.set("cancel_url", cancelUrl);
params.set("line_items[0][quantity]", "1");
params.set("line_items[0][price_data][currency]", "usd");
params.set("line_items[0][price_data][unit_amount]", String(unitAmount));
params.set("line_items[0][price_data][product_data][name]", name);
params.set(
  "line_items[0][price_data][product_data][description]",
  `Canvas print · Size: ${size}`
);
params.set("metadata[productId]", productId);
params.set("metadata[sizeId]", sizeId);
params.set("metadata[size]", size);
params.set("metadata[name]", name);
params.set("metadata[price]", String(price));

const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: params
});

const session = await res.json();
if (!res.ok) {
  console.error("Stripe error:", session.error?.message || JSON.stringify(session));
  process.exit(1);
}

console.log("Checkout session created.");
console.log(`id:  ${session.id}`);
console.log(`url: ${session.url}`);
console.log(
  `payment: ${name} · ${size} · $${price.toFixed(2)} → Stripe payment transfer ready`
);
