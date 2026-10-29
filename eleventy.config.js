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
  eleventyConfig.addFilter("uniq", (arr) => [...new Set(arr)]);
  eleventyConfig.addFilter("pluck", (arr, key) => (arr || []).flatMap((x) => x[key] || []));
  eleventyConfig.addFilter("isActive", (pageUrl, navUrl) => navUrl.startsWith("/") && navUrl !== "/" && pageUrl.startsWith(navUrl));

  return {
    dir: { input: "src", output: "_site", data: "_data", includes: "_includes" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    templateFormats: ["njk"],
  };
}
