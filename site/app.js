const UI = {
  no: { worldwide: "Tilgjengelig verden over", cue: "Rull ned", work: "Utvalgt arbeid", drag: "Dra eller sveip for å bla", curDrag: "Dra", curView: "Se", close: "Lukk", prev: "Forrige", next: "Neste", about: "Om meg", bc: "Flerkamera & tv", bcRole: "Kameraoperatør · prosjektkoordinator", services: "Tjenester", onRequest: "Pris på forespørsel", clients: "Utvalgte kunder", contact: "Kontakt", contactTitle: "La oss lage noe.", fName: "Navn", fEmail: "E-post", fBrief: "Kort om prosjektet", send: "Send forespørsel", sent: "Åpner e-postprogrammet ditt — send meldingen for å fullføre." },
  en: { worldwide: "Available worldwide", cue: "Scroll", work: "Selected work", drag: "Drag or swipe to browse", curDrag: "Drag", curView: "View", close: "Close", prev: "Previous", next: "Next", about: "About", bc: "Multicam & broadcast", bcRole: "Camera operator · project coordinator", services: "Services", onRequest: "Quote on request", clients: "Selected clients", contact: "Contact", contactTitle: "Let's make something.", fName: "Name", fEmail: "Email", fBrief: "About the project", send: "Send inquiry", sent: "Opening your mail app — send the message to finish." }
};
const ACCENT = "oklch(0.55 0.095 45)";
const ACCENT_LIGHT = "oklch(0.72 0.095 45)";
const SERIF = "Newsreader, Georgia, serif";
const saved = localStorage.getItem("sm-lang");
let DATA = null;
// Norsk er standard for alle. Kundene er norske, og den prerendrede
// HTML-en er norsk — leste vi nettleserspraaket, ville siden blinket fra
// norsk til engelsk hos alle med engelsk nettleser. Har man valgt EN selv,
// huskes det.
let lang = (saved === "en" || saved === "no") ? saved : "no";
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
    + '<img src="' + esc(media(im.src)) + '" alt="' + esc(nm + (im.caption ? " — " + im.caption : "")) + '" draggable="false" loading="lazy" decoding="async" style="display:block;height:100%;width:auto;max-width:none">'
    + '</button>'
  ).join("");
}

function workStrips() {
  return (DATA.work || []).map((c, ci) => {
    return '<section class="reveal" id="' + slug(c.name_no) + '" style="margin-bottom:clamp(44px,6vw,86px);scroll-margin-top:86px">'
      + '<h3 class="lines" style="margin:0 0 15px;font-family:' + SERIF + ';font-weight:300;font-size:clamp(23px,2.7vw,38px);line-height:1.1;letter-spacing:-0.01em">' + esc(L(c, "name")) + '</h3>'
      + '<div class="strip" tabindex="0" style="display:flex;gap:10px;height:clamp(215px,30vh,370px);overflow-x:auto;margin-right:-32px;padding-right:32px">' + frames(ci) + '</div>'
      + '</section>';
  }).join("");
}

function catNav() {
  return (DATA.work || []).map((c) =>
    '<a href="#' + slug(c.name_no) + '" style="color:rgba(22,19,15,0.45);border-bottom:1px solid transparent;padding-bottom:3px;transition:color 300ms ease,border-color 300ms ease">' + esc(L(c, "name")) + '</a>'
  ).join("");
}

let lbP = -1, lbI = 0, lbSrc = null, lbAnim = null, lbClosing = false, lbTok = 0;
const EASE = "cubic-bezier(.16,1,.3,1)";
// Det lille bildet i stripa og det store i lightboxen viser hele bildet, saa
// de har samme sideforhold. En forflytning og én skalering er nok til aa la
// det store bildet vokse ut av plassen det sto paa, og krympe tilbake dit.
const flip = (a, b) => "translate(" + (a.left - b.left) + "px," + (a.top - b.top) + "px) scale(" + (a.width / b.width) + "," + (a.height / b.height) + ")";
// Bildet under pekeren er forstoerret litt (hover), og rammen klipper bort
// kanten. Vi vil ha plassen bildet faktisk staar paa, uten forstoerrelsen.
const box = (img) => {
  const r = img.getBoundingClientRect(), w = img.offsetWidth, h = img.offsetHeight;
  return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
};
const lbChrome = () => ["lb-cap", "lb-prev", "lb-next", "lb-close"].map((id) => document.getElementById(id)).filter(Boolean);

