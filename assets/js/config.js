/**
 * Site config.
 *
 * Stripe Secret key (sk_test_... / sk_live_...) belongs in GitHub Secrets only.
 * Run workflow "Sync Stripe payment links" to generate Payment Links into
 * assets/js/stripe-links.generated.js — no Cloudflare or other host needed.
 */
window.DCA_CONFIG = {
  siteName: "Delaware Canvas Art",
  currency: "USD",
  defaultSizeId: "11x14-landscape",
  /**
   * Real-time checkout endpoint (same host as the Stripe → Prodigi webhook).
   * When set, the Purchase button creates a Stripe Checkout Session priced
   * live from product-index.json instead of using a static Payment Link.
   */
  checkoutEndpoint: "",
  /** Live price source — displayed prices refresh from here on product pages. */
  productIndexUrl: "https://canvas.xdm.io/backend/product-index.json",
  /** Optional — only if you later embed Stripe.js Buy Buttons */
  publishableKey: ""
};
