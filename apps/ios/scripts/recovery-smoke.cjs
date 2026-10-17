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
  await page.route("**/__recovery_fixture", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
      body: "<!doctype html><html><body>SQLite test fixture</body></html>",
    }),
  );
  const button = (name) => page.getByRole("button", { name, exact: true });
  async function fixture(mode) {
    await page.goto("http://localhost:8081/__recovery_fixture");
    await page.evaluate((mode) => {
      globalThis.recoveryFixtureMode = mode;
    }, mode);
    await page.addScriptTag({
      url: "http://localhost:8081/scripts/recovery-fixture.bundle?platform=web&dev=true&hot=false&minify=false&lazy=true&transform.engine=hermes&unstable_transformProfile=hermes-stable",
    });
    await page.waitForFunction(
      () => globalThis.recoveryFixtureResult !== undefined,
    );
    const result = await page.evaluate(() => globalThis.recoveryFixtureResult);
    assert.equal(result.error, undefined);
    return result;
  }
  async function home() {
    await page.getByText("13 sample photos", { exact: true }).waitFor();
  }
  try {
    for (const mode of ["malformed", "unsupported", "partial"]) {
      const original = await fixture(mode);
      await page.goto("http://localhost:8081/");
      await button("Try again").waitFor();
      if (mode === "partial")
        await page.screenshot({
          path: path.resolve(
            __dirname,
            "../../..",
            "docs/screenshots/recovery-web.png",
          ),
        });
      if (mode === "unsupported")
        await page.getByText(/Updating to a compatible app version/).waitFor();
      await button("Try again").click();
      await button("Try again").waitFor();
      assert.equal(
        await page.getByText("Working on local data…", { exact: true }).count(),
        0,
      );
      const action =
        mode === "partial"
          ? "Recover readable data"
          : "Start fresh demo library";
      await button(action).click();
      await button("Cancel").click();
      const unchanged = await fixture("inspect");
      assert.equal(unchanged.payload, original.payload);
      assert.equal(unchanged.archived, null);
      await page.goto("http://localhost:8081/");
      await button(action).click();
      await button(
        mode === "partial" ? "Confirm recovery" : "Confirm fresh library",
      ).click();
      await home();
      await page.reload();
      await home();
      if (mode === "partial") {
        await page.goto("http://localhost:8081/storage");
        await page
          .getByText("1 of 5 groups reviewed", { exact: true })
          .waitFor();
        await page.goto("http://localhost:8081/albums");
        await page.getByText("Recovered memories", { exact: true }).waitFor();
        await page.goto("http://localhost:8081/settings");
        await page.getByRole("switch").waitFor();
        assert.equal(await page.getByRole("switch").isChecked(), false);
      }
      const recovered = await fixture("inspect");
      assert.equal(recovered.archived, original.payload);
      assert.equal(JSON.parse(recovered.payload).version, 1);
      if (mode === "partial") {
        const data = JSON.parse(recovered.payload);
        assert.equal(data.decisions.length, 1);
        assert.ok(data.memberships["pet-1"].includes("custom-recovery"));
        assert.deepEqual(data.memberships["lake-2"], []);
      }
    }
    await page.goto("http://localhost:8081/settings");
    await button("Reset demonstration data").click();
    await button("Confirm reset demo data").click();
    await button("Reset demonstration data").waitFor();
    await page.waitForFunction(
      () => document.querySelector('[role="switch"]')?.checked === true,
    );
    const cleared = await fixture("inspect");
    assert.equal(cleared.archived, null);
    assert.equal(JSON.parse(cleared.payload).decisions.length, 0);
    await page.goto("http://localhost:8081/");
    await home();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: malformed/unsupported/partial snapshots, retry, cancel, confirmed recovery, raw archive preservation, valid data salvage, reload and Settings archive cleanup in real browser SQLite.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