// Paa vei tilbake maa bildet finne plassen sin igjen. Samme bilde kan ligge i
// flere kopier av stripa; vi velger den som faktisk synes mest paa skjermen.
function lbTarget() {
  let best = null, most = 0;
  document.querySelectorAll('.fr[data-p="' + lbP + '"][data-i="' + lbI + '"] img').forEach((img) => {
    const r = img.getBoundingClientRect();
    const w = Math.min(r.right, innerWidth) - Math.max(r.left, 0);
    const h = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    if (w > 0 && h > 0 && w * h > most) { best = img; most = w * h; }
  });
  return best;
}

function lbOpen(p, i, from) {
  lbP = p; lbI = i; lbClosing = false;
  const tok = ++lbTok;
  document.body.style.overflow = "hidden";
  curHide();
  const el = document.getElementById("lb"), im = document.getElementById("lb-img");
  const src = from && from.querySelector("img");
  const animate = !REDUCED && src && el && el.animate;
  if (animate) im.style.opacity = "0";
  lbDraw();
  if (!animate) return;
  el.animate([{ backgroundColor: "rgba(14,12,10,0)" }, { backgroundColor: "rgba(14,12,10,0.97)" }], { duration: 420, easing: "ease-out" });
  lbChrome().forEach((n) => n.animate([{ opacity: 0 }, { opacity: getComputedStyle(n).opacity }], { duration: 380, delay: 240, easing: "ease-out", fill: "backwards" }));
  // Det store bildet maa vaere dekodet foer vi vet hvor stort det blir. Det er
  // allerede lastet i stripa, saa det tar millisekunder — men uten aa vente
  // regner vi fra et bilde uten stoerrelse.
  (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => {
    if (tok !== lbTok || lbP < 0 || lbClosing) return;
    im.style.opacity = "";
    const a = box(src), b = im.getBoundingClientRect();
    if (!a.width || !b.width) return;
    lbSrc = src; src.style.visibility = "hidden";
    im.style.transformOrigin = "0 0";
    lbAnim = im.animate([{ transform: flip(a, b) }, { transform: "none" }], { duration: 560, easing: EASE });
    lbAnim.onfinish = () => { lbAnim = null; };
  });
}

function lbClose() {
  const el = document.getElementById("lb"), im = document.getElementById("lb-img");
  if (lbClosing) return;
  if (lbP < 0 || !el || el.style.display === "none" || REDUCED || !el.animate) return lbReset();
  // Lukker man midt i aapningen, staar bildet et sted mellom stripa og
  // fullskjerm. Derfra, ikke fra fullskjerm, skal det tilbake.
  const now = im.getBoundingClientRect();
  if (lbAnim) { lbAnim.cancel(); lbAnim = null; }
  const b = im.getBoundingClientRect(), to = lbTarget(), shown = im.style.opacity !== "0";
  lbClosing = true;
  const bg = el.animate([{ backgroundColor: "rgba(14,12,10,0.97)" }, { backgroundColor: "rgba(14,12,10,0)" }], { duration: 360, easing: "ease-out", fill: "forwards" });
  lbChrome().forEach((n) => n.animate([{ opacity: getComputedStyle(n).opacity }, { opacity: 0 }], { duration: 160, easing: "ease-out", fill: "forwards" }));
  if (!to || !b.width || !shown) {
    // Har man bladd til et bilde som ikke synes i stripa, finnes det ingen
    // plass aa krympe tilbake til. Da toner det bare ut.
    if (shown) im.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: "ease-out", fill: "forwards" });
    bg.onfinish = lbReset;
    return;
  }
  const a = box(to);
  if (lbSrc && lbSrc !== to) lbSrc.style.visibility = "";
  lbSrc = to; to.style.visibility = "hidden";
  im.style.transformOrigin = "0 0";
  im.animate([{ transform: flip(now, b) }, { transform: flip(a, b) }], { duration: 460, easing: EASE, fill: "forwards" }).onfinish = lbReset;
}

function lbReset() {
  const el = document.getElementById("lb"), im = document.getElementById("lb-img");
  lbP = -1; lbClosing = false; lbAnim = null;
  document.body.style.overflow = "";
  if (lbSrc) { lbSrc.style.visibility = ""; lbSrc = null; }
  if (el) {
    el.style.display = "none";
    if (el.getAnimations) el.getAnimations({ subtree: true }).forEach((x) => x.cancel());
  }
  if (im) { im.style.opacity = ""; im.style.transformOrigin = ""; }
}

