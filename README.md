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

## Stripe setup (Payment Links)

This site is fully static, so checkout uses [Stripe Payment Links](https://docs.stripe.com/payment-links) (no backend required).

1. In the [Stripe Dashboard](https://dashboard.stripe.com/), create a **Product** and **Price** for each print.
2. Create a **Payment Link** for that price.
3. Set the Payment Link’s success and cancel URLs to:
   - `https://YOUR_DOMAIN/success.html`
   - `https://YOUR_DOMAIN/cancel.html`
4. Open `assets/js/products.js` and paste each link into the matching product’s `stripePaymentLink` field.

Until Payment Links are set, the Purchase button opens an in-page setup guide.

Optional: put your publishable key in `assets/js/config.js` if you later switch to Stripe Buy Buttons.

## Brand assets

- Logo: `assets/images/logo.png`
- Page / hero banner: `assets/images/banner.jpg`
- Gallery art: `assets/images/art/`

## Stack

- Bootstrap 5.3 (CDN)
- Custom coastal theme (`assets/css/styles.css`)
- Shared nav/footer + catalog (`assets/js/main.js`, `products.js`)
