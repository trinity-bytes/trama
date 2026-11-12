import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8000/?seed=2025&course=5');
  const lanes = page.locator('.flow-lane:nth-of-type(3) > div');
  assert.equal(await lanes.locator('.course').count(), 2);
  assert.ok(await lanes.evaluateAll(elements => elements.every(el => [...el.children].every(child => child.getBoundingClientRect().top >= el.getBoundingClientRect().top && child.getBoundingClientRect().bottom <= el.getBoundingClientRect().bottom))), 'dependency cards must not be clipped');
  const longLane = page.locator('.flow-lane:nth-of-type(4) > div');
  assert.ok(await longLane.evaluate(el => {
    const first = el.firstElementChild.getBoundingClientRect();
    return first.top >= el.getBoundingClientRect().top;
  }), 'overflowing lanes start with their first card visible');
  await longLane.evaluate(el => { el.scrollTop = el.scrollHeight; });
  assert.ok(await longLane.evaluate(el => el.lastElementChild.getBoundingClientRect().bottom <= el.getBoundingClientRect().bottom), 'overflowing lanes can scroll to the last card');
  await page.evaluate(() => {
    const original = window.cytoscape;
    window.cytoscape = (...args) => (window.testGraph = original(...args));
  });
  await page.locator('[data-view="graph"]').first().click();
  await page.waitForSelector('#graph canvas');
  const bands = page.locator('.graph-band');
  assert.equal(await bands.count(), 10, 'one band per cycle');
  const checkAlignment = () => page.evaluate(() => {
    const graph = window.testGraph;
    return graph.nodes().every(node => {
      const band = document.querySelectorAll('.graph-band')[node.data('cycle') - 1].getBoundingClientRect();
      const graphRect = document.querySelector('#graph').getBoundingClientRect();
      const x = graphRect.left + node.renderedPosition().x;
      return x > band.left && x < band.right;
    });
  });
  assert.ok(await checkAlignment(), 'each node is inside its cycle band');
  const before = await bands.first().boundingBox();
  await page.locator('[data-action="zoom-in"]').click();
  const after = await bands.first().boundingBox();
  assert.ok(after.width > before.width, 'cycle bands scale with graph zoom');
  assert.ok(await checkAlignment(), 'nodes remain aligned after zoom');
  await page.evaluate(() => window.testGraph.panBy({ x: 40, y: 20 }));
  assert.ok(await checkAlignment(), 'nodes remain aligned after panning');
  await page.locator('#bands').uncheck();
  assert.equal(await page.locator('.graph-band').count(), 0);
  console.log('Layout regressions passed');
} finally { await browser.close(); }