function lbGo(d) {
  if (lbP < 0 || lbClosing) return;
  lbTok++;
  if (lbAnim) { lbAnim.finish(); lbAnim = null; }
  if (lbSrc) { lbSrc.style.visibility = ""; lbSrc = null; }
  document.getElementById("lb-img").style.opacity = "";
  const n = catImgs(DATA.work[lbP]).length; lbI = (lbI + d + n) % n; lbDraw();
}
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
    if (lbP < 0 || lbClosing) return;
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

  <section style="padding:clamp(90px,13vw,190px) 32px;max-width:1100px">
    <p class="lines" style="margin:0;font-family:${SERIF};font-weight:300;font-size:clamp(26px,3.6vw,52px);line-height:1.22;letter-spacing:-0.01em;text-wrap:pretty">${esc(L(DATA, "statement"))}</p>
  </section>

  <section id="work" style="padding:0 32px clamp(70px,10vw,140px)">
    <div class="reveal" style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid rgba(22,19,15,0.16);padding-bottom:14px;margin-bottom:clamp(24px,3.4vw,44px);font-family:${SERIF};font-size:15px">
      <span>${u.work}</span><span style="opacity:0.45;font-style:italic">2019 — 2026</span>
    </div>
    <div id="filters" class="reveal" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:12px 30px;margin-bottom:clamp(30px,4.5vw,58px);font-family:${SERIF};font-weight:300;font-size:clamp(16px,1.6vw,22px)">
      <div style="display:flex;flex-wrap:wrap;gap:8px 26px;align-items:baseline">${catNav()}</div>
      <span class="hint" style="font-style:italic;font-size:14.5px;color:rgba(22,19,15,0.38)">${u.drag}</span>
    </div>
    ${workStrips()}
    <a href="#about" class="more reveal" style="display:flex;flex-direction:column;align-items:center;gap:12px;width:max-content;margin:0 auto;font-family:${SERIF};font-style:italic;font-size:15px">
      <span>${u.about}</span>
      <svg width="14" height="48" viewBox="0 0 14 48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 1v45M1 40l6 6 6-6"/></svg>
    </a>
  </section>

  <section id="about" style="background:#12100e;color:#f4f1ea;padding:clamp(90px,13vw,180px) 32px">
    <div class="reveal" style="display:grid;grid-template-columns:repeat(12,1fr);gap:clamp(24px,4vw,60px);max-width:1400px">
      <div style="grid-column:span 4;font-family:${SERIF};font-size:15px;color:rgba(244,241,234,0.5)">${u.about}</div>
      <div style="grid-column:span 8;display:grid;gap:30px;max-width:760px">
        <p class="lines" style="margin:0;font-family:${SERIF};font-weight:300;font-size:clamp(22px,2.6vw,36px);line-height:1.3;text-wrap:pretty">${esc(L(DATA, "about"))}</p>
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
        <h2 class="lines" style="margin:0;font-family:${SERIF};font-weight:300;font-size:clamp(32px,5vw,74px);line-height:1;letter-spacing:-0.02em">${u.contactTitle}</h2>
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

  // Under prerendering finnes ingen layout aa maale, og ingenting aa
  // klikke paa. Bare markupen skal ut.
  if (!window.__PRERENDER) wire();
}

const SPEED = 32;
const TAU = 0.45;
const MAXV = 3500;
const EPS = 6;
const REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
// Bare enheter med ekte peker kan hovre. Paa telefon skal ingenting kunne
// pause en stripe — hver pausemekanisme er en maate den kan sette seg fast.
const CAN_HOVER = !!(window.matchMedia && window.matchMedia("(hover: hover)").matches);
let STRIPS = [], RAF = null, LAST = 0, PENDING = [];

