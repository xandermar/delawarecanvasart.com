/**
 * Site / Stripe config.
 *
 * The Stripe Secret key (sk_test_... / sk_live_...) lives in GitHub Secrets and is
 * deployed to the checkout Worker by .github/workflows/deploy-stripe-checkout.yml.
 * Never put sk_... in this file.
 *
 * CHECKOUT_ENDPOINT is injected at Pages deploy time from the GitHub secret
 * of the same name (see .github/workflows/deploy-github-pages.yml), or set below.
 */
window.DCA_CONFIG = {
  siteName: "Delaware Canvas Art",
  currency: "USD",
  defaultSizeId: "11x14",
  /**
   * Worker URL that creates Stripe Checkout Sessions (name, size, price).
   * Example: "https://delaware-canvas-checkout.YOUR_SUBDOMAIN.workers.dev"
   * Prefer setting GitHub secret CHECKOUT_ENDPOINT and using the Pages Action.
   */
  checkoutEndpoint: "",
  /** Optional browser key (pk_test_... / pk_live_...) — not required for Session URL redirect */
  publishableKey: ""
};
