import { HtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  // Rewrites absolute URLs (/assets/...) when hosted under a sub-path, e.g. GitHub Pages /repo-name/
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addGlobalData("year", () => new Date().getFullYear());
  eleventyConfig.addGlobalData("build", () => Date.now().toString(36));

  const norm = (s) => String(s || "").toLowerCase().replace(/[®™]/g, "").replace(/\s+/g, " ").trim();

  // Find a treatment page by its name or any alias (used to turn tags into links)
  eleventyConfig.addFilter("findTreatment", (label, list) =>
    (list || []).find((t) => [t.name, t.short, ...(t.aliases || [])].some((a) => norm(a) === norm(label)))
  );
  // All branches as one flat list, each with its region
  eleventyConfig.addFilter("flatBranches", (branches) =>
    branches.regions.flatMap((r) => r.branches.map((b) => ({ ...b, region: r.region })))
  );
  eleventyConfig.addFilter("branchBySlug", (slug, branches) =>
    branches.regions.flatMap((r) => r.branches.map((b) => ({ ...b, region: r.region }))).find((b) => b.slug === slug)
  );
  eleventyConfig.addFilter("doctorsAt", (slug, doctors) => doctors.list.filter((d) => (d.branches || []).includes(slug)));
  // Up to 3 other branches in the same region (falls back to any others)
  eleventyConfig.addFilter("nearby", (b, list) => {
    const others = list.filter((x) => x.slug !== b.slug);
    const same = others.filter((x) => x.region === b.region);
    return (same.length ? same : others).slice(0, 3);
  });
  eleventyConfig.addFilter("byGroup", (list, group) => list.filter((t) => t.group === group));
  eleventyConfig.addFilter("except", (list, key, val) => list.filter((x) => x[key] !== val));
  eleventyConfig.addFilter("tel", (s) => "tel:" + String(s || "").replace(/[^+\d]/g, ""));
  eleventyConfig.addFilter("wa", (s) => "https://wa.me/" + String(s || "").replace(/\D/g, ""));
  eleventyConfig.addFilter("niceDate", (iso) =>
    new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
  );
  // ── Content helpers (live-site text is rendered verbatim) ──
  const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  eleventyConfig.addFilter("nl2br", (t) => esc(t).replace(/\n/g, "<br>"));
  const BTN = { "VIEW OUR TREATMENTS": "/treatments/" };
  eleventyConfig.addFilter("isButtonText", (t) => Object.prototype.hasOwnProperty.call(BTN, String(t).trim().toUpperCase()));
  eleventyConfig.addFilter("buttonHref", (t) => BTN[String(t).trim().toUpperCase()]);
  eleventyConfig.addFilter("buttonLabel", (t) => String(t).trim());
  eleventyConfig.addFilter("isNote", (t) => /^(\*|⚠|📌|Note:|Disclaimer)/.test(String(t).trim()));
  eleventyConfig.addFilter("firstImage", (list) => ((list || []).find((x) => x.t === "img") || {}).v || "");
  eleventyConfig.addFilter("whereKind", (list, kind) => (list || []).find((x) => x.kind === kind));
  eleventyConfig.addFilter("lines", (t) => String(t ?? "").split("\n").filter((x) => x.trim()));
  eleventyConfig.addFilter("hasImages", (list) => (list || []).some((x) => x.t === "img"));
  // Turn live-site links into links inside this site
  const MAP = { "/smile/": "/zeiss-smile/", "/about-us-2/": "/about-us/", "/doctor": "/doctor/" };
  eleventyConfig.addFilter("fixHref", (h) => {
    h = String(h || "").trim();
    if (h === "#book-appointment" || h.endsWith("/#book-appointment")) return "#book";
    const m = h.match(/^https?:\/\/(www\.)?optimaxeyespecialist\.com(\/[^#?]*)?/);
    if (m) { const p = m[2] || "/"; return MAP[p] || p; }
    return h;
  });
  eleventyConfig.addFilter("faqSchema", (groups) => JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: groups.flatMap((g) => g.questions.map((q) => ({ "@type": "Question", name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a.map((a) => Array.isArray(a.v) ? a.v.join(" ") : a.t === "img" ? "" : a.v).join(" ").trim() } }))) }).replace(/</g, "\\u003c"));
  eleventyConfig.addFilter("langCount", (list, lang) => list.filter((d) => (d.languages || []).includes(lang)).length);
  // Blog bodies: links to pages that exist on this site become local links
  const LOCAL = /^(\/(zeiss-smile-pro|zeiss-smile|zeiss-presbyond|clear-max-lasik|femto-lasik|tesa|advanced-surface-ablation|icl|rigid-gas-permeable-lenses-rgp|flacs|treatments|faqs|financing-options|blog|doctor|privacy-policy|terms-of-use)\/.*|\/branches\/.+|\/)$/;
  eleventyConfig.addFilter("fixLinks", (html) => String(html || "").replace(/href="https?:\/\/(?:www\.)?optimaxeyespecialist\.com(\/[^"#?]*)?([^"]*)"/g, (m, p = "/", rest) => {
    if (rest && rest.startsWith("#book-appointment")) return 'href="/#book"';
    if (p === "/about-us-2/") return 'href="/about-us/"';
    if (p === "/smile/") return 'href="/zeiss-smile/"';
    return LOCAL.test(p) ? `href="${p}${rest}"` : m;
  }));
  eleventyConfig.addFilter("uniq", (arr) => [...new Set(arr)]);
  eleventyConfig.addFilter("pluck", (arr, key) => (arr || []).flatMap((x) => x[key] || []));
  eleventyConfig.addFilter("isActive", (pageUrl, navUrl) => navUrl.startsWith("/") && navUrl !== "/" && pageUrl.startsWith(navUrl));

  return {
    dir: { input: "src", output: "_site", data: "_data", includes: "_includes" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    templateFormats: ["njk"],
  };
}