// Rammene ligger i to identiske kopier. Naar stripa har gaatt nøyaktig én
// kopi videre, trekkes den tilbake dit den startet — og siden kopi to ser
// ut som kopi én, er hoppet usynlig.
const measure = (st) => {
  const s = st.el, kids = s.children;
  if (st.n < 2 || !kids.length) { st.shift = 0; st.on = false; return; }
  const gap = parseFloat(getComputedStyle(s).columnGap) || 0;
  const last = kids[st.n - 1];
  // Bredden paa én kopi, inkludert mellomrommet som skiller den fra neste.
  // Grovt anslag, bare for aa bestemme hvor mange kopier som trengs.
  const one = last.offsetLeft + last.offsetWidth - kids[0].offsetLeft + gap;
  if (one <= 0) { st.shift = 0; st.on = false; return; }
  // Nok kopier til at det alltid finnes innhold aa vise til hoeyre for
  // skjermkanten. Korte kategorier gjentas oftere, ikke sjeldnere.
  const want = Math.min(8, Math.max(2, Math.ceil(s.clientWidth / one) + 1));
  let have = Math.round(kids.length / st.n);
  while (have < want) { st.tpl.forEach((k) => s.appendChild(k.cloneNode(true))); have++; }
  while (have > want) { for (let k = 0; k < st.n; k++) s.removeChild(s.lastElementChild); have--; }
  // Naar kopiene er paa plass, maal avstanden eksakt i stedet for aa stole
  // paa utregningen: offsetWidth avrundes til heltall, og ett bomma piksel
  // gir et synlig rykk hver runde.
  st.shift = kids[st.n].getBoundingClientRect().left - kids[0].getBoundingClientRect().left;
  st.on = !REDUCED;
};

// Farten faller alltid eksponentielt mot grunnfarten. Slipper du stripa i
// bevegelse, settes farten til kastet ditt og glir tilbake til 32 px/s av
// seg selv. Den faller ogsaa mens stripa staar, saa et kast ikke ligger og
// venter naar du flytter pekeren vekk igjen.
//
// Pekeren over stripa pauser den bare naar den gaar i grunnfart. Er et kast
// fortsatt paa vei ut, ignoreres den — ellers bråstopper man noe man
// akkurat satte i gang, bare fordi man er paa vei mot et bilde. Et trykk
// stopper uansett, ogsaa midt i kastet.
function loop(t) {
  const dt = LAST ? Math.min(Math.max((t - LAST) / 1000, 0), 0.1) : 0;
  LAST = t;
  const vh = window.innerHeight;
  let alive = 0;
  // Les foerst, skriv etterpaa. Aa veksle mellom aa lese geometri og sette
  // scrollLeft i samme sloeyfe tvinger nettleseren til aa regne om layout
  // for hver stripe.
  for (const st of STRIPS) {
    st.go = false;
    if (!st.on || !st.shift) continue;
    alive++;
    st.vel = SPEED + (st.vel - SPEED) * Math.exp(-dt / TAU);
    const r = st.el.getBoundingClientRect();
    // Pekeren over pauser bare naar stripa gaar i grunnfart. Glir et kast
    // fortsatt ut, ignoreres den — ellers braastopper man noe man akkurat
    // satte i gang, bare fordi man er paa vei mot et bilde.
    // Mens et bilde er aapent staar alle stripene, saa bildet lander paa
    // noeyaktig samme sted naar det krymper tilbake.
    st.go = r.bottom > 0 && r.top < vh && !st.drag && lbP < 0
      && !(st.hover && Math.abs(st.vel - SPEED) < EPS);
    st.cur = st.el.scrollLeft;
  }
  for (const st of STRIPS) {
    if (!st.go) continue;
    // Posisjonen foeres som flyttall her, ikke leses tilbake fra elementet.
    // WebKit runder scrollLeft til hele piksler, og et tillegg paa en halv
    // piksel per ramme blir da aldri til noe: verdien skrives, rundes bort,
    // leses tilbake uendret, og stripa staar bom stille. Blink lagrer
    // desimaler, saa feilen fantes bare paa iPhone og iPad.
    // written er verdien nettleseren faktisk lagret sist. Avviker den fra
    // det vi leser naa, har brukeren flyttet stripa, og vi tar opp derfra.
    if (Math.abs(st.cur - st.written) > 1.5) {
      // Noen andre enn oss flyttet stripa: et drag, eller nettleserens egen
      // treghet etter et sveip. Les av farten deres og la den bli vaar, saa
      // bevegelsen glir ned mot grunnfarten i stedet for aa falle rett ned.
      // Denne ramma legger vi ikke noe til — brukerens bevegelse faar staa.
      if (dt > 0) {
        const d = ((st.cur - st.pos) % st.shift + st.shift * 1.5) % st.shift - st.shift / 2;
        st.vel = Math.max(-MAXV, Math.min(MAXV, d / dt));
      }
      st.pos = st.cur;
      st.written = st.el.scrollLeft;
      continue;
    }
    st.pos = (st.pos + st.vel * dt) % st.shift;
    if (st.pos < 0) st.pos += st.shift;
    st.el.scrollLeft = st.pos;
    st.written = st.el.scrollLeft;
  }
  if (alive) { RAF = requestAnimationFrame(loop); } else { RAF = null; LAST = 0; }
}
const startLoop = () => { if (RAF === null) { LAST = 0; RAF = requestAnimationFrame(loop); } };

