import { HtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  // Rewrites absolute URLs (/assets/...) when hosted under a sub-path, e.g. GitHub Pages /repo-name/
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addGlobalData("year", () => new Date().getFullYear());
  eleventyConfig.addGlobalData("build", () => Date.now().toString(36));

  return {
    dir: { input: "src", output: "_site", data: "_data" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    templateFormats: ["njk"],
  };
}
