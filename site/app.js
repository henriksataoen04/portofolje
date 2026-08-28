const UI = {
  no: { worldwide: "Tilgjengelig verden over", cue: "Rull ned", work: "Utvalgt arbeid", drag: "Dra eller sveip for å bla", close: "Lukk", prev: "Forrige", next: "Neste", about: "Om meg", bc: "Flerkamera & tv", bcRole: "Kameraoperatør · prosjektkoordinator", services: "Tjenester", onRequest: "Pris på forespørsel", clients: "Utvalgte kunder", contact: "Kontakt", contactTitle: "La oss lage noe.", fName: "Navn", fEmail: "E-post", fBrief: "Kort om prosjektet", send: "Send forespørsel", sent: "Åpner e-postprogrammet ditt — send meldingen for å fullføre." },
  en: { worldwide: "Available worldwide", cue: "Scroll", work: "Selected work", drag: "Drag or swipe to browse", close: "Close", prev: "Previous", next: "Next", about: "About", bc: "Multicam & broadcast", bcRole: "Camera operator · project coordinator", services: "Services", onRequest: "Quote on request", clients: "Selected clients", contact: "Contact", contactTitle: "Let's make something.", fName: "Name", fEmail: "Email", fBrief: "About the project", send: "Send inquiry", sent: "Opening your mail app — send the message to finish." }
};
const ACCENT = "oklch(0.55 0.095 45)";
const ACCENT_LIGHT = "oklch(0.72 0.095 45)";
const SERIF = "Newsreader, Georgia, serif";
const saved = localStorage.getItem("sm-lang");
let DATA = null;
let lang = (saved === "en" || saved === "no") ? saved : ((navigator.language || "").startsWith("en") ? "en" : "no");
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const L = (o, k) => o[k + "_" + lang] || o[k + "_no"] || o[k] || "";
const seg = (s) => { try { return encodeURIComponent(decodeURIComponent(s)); } catch (e) { return encodeURIComponent(s); } };
// Filnavn fra kamera og Lightroom inneholder mellomrom og &. De maa
// prosentkodes per segment, ellers blir src ugyldig. decodeURIComponent
// foerst gjoer det trygt aa kjoere paa en sti som allerede er kodet.
const media = (p) => {
  if (!p) return "";
  if (/^https?:/.test(p)) return p;
  return (/^\//.test(p) ? p : "/" + p.replace(/^\.?\//, "")).split("/").map(seg).join("/");
};

function heroMedia() {
  const h = DATA.hero || {};
  if (h.video) return '<video src="' + esc(media(h.video)) + '" autoplay muted loop playsinline preload="auto" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>';
  if (h.image) return '<div style="position:absolute;inset:0;background-image:url(' + esc(media(h.image)) + ');background-size:cover;background-position:center"></div>';
  return '<div style="position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,#1c1916 0 6px,#171412 6px 12px)"></div>';
}

const slug = (s) => {
  const b = String(s || "").toLowerCase().replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return "cat-" + (b || "x");
};
const catImgs = (c) => (Array.isArray(c && c.images) ? c.images : [])
  .map((x) => (typeof x === "string" ? { src: x } : x))
  .filter((x) => x && x.src);

function frames(ci) {
  const c = DATA.work[ci], imgs = catImgs(c);
  if (!imgs.length) return '<div style="flex:none;height:100%;aspect-ratio:3 / 2;background-image:repeating-linear-gradient(135deg,#e6e1d6 0 7px,#dcd6c9 7px 14px)"></div>';
  const nm = L(c, "name");
  return imgs.map((im, j) =>
    '<button class="fr" data-p="' + ci + '" data-i="' + j + '" aria-label="' + esc(nm + " " + (j + 1) + " / " + imgs.length + (im.caption ? " — " + im.caption : "")) + '" style="flex:none;height:100%;min-width:110px;margin:0;padding:0;border:0;background:#e6e1d6;overflow:hidden;cursor:zoom-in">'
    + '<img src="' + esc(media(im.src)) + '" alt="" loading="lazy" decoding="async" style="display:block;height:100%;width:auto;max-width:none">'
    + '</button>'
  ).join("");
}

function workStrips() {
  return (DATA.work || []).map((c, ci) => {
    return '<section class="reveal" id="' + slug(c.name_no) + '" style="margin-bottom:clamp(44px,6vw,86px);scroll-margin-top:86px">'
      + '<h3 style="margin:0 0 15px;font-family:' + SERIF + ';font-weight:300;font-size:clamp(23px,2.7vw,38px);line-height:1.1;letter-spacing:-0.01em">' + esc(L(c, "name")) + '</h3>'
      + '<div class="strip" tabindex="0" style="display:flex;gap:10px;height:clamp(215px,30vh,370px);overflow-x:auto;margin-right:-32px;padding-right:32px">' + frames(ci) + '</div>'
      + '<div class="bar" style="overflow:hidden;height:1px;margin-top:19px;background:rgba(22,19,15,0.13)"><i style="display:block;height:1px;width:0;background:' + ACCENT + '"></i></div>'
      + '</section>';
  }).join("");
}

function catNav() {
  return (DATA.work || []).map((c) =>
    '<a href="#' + slug(c.name_no) + '" style="color:rgba(22,19,15,0.45);border-bottom:1px solid transparent;padding-bottom:3px;transition:color 300ms ease,border-color 300ms ease">' + esc(L(c, "name"))
    + '<span style="font-size:0.62em;vertical-align:super;margin-left:5px;opacity:0.55">' + catImgs(c).length + '</span></a>'
  ).join("");
}

let lbP = -1, lbI = 0;
function lbOpen(p, i) { lbP = p; lbI = i; document.body.style.overflow = "hidden"; lbDraw(); }
function lbClose() { lbP = -1; document.body.style.overflow = ""; const e = document.getElementById("lb"); if (e) e.style.display = "none"; }
function lbGo(d) { if (lbP < 0) return; const n = catImgs(DATA.work[lbP]).length; lbI = (lbI + d + n) % n; lbDraw(); }
function lbDraw() {
  const el = document.getElementById("lb"); if (!el || lbP < 0) return;
  const c = DATA.work[lbP], imgs = catImgs(c); if (!imgs.length) return;
  el.style.display = "flex";
  const cur = imgs[lbI], im = document.getElementById("lb-img");
  im.src = media(cur.src);
  im.alt = L(c, "name") + (cur.caption ? " — " + cur.caption : "");
  document.getElementById("lb-cap").innerHTML =
    '<span style="color:rgba(244,241,234,0.9)">' + esc(L(c, "name"))
    + (cur.caption ? '<span style="font-style:italic;color:rgba(244,241,234,0.5)"> — ' + esc(cur.caption) + '</span>' : '')
    + '</span><span style="font-style:italic">' + (lbI + 1) + " / " + imgs.length + '</span>';
  const vis = imgs.length > 1 ? "block" : "none";
  document.getElementById("lb-prev").style.display = vis;
  document.getElementById("lb-next").style.display = vis;
  imgs.forEach((s, j) => { if (Math.abs(j - lbI) === 1) new Image().src = media(s.src); });
}
if (!window.__smKeys) {
  window.__smKeys = 1;
  document.addEventListener("keydown", (e) => {
    if (lbP < 0) return;
    if (e.key === "Escape") lbClose();
    else if (e.key === "ArrowRight") lbGo(1);
    else if (e.key === "ArrowLeft") lbGo(-1);
  });
}

function render() {
  const u = UI[lang], c = DATA.contact || {};
  const mailHref = "mailto:" + (c.email || "");
  document.documentElement.lang = lang;
  document.getElementById("app").innerHTML = `
  <div style="position:fixed;top:0;left:0;right:0;z-index:50;display:flex;justify-content:space-between;align-items:center;padding:22px 32px;mix-blend-mode:difference;pointer-events:none">
    <a href="#top" style="pointer-events:auto;font-family:${SERIF};font-size:15px;color:#f4f1ea">Sataøen Media</a>
    <div style="pointer-events:auto;display:flex;gap:10px;font-family:${SERIF};font-size:15px;color:#f4f1ea">
      <span data-lang="no" style="cursor:pointer;opacity:${lang === "no" ? 1 : 0.55}">NO</span><span style="opacity:0.35">/</span><span data-lang="en" style="cursor:pointer;opacity:${lang === "en" ? 1 : 0.55}">EN</span>
    </div>
  </div>

  <section id="top" style="position:relative;height:100vh;min-height:640px;background:#12100e;overflow:hidden;display:flex;align-items:flex-end">
    ${heroMedia()}
    <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(18,16,14,0.86) 0%,rgba(18,16,14,0.35) 45%,rgba(18,16,14,0.15) 100%)"></div>
    <div style="position:relative;width:100%;padding:0 32px 56px;display:grid;gap:26px">
      <div style="font-family:${SERIF};font-size:15px;color:rgba(244,241,234,0.6)">${esc(L(DATA.hero || {}, "kicker"))}</div>
      <h1 style="margin:0;font-family:${SERIF};font-weight:300;font-size:clamp(46px,10.5vw,164px);line-height:0.9;letter-spacing:-0.02em;color:#f4f1ea">Henrik<br>Sataøen</h1>
      <div style="display:flex;flex-wrap:wrap;gap:14px 40px;align-items:baseline;border-top:1px solid rgba(244,241,234,0.18);padding-top:22px;font-family:${SERIF};font-weight:300;font-size:clamp(15px,1.5vw,21px);color:rgba(244,241,234,0.78)">
        <span>Geilo · Lillehammer · Oslo</span>
        <span style="font-style:italic;color:rgba(244,241,234,0.55)">${u.worldwide}</span>
        <span style="font-style:italic;color:${ACCENT_LIGHT}">${u.cue}</span>
      </div>
    </div>
  </section>

  <section class="reveal" style="padding:clamp(90px,13vw,190px) 32px;max-width:1100px">
    <p style="margin:0;font-family:${SERIF};font-weight:300;font-size:clamp(26px,3.6vw,52px);line-height:1.22;letter-spacing:-0.01em;text-wrap:pretty">${esc(L(DATA, "statement"))}</p>
  </section>

  <section id="work" style="padding:0 32px clamp(70px,10vw,140px)">
    <div class="reveal" style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid rgba(22,19,15,0.16);padding-bottom:14px;margin-bottom:clamp(24px,3.4vw,44px);font-family:${SERIF};font-size:15px">
      <span>${u.work}</span><span style="opacity:0.45;font-style:italic">2019 — 2026</span>
    </div>
    <div id="filters" class="reveal" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:12px 30px;margin-bottom:clamp(30px,4.5vw,58px);font-family:${SERIF};font-weight:300;font-size:clamp(16px,1.6vw,22px)">
      <div style="display:flex;flex-wrap:wrap;gap:8px 26px;align-items:baseline">${catNav()}</div>
      <span style="font-style:italic;font-size:14.5px;color:rgba(22,19,15,0.38)">${u.drag}</span>
    </div>
    ${workStrips()}
  </section>

  <section id="about" style="background:#12100e;color:#f4f1ea;padding:clamp(90px,13vw,180px) 32px">
    <div class="reveal" style="display:grid;grid-template-columns:repeat(12,1fr);gap:clamp(24px,4vw,60px);max-width:1400px">
      <div style="grid-column:span 4;font-family:${SERIF};font-size:15px;color:rgba(244,241,234,0.5)">${u.about}</div>
      <div style="grid-column:span 8;display:grid;gap:30px;max-width:760px">
        <p style="margin:0;font-family:${SERIF};font-weight:300;font-size:clamp(22px,2.6vw,36px);line-height:1.3;text-wrap:pretty">${esc(L(DATA, "about"))}</p>
        <p style="margin:0;font-size:16.5px;line-height:1.7;color:rgba(244,241,234,0.72);text-wrap:pretty">${esc(L(DATA, "about2"))}</p>
        <p style="margin:0;font-size:16.5px;line-height:1.7;color:rgba(244,241,234,0.72);text-wrap:pretty">${esc(L(DATA, "about3"))}</p>
        <div style="display:grid;padding-top:10px;max-width:520px">
          ${(DATA.facts || []).map((f) => '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:20px;padding:13px 0;border-bottom:1px solid rgba(244,241,234,0.12)"><span style="font-family:' + SERIF + ';font-weight:300;font-size:18px;color:rgba(244,241,234,0.85)">' + esc(L(f, "label")) + '</span><span style="font-family:' + SERIF + ';font-weight:300;font-style:italic;font-size:15px;color:rgba(244,241,234,0.45);text-align:right">' + esc(L(f, "value")) + '</span></div>').join("")}
        </div>
      </div>
    </div>
  </section>

  <section id="broadcast" style="padding:clamp(60px,9vw,120px) 32px clamp(70px,10vw,130px)">
    <div class="reveal" style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;align-items:baseline;border-bottom:1px solid rgba(22,19,15,0.16);padding-bottom:14px;margin-bottom:clamp(26px,4vw,50px);font-family:${SERIF};font-size:15px">
      <span>${u.bc}</span><span style="font-style:italic;opacity:0.45">${u.bcRole}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:clamp(24px,4vw,64px)">
      <p class="reveal" style="grid-column:span 5;margin:0;font-family:${SERIF};font-weight:300;font-size:clamp(21px,2.3vw,32px);line-height:1.3;text-wrap:pretty">${esc(L(DATA, "broadcast_intro"))}</p>
      <div class="reveal" style="grid-column:span 7;display:grid">
        ${(DATA.credits || []).map((cr) => '<div style="display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:16px 0;border-bottom:1px solid rgba(22,19,15,0.1)"><span style="font-family:' + SERIF + ';font-weight:300;font-size:clamp(19px,2vw,26px);line-height:1.2">' + esc(cr.production) + '</span><span style="font-size:14.5px;color:rgba(22,19,15,0.6)">' + esc(L(cr, "role")) + '</span><span style="font-family:' + SERIF + ';font-style:italic;font-size:15px;color:rgba(22,19,15,0.42);white-space:nowrap">' + esc(cr.year) + '</span></div>').join("")}
      </div>
    </div>
  </section>

  <section id="services" style="padding:0 32px clamp(60px,9vw,120px)">
    <div class="reveal" style="border-bottom:1px solid rgba(22,19,15,0.16);padding-bottom:14px;margin-bottom:10px;font-family:${SERIF};font-size:15px">${u.services}</div>
    ${(DATA.services || []).map((s) => '<div class="reveal" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr) auto;gap:20px;align-items:baseline;padding:clamp(18px,2.4vw,30px) 0;border-bottom:1px solid rgba(22,19,15,0.1)"><div style="font-family:' + SERIF + ';font-weight:300;font-size:clamp(24px,3vw,40px);line-height:1.1;letter-spacing:-0.01em">' + esc(L(s, "name")) + '</div><div style="font-size:14.5px;line-height:1.6;color:rgba(22,19,15,0.6);text-wrap:pretty">' + esc(L(s, "desc")) + '</div><div style="font-family:' + SERIF + ';font-style:italic;font-size:15px;color:' + ACCENT + ';white-space:nowrap">' + u.onRequest + '</div></div>').join("")}
  </section>

  <section style="padding:clamp(20px,4vw,50px) 0 clamp(80px,11vw,150px);overflow:hidden">
    <div style="padding:0 32px 26px;font-family:${SERIF};font-size:15px;opacity:0.45">${u.clients}</div>
    <div style="display:flex;width:max-content;animation:drift 38s linear infinite">
      ${(DATA.clients || []).concat(DATA.clients || []).map((cl) => '<span style="padding:0 clamp(22px,3.4vw,52px);font-family:' + SERIF + ';font-weight:300;font-size:clamp(26px,3.4vw,46px);white-space:nowrap;opacity:0.5">' + esc(cl) + '</span>').join("")}
    </div>
  </section>

  <section style="padding:0 32px clamp(90px,13vw,170px)">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(24px,4vw,56px)">
      ${(DATA.quotes || []).map((q) => '<blockquote class="reveal" style="margin:0;display:grid;gap:18px;align-content:start;border-top:1px solid rgba(22,19,15,0.16);padding-top:20px"><p style="margin:0;font-family:' + SERIF + ';font-weight:300;font-style:italic;font-size:clamp(19px,1.9vw,25px);line-height:1.4;text-wrap:pretty">' + esc(L(q, "text")) + '</p><footer style="font-family:' + SERIF + ';font-size:14.5px;opacity:0.5">' + esc(q.by) + '</footer></blockquote>').join("")}
    </div>
  </section>

  <section id="contact" style="background:#12100e;color:#f4f1ea;padding:clamp(90px,13vw,180px) 32px clamp(50px,7vw,80px)">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:clamp(34px,6vw,90px);max-width:1400px">
      <div class="reveal" style="display:grid;gap:26px;align-content:start">
        <div style="font-family:${SERIF};font-size:15px;color:rgba(244,241,234,0.5)">${u.contact}</div>
        <h2 style="margin:0;font-family:${SERIF};font-weight:300;font-size:clamp(32px,5vw,74px);line-height:1;letter-spacing:-0.02em">${u.contactTitle}</h2>
        <div style="display:grid;gap:8px;font-family:${SERIF};font-size:15px">
          <a href="${esc(mailHref)}" style="color:${ACCENT_LIGHT}">${esc(c.email || "")}</a>
          <a href="tel:${esc((c.phone || "").replace(/[^+\d]/g, ""))}" style="color:rgba(244,241,234,0.62)">${esc(c.phone || "")}</a>
          <a href="https://instagram.com/${esc((c.instagram || "").replace("@", ""))}" target="_blank" rel="noopener" style="color:rgba(244,241,234,0.62)">${esc(c.instagram || "")}</a>
        </div>
      </div>
      <form id="inq" class="reveal" style="display:grid;gap:22px;align-content:start">
        <label style="display:grid;gap:8px;font-family:${SERIF};font-size:14px;color:rgba(244,241,234,0.5)">${u.fName}<input name="name" required autocomplete="name"></label>
        <label style="display:grid;gap:8px;font-family:${SERIF};font-size:14px;color:rgba(244,241,234,0.5)">${u.fEmail}<input name="email" type="email" required autocomplete="email"></label>
        <label style="display:grid;gap:8px;font-family:${SERIF};font-size:14px;color:rgba(244,241,234,0.5)">${u.fBrief}<textarea name="brief" rows="3"></textarea></label>
        <button type="submit">${u.send}</button>
        <div id="sent" style="min-height:16px;font-family:${SERIF};font-style:italic;font-size:14.5px;color:${ACCENT_LIGHT}"></div>
      </form>
    </div>
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:14px;margin-top:clamp(50px,8vw,110px);border-top:1px solid rgba(244,241,234,0.14);padding-top:22px;font-family:${SERIF};font-size:14px;color:rgba(244,241,234,0.4)">
      <span>Sataøen Media © 2026</span><span>${u.worldwide}</span>
    </div>
  </section>

  <div id="lb" style="position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;padding:clamp(14px,3.5vw,58px);background:rgba(14,12,10,0.97)">
    <img id="lb-img" alt="" style="display:block;max-width:100%;max-height:100%;object-fit:contain">
    <button id="lb-prev" aria-label="${u.prev}" style="position:absolute;left:0;top:0;bottom:0;width:clamp(56px,13vw,170px);border:0;background:transparent;color:#f4f1ea;font-family:${SERIF};font-size:40px;opacity:0.4;cursor:pointer;transition:opacity 300ms ease">&lsaquo;</button>
    <button id="lb-next" aria-label="${u.next}" style="position:absolute;right:0;top:0;bottom:0;width:clamp(56px,13vw,170px);border:0;background:transparent;color:#f4f1ea;font-family:${SERIF};font-size:40px;opacity:0.4;cursor:pointer;transition:opacity 300ms ease">&rsaquo;</button>
    <button id="lb-close" aria-label="${u.close}" style="position:absolute;top:14px;right:20px;border:0;background:transparent;color:#f4f1ea;font-family:${SERIF};font-size:30px;line-height:1;opacity:0.5;cursor:pointer;transition:opacity 300ms ease">&times;</button>
    <div id="lb-cap" style="position:absolute;left:0;right:0;bottom:0;display:flex;flex-wrap:wrap;justify-content:space-between;gap:5px 24px;padding:18px clamp(20px,4vw,34px);font-family:${SERIF};font-size:14.5px;color:rgba(244,241,234,0.6);pointer-events:none"></div>
  </div>`;

  wire();
}

const SPEED = 32;
const REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
let STRIPS = [], RAF = null, LAST = 0;

const measure = (st) => {
  st.max = st.el.scrollWidth - st.el.clientWidth;
  st.frac = st.el.clientWidth / st.el.scrollWidth;
};
const paint = (st) => {
  if (st.max < 4) { st.bar.style.opacity = 0; return; }
  st.bar.style.opacity = 1;
  st.fill.style.width = (st.frac * 100) + "%";
  st.fill.style.transform = "translateX(" + ((1 - st.frac) / st.frac) * (st.el.scrollLeft / st.max) * 100 + "%)";
};

// Hver stripe glir av seg selv naar den kommer til syne, ikke i takt med
// skrollen. Musepekeren over setter den paa pause, saa bildet ikke sklir
// unna mens du sikter. Tar du tak i den, stopper den for godt.
function loop(t) {
  const dt = LAST ? Math.min((t - LAST) / 1000, 0.1) : 0;
  LAST = t;
  let alive = 0;
  for (const st of STRIPS) {
    if (!st.auto || st.max < 4 || st.pos >= st.max) continue;
    alive++;
    if (!st.visible || st.hover) continue;
    st.pos = Math.min(st.max, st.pos + SPEED * dt);
    st.set = st.pos;
    st.el.scrollLeft = st.pos;
  }
  if (alive) { RAF = requestAnimationFrame(loop); } else { RAF = null; LAST = 0; }
}
const startLoop = () => { if (RAF === null) { LAST = 0; RAF = requestAnimationFrame(loop); } };

if (!window.__smResize) {
  window.__smResize = 1;
  window.addEventListener("resize", () => {
    for (const st of STRIPS) { measure(st); paint(st); }
    startLoop();
  });
}

function wire() {
  document.querySelectorAll("[data-lang]").forEach((el) => el.addEventListener("click", () => {
    lang = el.dataset.lang; localStorage.setItem("sm-lang", lang); render();
  }));
  lbClose();
  STRIPS = [];
  const seen = new IntersectionObserver((es) => es.forEach((e) => {
    const st = STRIPS.find((x) => x.el === e.target);
    if (!st) return;
    st.visible = e.isIntersecting;
    if (e.isIntersecting) startLoop();
  }), { rootMargin: "0px 0px -12% 0px" });
  document.querySelectorAll(".strip").forEach((s) => {
    const bar = s.parentElement.querySelector(".bar");
    const st = { el: s, bar: bar, fill: bar.querySelector("i"), auto: !REDUCED,
      visible: false, hover: false, pos: s.scrollLeft || 0, set: s.scrollLeft || 0, max: 0, frac: 1 };
    STRIPS.push(st);
    measure(st); paint(st);
    s.addEventListener("scroll", () => {
      if (st.auto && Math.abs(s.scrollLeft - st.set) > 2) st.auto = false;
      paint(st);
    }, { passive: true });
    s.querySelectorAll("img").forEach((im) => {
      if (!im.complete) im.addEventListener("load", () => { measure(st); paint(st); startLoop(); }, { once: true });
    });
    s.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") st.hover = true; });
    seen.observe(s);
    let down = false, sx = 0, sl = 0, moved = false;
    s.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return;
      down = true; moved = false; sx = e.clientX; sl = s.scrollLeft; s.style.cursor = "grabbing";
    });
    s.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; st.auto = false; }
      s.scrollLeft = sl - dx;
    });
    const end = () => { down = false; s.style.cursor = ""; };
    s.addEventListener("pointerup", end);
    s.addEventListener("pointercancel", end);
    s.addEventListener("pointerleave", () => { end(); st.hover = false; startLoop(); });
    s.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  });
  document.querySelectorAll(".fr").forEach((f) => f.addEventListener("click", () => lbOpen(+f.dataset.p, +f.dataset.i)));
  const lb = document.getElementById("lb");
  if (lb) {
    lb.addEventListener("click", (e) => { if (e.target === lb) lbClose(); });
    document.getElementById("lb-close").addEventListener("click", lbClose);
    document.getElementById("lb-prev").addEventListener("click", () => lbGo(-1));
    document.getElementById("lb-next").addEventListener("click", () => lbGo(1));
  }
  const form = document.getElementById("inq");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form), c = DATA.contact || {};
    const subject = (lang === "no" ? "Forespørsel fra " : "Inquiry from ") + (fd.get("name") || "");
    const body = [(lang === "no" ? "Navn: " : "Name: ") + fd.get("name"), (lang === "no" ? "E-post: " : "Email: ") + fd.get("email"), "", fd.get("brief") || ""].join("\n");
    window.location.href = "mailto:" + (c.email || "") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    document.getElementById("sent").textContent = UI[lang].sent;
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.style.transition = "opacity 900ms cubic-bezier(.16,1,.3,1), transform 1100ms cubic-bezier(.16,1,.3,1)"; e.target.style.opacity = 1; e.target.style.transform = "none"; io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -12% 0px" });
  document.querySelectorAll(".reveal").forEach((n) => {
    if (n.getBoundingClientRect().top > window.innerHeight * 0.9) { n.style.opacity = 0; n.style.transform = "translateY(34px)"; io.observe(n); }
  });
}

fetch("content/site.json?v=" + Date.now()).then((r) => r.json()).then((d) => { DATA = d; render(); }).catch((e) => {
  document.getElementById("app").innerHTML = '<p style="padding:60px 32px;font-family:' + SERIF + '">Kunne ikke laste innhold.</p>';
  console.error(e);
});