if (!window.__smResize) {
  window.__smResize = 1;
  let rt = null;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    // Paa mobil fyrer resize hver gang adressefeltet skjuler seg under
    // scrolling. Uten pause ville measure() lagt til og fjernet kopier
    // kontinuerlig mens man blar.
    rt = setTimeout(() => { for (const st of STRIPS) measure(st); for (const el of PENDING) splitLines(el); startLoop(); }, 150);
  });
}

// Over stripene erstattes pekeren av en liten sirkel. Pilene forteller at
// stripa kan dras; ordet forteller hva et klikk gjoer, og bytter til «Dra»
// mens man holder inne. Bare med ekte peker, og ikke for de som har skrudd
// av bevegelse.
const CURSOR = CAN_HOVER && !REDUCED;
let CUR = null, curOn = false, curX = 0, curY = 0, curTX = 0, curTY = 0, curRAF = null;
function curEnsure() {
  if (!CURSOR || CUR) return;
  CUR = document.createElement("div");
  CUR.id = "cur";
  CUR.setAttribute("aria-hidden", "true");
  CUR.innerHTML = '<div class="cur-b"><span class="cur-a">‹</span><span class="cur-t"></span><span class="cur-a">›</span></div>';
  document.body.appendChild(CUR);
  document.documentElement.classList.add("cur-on");
}
function curLabel(t) { const n = CUR.querySelector(".cur-t"); if (n.textContent !== t) n.textContent = t; }
function curShow(e) {
  if (!CUR) return;
  curTX = e.clientX; curTY = e.clientY;
  if (!curOn) { curOn = true; curX = curTX; curY = curTY; CUR.classList.add("on"); curLabel(UI[lang].curView); }
  if (!curRAF) curRAF = requestAnimationFrame(curStep);
}
function curDown(on) { if (!CUR) return; CUR.classList.toggle("down", on); curLabel(on ? UI[lang].curDrag : UI[lang].curView); }
function curHide() { if (!CUR) return; curOn = false; CUR.classList.remove("on", "down"); }
function curStep() {
  curX += (curTX - curX) * 0.3; curY += (curTY - curY) * 0.3;
  const moving = Math.abs(curTX - curX) + Math.abs(curTY - curY) > 0.3;
  if (!moving) { curX = curTX; curY = curTY; }
  CUR.style.transform = "translate(" + curX + "px," + curY + "px)";
  curRAF = moving ? requestAnimationFrame(curStep) : null;
}

// Store tekster glir opp linje for linje bak en usynlig kant. Linjene finnes
// ikke i markupen — de avhenger av bredden og skrifttypen — saa vi maaler hvor
// ordene havner og pakker hver linje inn. Naar teksten har kommet fram, legges
// den tilbake som ren tekst, saa en senere breddeendring ikke kan klippe den.
function splitLines(el) {
  const text = el.dataset.text || (el.dataset.text = el.textContent.trim());
  el.textContent = "";
  const spans = text.split(/\s+/).map((w) => {
    const s = document.createElement("span");
    s.textContent = w;
    el.appendChild(s);
    el.appendChild(document.createTextNode(" "));
    return s;
  });
  const lines = [];
  let top = null;
  spans.forEach((s) => {
    if (top === null || Math.abs(s.offsetTop - top) > 2) { lines.push([]); top = s.offsetTop; }
    lines[lines.length - 1].push(s.textContent);
  });
  el.textContent = "";
  lines.forEach((ws, i) => {
    const mask = document.createElement("span"), inner = document.createElement("span");
    mask.className = "ln"; inner.className = "ln-i";
    inner.style.transitionDelay = (i * 90) + "ms";
    inner.textContent = ws.join(" ");
    mask.appendChild(inner);
    el.appendChild(mask);
  });
}

