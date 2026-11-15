import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const artifacts = await fs.mkdtemp(path.join(os.tmpdir(), "trama-loom-"));
console.log(`Browser artifacts: ${artifacts}`);
try {
  for (const width of [1440, 768, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 928 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(response.url());
    });
    await page.goto(`${process.env.TRAMA_BASE_URL || "http://127.0.0.1:8000"}/?seed=2025&course=6`);
    await page.waitForSelector(".course.selected");
    await page.evaluate(() => document.fonts.ready);
    const visual = await page.evaluate(() => {
      const style = (selector) => getComputedStyle(document.querySelector(selector));
      const tile = style(".course:not(.selected):not(.requires):not(.unlocks):not(.indirect)");
      return {
        canvas: style(":root").backgroundColor,
        selected: style(".course.selected").backgroundColor,
        heading: style("h1").fontFamily,
        fontLoaded: document.fonts.check('600 34px "Schibsted Grotesk"'),
        tileBorder: tile.borderTopColor,
        tileAlignment: tile.justifyContent,
        statsDirection: style(".stats > span").flexDirection,
        statsSize: style(".stats strong").fontSize,
        seedFont: style("#seed-label").fontFamily,
        seed: document.querySelector("#seed-label").textContent,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    assert.equal(visual.canvas, "rgb(15, 24, 19)");
    assert.equal(visual.selected, "rgb(233, 226, 201)");
    assert.match(visual.heading, /Schibsted Grotesk/);
    assert.equal(visual.fontLoaded, true);
    assert.equal(visual.tileBorder, "rgba(0, 0, 0, 0)");
    assert.ok(["flex-start", "flow-start"].includes(visual.tileAlignment));
    assert.equal(visual.statsDirection, "row");
    assert.equal(visual.statsSize, "13px");
    assert.doesNotMatch(visual.seedFont, /Mono/);
    assert.match(visual.seed, /Semilla 2025/);
    assert.equal(visual.overflow, false);
    assert.equal(await page.locator(".course.selected .course-meta > span:last-child").first().textContent(), "");
    const brokenAssets = await page.locator("img").evaluateAll((images) =>
      images.filter((img) => !img.complete || !img.naturalWidth || !img.naturalHeight ||
        (img.getClientRects().length && (img.width !== Number(img.getAttribute("width")) || img.height !== Number(img.getAttribute("height")))))
        .map((img) => img.getAttribute("src")),
    );
    assert.deepEqual(brokenAssets, []);
    await page.screenshot({ path: `${artifacts}/${width}-grid.png`, fullPage: true });
    await page.locator(`[data-view="analysis"]:visible`).click();
    assert.equal(await page.locator(".rule-progress").count(), 0);
    assert.equal(await page.locator(".analysis-layout aside .stats").count(), 0);
    assert.equal(await page.locator(".rule").count() > 0, true);
    assert.equal(await page.locator(".demo-note").evaluate((e) => getComputedStyle(e).backgroundColor), "rgb(29, 42, 34)");
    await page.screenshot({ path: `${artifacts}/${width}-analysis.png`, fullPage: true });
    await page.locator(`[data-view="graph"]:visible`).click();
    await page.waitForSelector("#graph canvas");
    const colors = await page.locator("#graph").evaluate((element) => {
      const cy = element._cyreg.cy;
      return {
        selected: cy.nodes(".selected").first().style("background-color"),
        requires: cy.nodes(".requires").first().style("border-color"),
      };
    });
    assert.equal(colors.selected, "rgb(233,226,201)");
    if (colors.requires) assert.equal(colors.requires, "rgb(233,226,201)");
    await page.screenshot({ path: `${artifacts}/${width}-graph.png`, fullPage: true });
    await page.locator('[data-action="about"]').last().click();
    await page.screenshot({ path: `${artifacts}/${width}-about.png`, fullPage: true });
    assert.equal(await page.locator("dialog .about-brand").evaluate((e) => getComputedStyle(e).fontFamily.includes("Schibsted Grotesk")), true);
    await page.keyboard.press("Escape");
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log("Loom visual contract passed at 1440, 768 and 390px.");
} finally {
  await browser.close();
}
