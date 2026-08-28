import { parseHTML } from "linkedom";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const SITE = "https://sataoenmedia.no";
const SRC = path.resolve("site");
const OUT = path.resolve("dist");

const read = (p) => fs.readFileSync(path.join(SRC, p), "utf8");
const data = JSON.parse(read("content/site.json"));
const appjs = read("app.js");

// ---------- 1. kopier kilden til dist/, slik at site/ forblir malen ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC, OUT, { recursive: true });

// ---------- 2. kjoer app.js sin egen render() i et falskt DOM ----------
const { window, document } = parseHTML(read("index.html"));
const noop = () => {};
const ctx = {
  console, document, window, setTimeout, clearTimeout, performance,
  navigator: { language: "nb-NO", maxTouchPoints: 0 },
  location: { hostname: "sataoenmedia.no", search: "" },
  localStorage: { getItem: () => null, setItem: noop },
  requestAnimationFrame: noop,
  matchMedia: () => ({ matches: false, addEventListener: noop }),
  fetch: () => Promise.resolve({ json: () => Promise.resolve(data) }),
  __PRERENDER: true,
};
ctx.window = ctx; ctx.globalThis = ctx;
ctx.window.matchMedia = ctx.matchMedia;
ctx.window.addEventListener = noop;
ctx.document.addEventListener = noop;
vm.createContext(ctx);
vm.runInContext(appjs, ctx);
await new Promise((r) => setTimeout(r, 0));

const app = document.getElementById("app");
const markup = app ? app.innerHTML : "";
const tekst = markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
if (tekst.length < 800) {
  console.error(`prerender: bare ${tekst.length} tegn tekst — noe er galt, bygget stoppes`);
  process.exit(1);
}

// ---------- 3. metadata ----------
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const abs = (p) => SITE + (p.startsWith("/") ? p : "/" + p);
const kat = data.work.filter((w) => (w.images || []).length);
const forsteBilde = data.hero?.image || kat[0]?.images?.[0] || "";
const c = data.contact || {};

const ld = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Sataøen Media",
  alternateName: "Henrik Sataøen",
  url: SITE + "/",
  ...(forsteBilde ? { image: abs(forsteBilde) } : {}),
  description: data.statement_no,
  email: c.email,
  telephone: (c.phone || "").replace(/\s/g, ""),
  founder: { "@type": "Person", name: "Henrik Sataøen", jobTitle: "Fotograf" },
  address: { "@type": "PostalAddress", addressCountry: "NO" },
  areaServed: ["Geilo", "Lillehammer", "Oslo", "Norge"].map((n) => ({ "@type": "Place", name: n })),
  ...(c.instagram ? { sameAs: ["https://instagram.com/" + c.instagram.replace(/^@/, "")] } : {}),
  makesOffer: (data.services || []).map((s) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Service", name: s.name_no, description: s.desc_no },
  })),
};

const meta = [
  `<link rel="canonical" href="${SITE}/">`,
  `<meta property="og:url" content="${SITE}/">`,
  `<meta property="og:site_name" content="Sataøen Media">`,
  `<meta property="og:locale" content="nb_NO">`,
  `<meta property="og:locale:alternate" content="en_US">`,
  forsteBilde ? `<meta property="og:image" content="${esc(abs(forsteBilde))}">` : "",
  forsteBilde ? `<meta property="og:image:alt" content="Foto av Henrik Sataøen">` : "",
  `<meta name="twitter:card" content="summary_large_image">`,
  `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
].filter(Boolean).join("\n");

// ---------- 4. skriv resultatet ----------
let ut = read("index.html");
ut = ut.replace("</head>", meta + "\n</head>");
ut = ut.replace('<div id="app"></div>', `<div id="app">${markup}</div>`);
fs.writeFileSync(path.join(OUT, "index.html"), ut);

const dato = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT, "sitemap.xml"),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><lastmod>${dato}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>
</urlset>
`);
fs.writeFileSync(path.join(OUT, "robots.txt"),
`User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${SITE}/sitemap.xml
`);

console.log(`prerender  ${tekst.length} tegn tekst, ${markup.length} bytes markup`);
console.log(`           h1:${document.querySelectorAll("#app h1").length} h2/h3:${document.querySelectorAll("#app h2, #app h3").length} img:${document.querySelectorAll("#app img").length}`);
console.log(`meta       canonical, og:url, og:image, og:locale, twitter:card, JSON-LD`);
console.log(`filer      sitemap.xml, robots.txt`);
console.log(`dist/      ${fs.readdirSync(OUT).join(" ")}`);
