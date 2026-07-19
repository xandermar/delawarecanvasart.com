# Delaware Canvas Art

Static Bootstrap 5 website for [delawarecanvasart.com](https://delawarecanvasart.com) — Sussex County inspired canvas art with Stripe checkout, ready for GitHub Pages.

## Pages

| Page | Path |
|------|------|
| Home | `index.html` |
| About | `about.html` |
| Gallery (all products) | `gallery/index.html` |
| Product detail | `gallery/*.html` (7 prints) |
| Order success | `success.html` |
| Checkout canceled | `cancel.html` |

## Local preview

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## GitHub Pages

1. Push this repository to GitHub.
2. **Settings → Pages → Build and deployment**
3. Source: **Deploy from a branch**
4. Branch: `main` (or your default), folder: **/ (root)**
5. Optional: add a custom domain (`delawarecanvasart.com`) under Pages → Custom domain. A `CNAME` file is included for that hostname.

## Canvas sizes

Every print is offered in four gallery-wrapped sizes (configured in `assets/js/products.js` as `DCA_CANVAS_SIZES`):

| Size | Price |
|------|-------|
| 8×10 | $159.99 |
| 11×14 | $199.99 |
| 12×12 | $199.99 |
| 16×20 | $359.99 |

Product pages let shoppers pick a size, read the size description, and buy that option through Stripe.

## Stripe via GitHub Secrets + Actions

No Cloudflare (or other host) is required. The Stripe **Secret key** stays in GitHub Secrets. An Action uses it to create Stripe Payment Links for each print × size (name, size, price), then commits them for GitHub Pages.

### 1. Add one GitHub Secret

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (test) or `sk_live_...` (live) from [Stripe API keys](https://dashboard.stripe.com/apikeys) |

Optional repository variable: `SITE_URL` (defaults to `https://delawarecanvasart.com` for success redirects).

### 2. Sync Payment Links

Run workflow **Sync Stripe payment links**. It:

1. Reads products/sizes from `assets/js/products.js`
2. Calls Stripe with `STRIPE_SECRET_KEY` to create Prices + Payment Links
3. Writes `assets/js/stripe-links.generated.js` and commits it

Purchase on the site then redirects to those Stripe-hosted links.

After payment, Stripe sends shoppers to `success.html?order={CHECKOUT_SESSION_ID}` (the Checkout Session id is the order reference shown on the thank-you page). Re-run Sync after deploy so existing Payment Links pick up that redirect.

When you switch the secret from `sk_test_…` to `sk_live_…` (or back), re-run the workflow — it drops links from the other mode and creates new ones. Use the **force_resync** input to recreate all links even if the mode is unchanged.

### 3. Manual payment smoke test

Actions → **Process Stripe payment** → enter name / size / price → Run. Creates a one-off Checkout Session with the same secret (`.github/scripts/create-checkout-session.mjs`).

## Brand assets

- Logo: `assets/images/logo.png`
- Page / hero banner: `assets/images/banner.jpg`
- Gallery art: `assets/images/art/`

## Stack

- Bootstrap 5.3 (CDN)
- Custom coastal theme (`assets/css/styles.css`)
- Shared nav/footer + catalog (`assets/js/main.js`, `products.js`)
