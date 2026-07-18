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
  defaultSizeId: "11x14",
  /** Optional — only if you later embed Stripe.js Buy Buttons */
  publishableKey: ""
};
