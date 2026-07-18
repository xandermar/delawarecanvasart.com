# Delaware Canvas Art

Static Bootstrap 5 website for [delawarecanvasart.com](https://delawarecanvasart.com) — Sussex County inspired canvas art with Stripe checkout, ready for GitHub Pages.

## Pages

| Page | Path |
|------|------|
| Home | `index.html` |
| About | `about.html` |
| Gallery | `gallery/index.html` |
| Product (sample) | `gallery/*.html` (6 prints) |
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

## Stripe checkout (name, size, price)

Clicking **Purchase** sends that print’s **name**, **size**, and **price** to Stripe Checkout.

### Which API key?

| Key | Looks like | Where it goes |
|-----|------------|---------------|
| **Secret key** (required) | `sk_test_...` or `sk_live_...` | Server only (`STRIPE_SECRET_KEY` on the Worker) |
| **Publishable key** (optional here) | `pk_test_...` or `pk_live_...` | Browser — not needed if you redirect with the Session `url` |

GitHub Pages cannot hold the Secret key safely. A tiny Cloudflare Worker creates the Checkout Session.

1. Get keys from [Stripe → Developers → API keys](https://dashboard.stripe.com/apikeys). Use **test** keys (`sk_test_` / `pk_test_`) until you go live.
2. Deploy `api/create-checkout-session.js`:

```bash
cd api
npx wrangler secret put STRIPE_SECRET_KEY   # paste sk_test_... or sk_live_...
npx wrangler deploy
```

3. Put the Worker URL in `assets/js/config.js`:

```js
checkoutEndpoint: "https://delaware-canvas-checkout.YOUR_SUBDOMAIN.workers.dev"
```

4. Open a product page and click **Purchase** — Stripe receives name, size, and price as line-item + metadata.

Optional fallback: set `stripePaymentLink` on a product in `assets/js/products.js` if the endpoint is empty (static Payment Link only; no dynamic payload).

## Brand assets

- Logo: `assets/images/logo.png`
- Page / hero banner: `assets/images/banner.jpg`
- Gallery art: `assets/images/art/`

## Stack

- Bootstrap 5.3 (CDN)
- Custom coastal theme (`assets/css/styles.css`)
- Shared nav/footer + catalog (`assets/js/main.js`, `products.js`)
