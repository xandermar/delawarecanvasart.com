/**
 * Generates sitemap.xml for delawarecanvasart.com from the site's HTML pages.
 *
 * Usage:
 *   node .github/scripts/generate-sitemap.mjs
 *
 * Env:
 *   SITE_URL   default https://www.delawarecanvasart.com
 */
import fs from "node:fs";
import path from "node:path";

const SITE_URL = (process.env.SITE_URL || "https://www.delawarecanvasart.com").replace(
  /\/$/,
  ""
);
const rootDir = path.resolve(".");
const outPath = path.resolve("sitemap.xml");

/** Pages that should not appear in the public sitemap. */
const EXCLUDE = new Set([
  "cancel.html",
  "success.html"
]);

/** Optional per-path priorities / change frequencies. */
const META = {
  "/": { changefreq: "weekly", priority: "1.0" },
  "/gallery/": { changefreq: "weekly", priority: "0.9" },
  "/about.html": { changefreq: "monthly", priority: "0.7" },
  "/support.html": { changefreq: "monthly", priority: "0.6" },
  "/terms.html": { changefreq: "yearly", priority: "0.3" },
  "/privacy.html": { changefreq: "yearly", priority: "0.3" }
};

function toIsoDate(filePath) {
  const mtime = fs.statSync(filePath).mtime;
  return mtime.toISOString().slice(0, 10);
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function collectPages() {
  const pages = [];

  const rootIndex = path.join(rootDir, "index.html");
  if (fs.existsSync(rootIndex)) {
    pages.push({
      loc: `${SITE_URL}/`,
      lastmod: toIsoDate(rootIndex),
      ...(META["/"] || {})
    });
  }

  for (const name of fs.readdirSync(rootDir)) {
    if (!name.endsWith(".html") || name === "index.html" || EXCLUDE.has(name)) {
      continue;
    }
    const filePath = path.join(rootDir, name);
    const locPath = `/${name}`;
    pages.push({
      loc: `${SITE_URL}${locPath}`,
      lastmod: toIsoDate(filePath),
      ...(META[locPath] || { changefreq: "monthly", priority: "0.5" })
    });
  }

  const galleryDir = path.join(rootDir, "gallery");
  if (fs.existsSync(galleryDir)) {
    const galleryIndex = path.join(galleryDir, "index.html");
    if (fs.existsSync(galleryIndex)) {
      pages.push({
        loc: `${SITE_URL}/gallery/`,
        lastmod: toIsoDate(galleryIndex),
        ...(META["/gallery/"] || {})
      });
    }

    for (const name of fs.readdirSync(galleryDir).sort()) {
      if (!name.endsWith(".html") || name === "index.html") continue;
      const filePath = path.join(galleryDir, name);
      pages.push({
        loc: `${SITE_URL}/gallery/${name}`,
        lastmod: toIsoDate(filePath),
        changefreq: "weekly",
        priority: "0.8"
      });
    }
  }

  return pages;
}

function buildSitemap(pages) {
  const urls = pages
    .map((page) => {
      const parts = [
        "  <url>",
        `    <loc>${xmlEscape(page.loc)}</loc>`,
        `    <lastmod>${xmlEscape(page.lastmod)}</lastmod>`
      ];
      if (page.changefreq) {
        parts.push(`    <changefreq>${xmlEscape(page.changefreq)}</changefreq>`);
      }
      if (page.priority) {
        parts.push(`    <priority>${xmlEscape(page.priority)}</priority>`);
      }
      parts.push("  </url>");
      return parts.join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

const pages = collectPages();
const xml = buildSitemap(pages);
fs.writeFileSync(outPath, xml);
console.log(`Wrote ${pages.length} URL(s) to ${outPath}`);
console.log(`Site URL: ${SITE_URL}`);
