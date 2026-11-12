import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createCurriculum, relationsFor } from "../../js/domain/curriculum.mjs";
import { exportForView } from "../../js/ui/presentation.mjs";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const root = await fs.mkdtemp(path.join(os.tmpdir(), "trama-browser-"));
const base = process.env.TRAMA_BASE_URL || "http://127.0.0.1:8000";
console.log(`Browser artifacts: ${root}`);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const errors = [];
const failed = [];
try {
  for (const width of [1440, 768, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 922 },
      acceptDownloads: true,
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) failed.push(r.url());
    });
    await page.goto(`${base}/?seed=2025&curso=C16`);
    await page.waitForSelector(".course.selected");
    assert.match(page.url(), /course=16/);
    await page.screenshot({ path: `${root}/${width}-grid.png` });
    const select = await page
      .locator(".course.selected")
      .first()
      .getAttribute("data-course");
    assert.equal(select, "16");
    const rel = relationsFor(createCurriculum("2025"), 16);
    if (width > 700)
      for (const [k, ids] of Object.entries(rel).filter(([k]) =>
        ["requires", "unlocks", "indirect"].includes(k),
      ))
        for (const id of ids)
          assert.ok(
            await page
              .locator(`.curriculum-grid .course.${k}[data-course="${id}"]`)
              .count(),
          );
    if (width === 390) await page.locator('[data-action="search"]').click();
    await page.locator("#search").fill("not-a-course");
    assert.equal(await page.locator(".course.selected").count(), 0);
    assert.ok(!new URL(page.url()).searchParams.has("course"));
    await page.locator("#search").fill("");
    const about = page.locator('[data-action="about"]').last();
    await about.click();
    assert.equal(
      await page
        .locator("dialog")
        .evaluate((e) => e.contains(document.activeElement)),
      true,
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("dialog").open);
    assert.equal(
      await about.evaluate((e) => e === document.activeElement),
      true,
    );
    const nav = (view) =>
      page.locator(`[data-view="${view}"]`).filter({ visible: true }).first();
    for (const tab of ["validation", "prerequisites", "topology"]) {
      await (await nav("analysis")).click();
      await page.locator(`[data-tab="${tab}"]`).click();
      await page.locator('[data-action="seed"]').first().click();
      await page.locator("#seed-input").fill(`${width}-${tab}`);
      await page.locator('#seed-form button[type="submit"]').click();
      await page.locator(".export-menu summary").click();
      const promise = page.waitForEvent("download");
      await page.locator('[data-action="json"]').click();
      const dl = await promise;
      await dl.saveAs(`${root}/${width}-${tab}.json`);
      const plan = createCurriculum(`${width}-${tab}`);
      const expected = exportForView(
        { curriculum: plan, view: "analysis", analysisTab: tab },
        "json",
      );
      assert.equal(dl.suggestedFilename(), expected.filename);
      assert.equal(
        await fs.readFile(`${root}/${width}-${tab}.json`, "utf8"),
        expected.content,
      );
      const pcsv = page.waitForEvent("download");
      await page.locator('[data-action="csv"]').click();
      const csv = await pcsv;
      await csv.saveAs(`${root}/${width}-${tab}.csv`);
      assert.equal(
        await fs.readFile(`${root}/${width}-${tab}.csv`, "utf8"),
        exportForView(
          { curriculum: plan, view: "analysis", analysisTab: tab },
          "csv",
        ).content,
      );
    }
    for (let i = 0; i < 3; i++) {
      await (await nav("graph")).click();
      await page.waitForSelector("#graph canvas");
      await page.locator('[data-action="zoom-in"]').click();
      await page.locator('[data-action="zoom-out"]').click();
      await page.locator('[data-action="fit"]').click();
      await page.locator("#hasse").check();
      await page.locator("#bands").uncheck();
      for (const scope of ["direct", "full", "all"])
        await page.locator(`[data-scope="${scope}"]`).click();
      await page.locator('[data-action="list"]').click();
      assert.equal(await page.locator(".graph-list p").count(), 50);
      if (i === 0) {
        await page.locator(".export-menu summary").click();
        const pending = page.waitForEvent("download");
        await page.locator('[data-action="png"]').click();
        const dl = await pending;
        await dl.saveAs(`${root}/${width}.png`);
        assert.equal(
          (await fs.readFile(`${root}/${width}.png`)).subarray(1, 4).toString(),
          "PNG",
        );
      }
      await page.screenshot({ path: `${root}/${width}-graph.png` });
      await (await nav("grid")).click();
    }
    await page.goto(`${base}/`);
    const seed1 = new URL(page.url()).searchParams.get("seed");
    await page.goto(`${base}/`);
    const seed2 = new URL(page.url()).searchParams.get("seed");
    assert.notEqual(seed1, seed2);
    console.log(
      width,
      await page.evaluate(async () => {
        await document.fonts.ready;
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          fonts: [...document.fonts].map((f) => [f.family, f.status]),
          smallTargets: [...document.querySelectorAll("button,summary")]
            .filter((e) => e.getClientRects().length)
            .map((e) => ({
              text: e.textContent.trim(),
              h: e.getBoundingClientRect().height,
              w: e.getBoundingClientRect().width,
            }))
            .filter((e) => e.h < 44 || e.w < 44),
          input: getComputedStyle(document.querySelector("#search")).fontSize,
          scripts: [...document.scripts].map((s) => s.src),
        };
      }),
    );
    await context.close();
  }
  console.log({ errors, failed });
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
} finally {
  await browser.close();
}