function wire() {
  document.querySelectorAll("[data-lang]").forEach((el) => el.addEventListener("click", () => {
    lang = el.dataset.lang; localStorage.setItem("sm-lang", lang); render();
  }));
  lbClose();
  curEnsure();
  STRIPS = [];
  document.querySelectorAll(".strip").forEach((s) => {
    const orig = [].slice.call(s.children);
    const st = { el: s, n: s.querySelectorAll(".fr").length, on: false, visible: false,
      hover: false, drag: false, shift: 0, vel: SPEED, pos: 0, written: 0,
      // Kopiene er usynlige for skjermlesere og tastatur, men klikkbare.
      tpl: orig.map((k) => {
        const c = k.cloneNode(true);
        if (c.classList) { c.classList.add("dup"); c.setAttribute("aria-hidden", "true"); c.setAttribute("tabindex", "-1"); c.removeAttribute("aria-label"); }
        return c;
      }) };
    STRIPS.push(st);
    measure(st);
    s.querySelectorAll("img").forEach((im) => {
      if (!im.complete) im.addEventListener("load", () => { measure(st); startLoop(); }, { once: true });
    });
    s.addEventListener("dragstart", (e) => e.preventDefault());
    if (CAN_HOVER) s.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") st.hover = true; });
    if (CUR && st.n) {
      s.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") curShow(e); });
      s.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") curShow(e); });
      s.addEventListener("pointerleave", curHide);
    }
    let down = false, sx = 0, sl = 0, moved = false, px = 0, pt = 0, flick = 0;
    s.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return;
      curDown(true);
      down = true; moved = false; st.drag = true; st.vel = SPEED;
      sx = e.clientX; sl = s.scrollLeft; s.style.cursor = "grabbing";
      px = e.clientX; pt = e.timeStamp || performance.now(); flick = 0;
    });
    s.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 3) moved = true;
      const now = e.timeStamp || performance.now();
      if (now > pt) flick = -(e.clientX - px) / (now - pt) * 1000;
      px = e.clientX; pt = now;
      let target = sl - dx;
      if (st.shift) { target %= st.shift; if (target < 0) target += st.shift; }
      s.scrollLeft = target;
    });
    const end = () => {
      if (down && moved) st.vel = Math.max(-MAXV, Math.min(MAXV, flick));
      // Synk telleren til der brukeren slapp, saa avlesningen over ikke regner
      // ut farten paa nytt og overskriver kastet vi nettopp maalte.
      if (down) { st.pos = s.scrollLeft; st.written = s.scrollLeft; }
      curDown(false);
      down = false; st.drag = false; s.style.cursor = ""; startLoop();
    };
    s.addEventListener("pointerup", end);
    s.addEventListener("pointercancel", end);
    s.addEventListener("pointerleave", () => { end(); st.hover = false; });
    // Delegert klikk: kopiene finnes ikke naar denne koden kjoerer.
    s.addEventListener("click", (e) => {
      if (moved) { moved = false; e.preventDefault(); e.stopPropagation(); return; }
      const f = e.target.closest ? e.target.closest(".fr") : null;
      if (f) lbOpen(+f.dataset.p, +f.dataset.i, f);
    });
  });
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
  PENDING = [];
  if (!REDUCED) {
    const lio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      lio.unobserve(el);
      PENDING = PENDING.filter((x) => x !== el);
      void el.offsetWidth;
      el.classList.add("in");
      const n = el.querySelectorAll(".ln-i").length;
      setTimeout(() => { if (el.isConnected) { el.textContent = el.dataset.text; el.classList.remove("in"); } }, 900 + Math.max(0, n - 1) * 90 + 80);
    }), { rootMargin: "0px 0px -12% 0px" });
    document.querySelectorAll(".lines").forEach((el) => {
      if (el.getBoundingClientRect().top <= window.innerHeight * 0.9) return;
      splitLines(el); PENDING.push(el); lio.observe(el);
    });
    // Skrifttypen kommer fra Google og kan lande etter oss. Da brytes linjene
    // annerledes, saa vi maaler paa nytt naar den er paa plass.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => PENDING.forEach(splitLines));
  }
}
fetch("content/site.json?v=" + Date.now()).then((r) => r.json()).then((d) => { DATA = d; render(); }).catch((e) => {
  document.getElementById("app").innerHTML = '<p style="padding:60px 32px;font-family:' + SERIF + '">Kunne ikke laste innhold.</p>';
  console.error(e);
});
