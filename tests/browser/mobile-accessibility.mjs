import assert from "node:assert/strict";

// Supply a local Playwright installation without adding a runtime dependency.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const base = process.env.TRAMA_BASE_URL || "http://127.0.0.1:8000";
async function assertTargets(selector) {
  const sizes = await page.locator(selector).evaluateAll((elements) =>
    elements
      .filter((element) => element.getClientRects().length)
      .map((element) => ({
        label: element.textContent || element.id || element.dataset.action,
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
      })),
  );
  assert.ok(sizes.length, `Expected visible controls for ${selector}`);
  for (const size of sizes) {
    assert.ok(
      size.width >= 44 && size.height >= 44,
      `${size.label}: target is ${size.width} x ${size.height}, expected at least 44 x 44`,
    );
  }
}
try {
  await page.goto(`${base}/?seed=2025`);
  const course = page.locator(".current-cycle .course").first();
  const courseId = await course.getAttribute("data-course");
  await course.click();
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    (id) => document.activeElement?.dataset.course === id,
    courseId,
    { timeout: 1500 },
  );
  await page.locator('.bottom-nav [data-view="graph"]').click();
  await assertTargets(
    ".segmented button, .graph-toolbar > button, .graph-toolbar summary",
  );
  await page.locator('.bottom-nav [data-view="analysis"]').click();
  await page.locator('[data-tab="prerequisites"]').click();
  await assertTargets(".relation-chip");
  await page.locator('[data-tab="topology"]').click();
  await assertTargets(".relation-chip");
  await page.locator('[data-action="seed"]').click();
  await assertTargets("#seed-input, #seed-form button");
  await page.keyboard.press("Escape");
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.action),
    "seed",
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  console.log("mobile focus restoration and 44 x 44 targets passed");
} finally {
  await browser.close();
}
