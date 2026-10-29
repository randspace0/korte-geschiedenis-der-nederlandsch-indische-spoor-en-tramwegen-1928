import test from "node:test";
import assert from "node:assert/strict";
import { markdown, pageTitle, siteLink } from "../.eleventy.js";

test("titles derive from the first h1 without footnote markers", () => {
  assert.equal(pageTitle("## Bagian A\n\n# Daftar pustaka[^1]\n\nTeks"), "Daftar pustaka");
});

test("only local Markdown links change, including README and fragments", () => {
  assert.equal(siteLink("../README.md#isi"), "../index.html#isi");
  assert.equal(siteLink("bab/01-bab-i.md?edisi=1928#catatan"), "bab/01-bab-i.html?edisi=1928#catatan");
  for (const href of ["https://example.org/book.md", "//example.org/book.md", "#book.md", "../assets/images/peta.jpg"]) {
    assert.equal(siteLink(href), href);
  }
  assert.match(markdown.render("[Bab](bab/01-bab-i.md)"), /href="bab\/01-bab-i.html"/);
});

test("images open the original without nesting existing links", () => {
  const image = markdown.render("![Peta Jawa](../assets/images/peta-jawa.jpg)");
  assert.match(image, /href="\.\.\/assets\/images\/peta-jawa.jpg"/);
  assert.match(image, /alt="Peta Jawa"/);
  const linked = markdown.render("[![Peta](peta.jpg)](sumber.html)");
  assert.equal((linked.match(/<a /g) ?? []).length, 1);
  assert.match(linked, /href="sumber.html"/);
});

test("tables have a labelled keyboard scroll region and footnotes remain local", () => {
  const table = markdown.render("| Lintas | km |\n| --- | --- |\n| Jawa | 24,7 |");
  assert.match(table, /role="region" tabindex="0" aria-label=/);
  assert.match(table, /<th scope="col">/);
  const notes = markdown.render("Teks[^1]\n\n[^1]: Catatan.");
  assert.match(notes, /href="#fn1"/);
  assert.match(notes, /id="fn1"/);
  assert.match(notes, /href="#fnref1"/);
});
