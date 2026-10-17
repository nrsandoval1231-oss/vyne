// Run against `npm run web -- --port 8081`. Screenshots are browser evidence, not iOS.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const text = () => page.locator("body").innerText();
  const button = (name) => page.getByRole("button", { name, exact: true });
  const click = async (name) => {
    await button(name).click();
    await page.waitForTimeout(250);
  };
  const shot = (name) =>
    page.screenshot({
      path: path.resolve(
        __dirname,
        "../../..",
        "docs/screenshots",
        name + "-web.png",
      ),
    });
  const visit = async (route) => {
    await page.goto("http://localhost:8081" + route);
    await page
      .getByText("DEMO LIBRARY · ON YOUR DEVICE", { exact: true })
      .waitFor();
  };
  try {
    await visit("/");
    assert.match(await text(), /13 sample photos/);
    await shot("home");
    await click("Review cleanup");
    await page
      .getByText("One view. Twice captured.", { exact: true })
      .waitFor();
    await click("Why this suggestion?");
    assert.match(await text(), /hand-authored sample groups/);
    await click("Review for Deletion");
    assert.match(await text(), /Set aside 1 sample photos/);
    await click("Go back");
    assert.doesNotMatch(await text(), /Queued for a future/);
    await click("Review for Deletion");
    await click("Confirm review intention");
    await page.getByText(/Queued for a future deletion review/).waitFor();
    await page.reload();
    await page.getByText(/Queued for a future deletion review/).waitFor();
    await click("Keep");
    await page.getByText(/Kept · you can change/).waitFor();
    await click("Similar");
    await click("Review for Deletion");
    assert.match(await text(), /Set aside 4 sample photos/);
    await click("Confirm review intention");
    await page
      .getByText("A lighter library.", { exact: true })
      .scrollIntoViewIfNeeded();
    await shot("cleanup");
    await click("Blurry");
    assert.equal(await button("Review for Deletion").count(), 0);
    assert.match(await text(), /memory is protected/);
    await click("Skip");
    await page.getByRole("tab", { name: /Albums/ }).click();
    await page.getByText("Your life, collected.", { exact: true }).waitFor();
    await shot("albums");
    await click("Create a collection");
    await page
      .getByRole("textbox", { name: "Album name" })
      .fill("Weekend favorites");
    await click("Create album");
    await page.getByText("Weekend favorites", { exact: true }).waitFor();
    await click("Open collection");
    await click("Add or correct photos");
    await button("Add to album").first().click();
    await page.waitForTimeout(300);
    await click("Done editing");
    assert.match(await text(), /1 photos/);
    await page.reload();
    await page.getByText(/1 photos · one original/).waitFor();
    await button("Open photo: A little further away").click();
    await page.getByText("Sample metadata", { exact: false }).waitFor();
    assert.equal(
      await button("Weekend favorites").evaluate(
        (e) => getComputedStyle(e).backgroundColor,
      ),
      "rgb(66, 214, 197)",
    );
    await click("Pets");
    await page.waitForTimeout(300);
    await page.reload();
    await button("Pets").waitFor();
    assert.equal(
      await button("Pets").evaluate((e) => getComputedStyle(e).backgroundColor),
      "rgb(66, 214, 197)",
    );
    await shot("photo");
    await button("Open photo: A little further away").click();
    await button("Close photo viewer").waitFor();
    await click("Close photo viewer");
    await visit("/learning");
    assert.match(await text(), /keep signals/);
    await shot("learning");
    await click("Reset Learning");
    await click("Confirm Reset Learning");
    await page.getByText(/Your preferences begin with a choice/).waitFor();
    await visit("/storage");
    assert.match(await text(), /19.0 MB set aside across 4 unique photos/);
    assert.match(await text(), /Actual space recovered: 0 MB/);
    await shot("storage");
    await visit("/settings");
    await shot("settings");
    await page.getByRole("switch").click();
    await page.waitForTimeout(300);
    await page.reload();
    await page.getByRole("switch").waitFor();
    assert.equal(await page.getByRole("switch").isChecked(), false);
    await click("Reset demonstration data");
    await click("Confirm reset demo data");
    await visit("/storage");
    assert.match(await text(), /0 of 5 groups reviewed/);
    assert.match(await text(), /24.9 MB/);
    await visit("/albums");
    assert.doesNotMatch(await text(), /Weekend favorites/);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: 7 screens, navigation, comparison, confirmation, protected memory, SQLite reload, album corrections, learning reset, settings and full demo reset; no browser runtime errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
