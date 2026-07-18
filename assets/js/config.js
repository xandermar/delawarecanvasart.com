/**
 * Site config — update Stripe keys when ready for live payments.
 * Payment Links on each product size (products.js) are the simplest path for GitHub Pages.
 */
window.DCA_CONFIG = {
  siteName: "Delaware Canvas Art",
  publishableKey: "", // e.g. "pk_live_..." or "pk_test_..." — optional if using Payment Links only
  currency: "USD",
  defaultSizeId: "11x14"
};
