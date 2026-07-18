/**
 * Site / Stripe config.
 *
 * Dynamic checkout (name, size, price sent to Stripe) needs a server that holds
 * your Secret key. Put only the Publishable key in the browser if you use Stripe.js.
 *
 * Keys (from https://dashboard.stripe.com/apikeys):
 *   - Secret key:      sk_test_... (test) or sk_live_... (live)  → server ONLY
 *   - Publishable key: pk_test_... (test) or pk_live_... (live) → optional in browser
 *
 * Never put sk_... in this file or any frontend asset.
 */
window.DCA_CONFIG = {
  siteName: "Delaware Canvas Art",
  currency: "usd",
  /**
   * URL of the create-checkout-session endpoint (Cloudflare Worker, Netlify
   * Function, etc.). See api/create-checkout-session.js.
   * Example: "https://delaware-canvas-checkout.YOUR_SUBDOMAIN.workers.dev"
   */
  checkoutEndpoint: "",
  /** Optional — only needed if you redirect via Stripe.js instead of session.url */
  publishableKey: ""
};
