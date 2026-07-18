/**
 * Injects CHECKOUT_ENDPOINT from GitHub Secrets into assets/js/config.js
 * at deploy time so the browser never needs the Stripe Secret key.
 */
import fs from "node:fs";
import path from "node:path";

const endpoint = (process.env.CHECKOUT_ENDPOINT || "").trim();
const configPath = path.resolve("assets/js/config.js");

if (!endpoint) {
  console.log("CHECKOUT_ENDPOINT secret not set — leaving config.js unchanged.");
  process.exit(0);
}

if (!/^https:\/\//i.test(endpoint)) {
  console.error("CHECKOUT_ENDPOINT must be an https:// URL.");
  process.exit(1);
}

let source = fs.readFileSync(configPath, "utf8");
const next = source.replace(
  /checkoutEndpoint:\s*["'][^"']*["']/,
  `checkoutEndpoint: ${JSON.stringify(endpoint)}`
);

if (next === source) {
  // Insert property if missing
  if (source.includes("window.DCA_CONFIG")) {
    source = source.replace(
      /window\.DCA_CONFIG\s*=\s*\{/,
      `window.DCA_CONFIG = {\n  checkoutEndpoint: ${JSON.stringify(endpoint)},`
    );
    fs.writeFileSync(configPath, source);
    console.log("Inserted checkoutEndpoint into config.js");
  } else {
    console.error("Could not find checkoutEndpoint or DCA_CONFIG in config.js");
    process.exit(1);
  }
} else {
  fs.writeFileSync(configPath, next);
  console.log("Updated checkoutEndpoint in config.js →", endpoint);
}
