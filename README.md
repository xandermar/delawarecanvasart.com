# Delaware Canvas Art

Static Bootstrap 5 website for [delawarecanvasart.com](https://delawarecanvasart.com) — Sussex County inspired canvas art with Stripe checkout, ready for GitHub Pages.

## Pages

| Page | Path |
|------|------|
| Home | `index.html` |
| About | `about.html` |
| Gallery (all products) | `gallery/index.html` |
| Product detail | `gallery/*.html` (6 prints) |
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

Purchase sends the selected print’s **name**, **size**, and **price** to Stripe Checkout. The **Secret key never goes in the website files** — it is stored as a GitHub Secret and deployed to a Cloudflare Worker by Actions.

### 1. Add GitHub Secrets

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (test) or `sk_live_...` (live) from [Stripe API keys](https://dashboard.stripe.com/apikeys) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare token with Workers edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account id |
| `CHECKOUT_ENDPOINT` | Worker URL after first deploy (e.g. `https://delaware-canvas-checkout.….workers.dev`) |
| `STRIPE_WEBHOOK_SECRET` | Optional `whsec_...` if you wire `/webhook` in Stripe |

### 2. Deploy the payment processor

Run workflow **Deploy Stripe checkout** (`.github/workflows/deploy-stripe-checkout.yml`). It injects `STRIPE_SECRET_KEY` into the Worker that creates Checkout Sessions (payment transfer).

### 3. Point the site at the Worker

- Set secret `CHECKOUT_ENDPOINT` to the Worker URL, then run **Deploy GitHub Pages**, **or**
- Paste the URL into `checkoutEndpoint` in `assets/js/config.js`

Switch Pages source to **GitHub Actions** if you use the Pages workflow (injects the endpoint at build time).

### 4. Manual payment smoke test

Actions → **Process Stripe payment** → enter name / size / price → Run. Uses `STRIPE_SECRET_KEY` from Secrets via `.github/scripts/create-checkout-session.mjs`.

### Fallback: Payment Links

If `checkoutEndpoint` is empty, you can still paste Stripe Payment Links into `stripe.SIZE.stripePaymentLink` in `assets/js/products.js`.

## Brand assets

- Logo: `assets/images/logo.png`
- Page / hero banner: `assets/images/banner.jpg`
- Gallery art: `assets/images/art/`

## Stack

- Bootstrap 5.3 (CDN)
- Custom coastal theme (`assets/css/styles.css`)
- Shared nav/footer + catalog (`assets/js/main.js`, `products.js`)
