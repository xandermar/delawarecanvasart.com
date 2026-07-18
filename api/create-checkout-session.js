/**
 * Cloudflare Worker — Stripe Checkout + payment confirmation webhook.
 *
 * Deployed by .github/workflows/deploy-stripe-checkout.yml using GitHub Secrets:
 *   STRIPE_SECRET_KEY   (required)  sk_test_... or sk_live_...
 *   STRIPE_WEBHOOK_SECRET (optional) whsec_... for /webhook
 *
 * Never put the Secret key in frontend JS.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
  "Content-Type": "application/json"
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

async function createCheckoutSession(env, body) {
  const name = String(body.name || "").trim();
  const size = String(body.size || "").trim();
  const price = Number(body.price);
  const productId = String(body.productId || "").trim();
  const sizeId = String(body.sizeId || "").trim();
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

  const unitAmount = Math.round(price * 100);

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
  params.set("metadata[sizeId]", sizeId);
  params.set("metadata[size]", size);
  params.set("metadata[name]", name);
  params.set("metadata[price]", String(price));
  params.set("payment_intent_data[metadata][productId]", productId);
  params.set("payment_intent_data[metadata][size]", size);

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
      { error: session.error?.message || "Stripe Checkout Session failed." },
      stripeRes.status
    );
  }

  return json({ id: session.id, url: session.url });
}

/**
 * Minimal Stripe webhook signature check (v1 scheme).
 * Confirms payment transfer completed for checkout.session.completed.
 */
async function verifyStripeSignature(payload, header, secret) {
  if (!header || !secret) return false;

  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v];
    })
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${payload}`)
  );
  const expected = [...new Uint8Array(signed)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expected === signature;
}

async function handleWebhook(request, env) {
  const payload = await request.text();
  const sig = request.headers.get("Stripe-Signature") || "";

  if (env.STRIPE_WEBHOOK_SECRET) {
    const ok = await verifyStripeSignature(
      payload,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
    if (!ok) return json({ error: "Invalid Stripe signature." }, 400);
  }

  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: "Invalid webhook payload." }, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object || {};
    // Payment transfer succeeded — funds captured by Stripe for this account.
    console.log(
      JSON.stringify({
        type: "payment_transfer_completed",
        sessionId: session.id,
        amountTotal: session.amount_total,
        currency: session.currency,
        metadata: session.metadata || {}
      })
    );
  }

  return json({ received: true });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        stripeConfigured: Boolean(env.STRIPE_SECRET_KEY)
      });
    }

    if (!env.STRIPE_SECRET_KEY) {
      return json(
        { error: "STRIPE_SECRET_KEY is not configured (set via GitHub Secrets → Action deploy)." },
        500
      );
    }

    if (request.method === "POST" && url.pathname === "/webhook") {
      return handleWebhook(request, env);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    return createCheckoutSession(env, body);
  }
};
