import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("social preview uses the approved local Cover export and canonical production URL", async () => {
  const html = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  const meta = (key) => {
    const matches = [...html.matchAll(new RegExp(`<meta\\s+(?:property|name)="${key}"\\s+content="([^"]+)"\\s*/?>`, "g"))];
    assert.equal(matches.length, 1, `${key} must be declared exactly once`);
    return matches[0][1];
  };
  const url = "https://trama.jahattrinidad.com/";
  const title = html.match(/<title>([^<]+)<\/title>/)[1];
  const description = meta("description");
  assert.match(html, /<link rel="canonical" href="https:\/\/trama\.jahattrinidad\.com\/"\s*\/?>/);
  assert.equal(meta("og:url"), url);
  assert.equal(meta("og:type"), "website");
  assert.equal(meta("og:title"), title);
  assert.equal(meta("twitter:title"), title);
  assert.equal(meta("og:description"), description);
  assert.equal(meta("twitter:description"), description);
  assert.equal(meta("twitter:card"), "summary_large_image");
  assert.equal(meta("og:image"), `${url}assets/trama/social-preview.png`);
  assert.equal(meta("twitter:image"), meta("og:image"));
  assert.equal(meta("og:image:width"), "1200");
  assert.equal(meta("og:image:height"), "630");
  assert.ok(meta("og:image:alt").length > 20);
  const image = await readFile(new URL("../../assets/trama/social-preview.png", import.meta.url));
  assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});
