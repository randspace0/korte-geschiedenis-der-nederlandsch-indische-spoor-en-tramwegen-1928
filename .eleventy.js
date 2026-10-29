import markdownIt from "markdown-it";
import footnote from "markdown-it-footnote";

export function pageTitle(source) {
  return source.match(/^#\s+(.+)$/m)?.[1].replace(/\[\^[^\]]+\]/g, "").trim() ?? "Reitsma 1928";
}

export function siteLink(href) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) return href;
  return href.replace(/(^|\/)README\.md(?=[?#]|$)/, "$1index.html")
    .replace(/\.md(?=[?#]|$)/, ".html");
}

export const markdown = markdownIt({ html: false, linkify: false }).use(footnote);
const renderLink = markdown.renderer.rules.link_open ?? ((tokens, index, options, env, renderer) => renderer.renderToken(tokens, index, options));
markdown.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
  const token = tokens[index];
  token.attrSet("href", siteLink(token.attrGet("href")));
  return renderLink(tokens, index, options, env, renderer);
};

const renderImage = markdown.renderer.rules.image;
markdown.renderer.rules.image = (tokens, index, options, env, renderer) => {
  const token = tokens[index];
  token.attrSet("loading", "lazy");
  token.attrSet("decoding", "async");
  const image = renderImage(tokens, index, options, env, renderer);
  let linkDepth = 0;
  for (let i = 0; i < index; i++) {
    if (tokens[i].type === "link_open") linkDepth++;
    if (tokens[i].type === "link_close") linkDepth--;
  }
  if (linkDepth) return image;
  return `<a class="original-image" href="${markdown.utils.escapeHtml(token.attrGet("src"))}" title="Buka gambar ukuran penuh">${image}</a>`;
};
markdown.renderer.rules.table_open = () => '<div class="table-scroll" role="region" tabindex="0" aria-label="Tabel, geser mendatar untuk membaca seluruh kolom"><table>\n';
markdown.renderer.rules.table_close = () => '</table></div>\n';
markdown.renderer.rules.th_open = (tokens, index, options, env, renderer) => {
  tokens[index].attrSet("scope", "col");
  return renderer.renderToken(tokens, index, options);
};

export default function (eleventyConfig) {
  eleventyConfig.setLibrary("md", markdown);
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.ignores.add("IMPLEMENTATION_PLAN.md");
  eleventyConfig.ignores.add("tests/**");
  eleventyConfig.addGlobalData("layout", "book.njk");
  eleventyConfig.addGlobalData("eleventyComputed", {
    title: (data) => pageTitle(data.page.rawInput),
    permalink: (data) => data.page.filePathStem === "/README" ? "/index.html" : `${data.page.filePathStem}.html`,
  });
  eleventyConfig.addCollection("book", (api) => api
    .getFilteredByGlob(["./bab/*.md", "./lampiran/*.md", "./daftar-isi.md"])
    .sort((a, b) => {
      const aLast = a.inputPath.endsWith("/daftar-isi.md");
      const bLast = b.inputPath.endsWith("/daftar-isi.md");
      return Number(aLast) - Number(bLast) || a.inputPath.localeCompare(b.inputPath);
    })
    .map((item) => ({ url: `${item.page.filePathStem}.html`, title: pageTitle(item.rawInput) })));
  eleventyConfig.addFilter("neighbors", (book, url) => {
    const index = book.findIndex((item) => item.url === url);
    return index < 0 ? { next: book[0] } : { previous: book[index - 1], next: book[index + 1] };
  });
  return {
    templateFormats: ["md"],
    markdownTemplateEngine: false,
    dir: { input: ".", output: "_site", includes: "_includes" },
  };
}
