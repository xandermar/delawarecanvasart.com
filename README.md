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

## Stripe setup (Payment Links)

This site is fully static, so checkout uses [Stripe Payment Links](https://docs.stripe.com/payment-links) (no backend / secret key required in the browser).

1. In the [Stripe Dashboard](https://dashboard.stripe.com/), create a **Product** for each print.
2. Add a **Price** for each canvas size (8×10, 11×14, 12×12, 16×20).
3. Create a **Payment Link** for each Price.
4. Set each Payment Link’s success and cancel URLs to:
   - `https://YOUR_DOMAIN/success.html`
   - `https://YOUR_DOMAIN/cancel.html`
5. Open `assets/js/products.js` and paste each link into the matching product’s `stripe` map, e.g. `stripe["11x14"].stripePaymentLink`.
6. Optionally store the Stripe Price ID in `stripePriceId` for the same size (useful if you later add Buy Buttons).

Until Payment Links are set for a size, the Purchase button opens an in-page setup guide.

Optional: put your publishable key in `assets/js/config.js` if you later switch to Stripe Buy Buttons.

## Brand assets

- Logo: `assets/images/logo.png`
- Page / hero banner: `assets/images/banner.jpg`
- Gallery art: `assets/images/art/`

## Stack

- Bootstrap 5.3 (CDN)
- Custom coastal theme (`assets/css/styles.css`)
- Shared nav/footer + catalog (`assets/js/main.js`, `products.js`)
