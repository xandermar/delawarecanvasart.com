/**
 * Cloudflare Worker — create a Stripe Checkout Session with dynamic
 * product name, size, and price from the site.
 *
 * Deploy:
 *   1. npm i -g wrangler  (or use the Cloudflare dashboard "Quick edit")
 *   2. Set secret:  wrangler secret put STRIPE_SECRET_KEY
 *      Use sk_test_... while testing, sk_live_... in production.
 *   3. wrangler deploy  (see wrangler.toml)
 *   4. Paste the Worker URL into assets/js/config.js → checkoutEndpoint
 *
 * Never expose STRIPE_SECRET_KEY to the browser.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    if (!env.STRIPE_SECRET_KEY) {
      return json(
        { error: "STRIPE_SECRET_KEY is not configured on the server." },
        500
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const name = String(body.name || "").trim();
    const size = String(body.size || "").trim();
    const price = Number(body.price);
    const productId = String(body.productId || "").trim();
    const successUrl = String(body.successUrl || "").trim();
    const cancelUrl = String(body.cancelUrl || "").trim();

    if (!name || !size || !Number.isFinite(price) || price <= 0) {
      return json(
        { error: "name, size, and a positive price are required." },
        400
      );
    }

    if (!successUrl || !cancelUrl) {
      return json({ error: "successUrl and cancelUrl are required." }, 400);
    }

    const unitAmount = Math.round(price * 100); // Stripe expects cents

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", successUrl);
    params.set("cancel_url", cancelUrl);
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(unitAmount));
    params.set("line_items[0][price_data][product_data][name]", name);
    params.set(
      "line_items[0][price_data][product_data][description]",
      `Canvas print · Size: ${size}`
    );
    params.set("metadata[productId]", productId);
    params.set("metadata[size]", size);
    params.set("metadata[name]", name);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      return json(
        {
          error: session.error?.message || "Stripe Checkout Session failed."
        },
        stripeRes.status
      );
    }

    return json({ id: session.id, url: session.url });
  }
};
