import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = process.env.EVENTOPS_TEST_PORT || "3002",
  base = `http://localhost:${port}`;
const dataDir = mkdtempSync(path.join(tmpdir(), "eventops-browser-"));
const server = spawn(
  process.execPath,
  [
    root + "/node_modules/next/dist/bin/next",
    "start",
    "--port",
    port,
    "--hostname",
    "0.0.0.0",
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      COMETCHAT_APP_ID: "",
      COMETCHAT_REST_API_KEY: "",
      COMETCHAT_REGION: "",
      DATABASE_URL: "",
      LLM_API_KEY: "",
      EVENTOPS_ACCESS_CODE: "",
      APP_ORIGIN: base,
      EVENTOPS_DATA_DIR: dataDir,
    },
  },
);
server.stderr.on("data", (data) => process.stdout.write(data));
let browser;
try {
  let ready = false;
  for (let n = 0; n < 100; n++) {
    try {
      if ((await fetch(base + "/api/state")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, "Production server must start");
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    headless: true,
    args: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--single-process",
          "--use-gl=angle",
          "--use-angle=swiftshader",
        ]
      : [],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", (route) =>
    route.request().url().startsWith(base) ||
    route.request().url().startsWith("data:")
      ? route.continue()
      : route.abort(),
  );
  mkdirSync(root + "/docs/screenshots", { recursive: true });
  const shot = async (name) =>
    page.screenshot({ path: root + "/docs/screenshots/" + name + ".png", animations: "disabled" });
  const noOverflow = async () =>
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
      false,
      `Document must fit the screen: ${page.url()} at ${page.viewportSize().width}px`,
    );
  const go = async (name) => {
    if (name === "Simulation lab" && page.viewportSize().width <= 768) {
      await page.getByRole("button", { name: "More navigation" }).click();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: /Simulation lab/ })
        .click();
    } else {
      await page
        .locator(
          page.viewportSize().width <= 768 ? ".bottom-nav" : ".desktop-nav",
        )
        .getByRole("link", { name, exact: true })
        .click();
    }
  };

  await page.goto(base, { waitUntil: "networkidle" });
  await noOverflow();
  await shot("mobile-welcome");
  await page.getByRole("button", { name: "Enter command center" }).click();
  await page.getByRole("heading", { name: /Keep the event/ }).waitFor();
  await page.locator(".bottom-nav").waitFor();
  assert.equal(
    (await (await page.request.get(base + "/api/state")).json()).configured,
    false,
  );
  await shot("mobile-clear");
  await go("Simulation lab");
  await page.locator("select").selectOption("0");
  await page
    .locator(".scenario-card")
    .filter({
      has: page.getByRole("heading", {
        name: "Registration failure",
        exact: true,
      }),
    })
    .getByRole("button", { name: "Run scenario" })
    .click();
  await page.getByText("3/3 reports sent").waitFor({ timeout: 20000 });
  await noOverflow();
  await shot("mobile-simulation");
  await go("Command center");
  await page
    .getByRole("heading", { name: "Registration congestion", exact: true })
    .waitFor();
  assert.equal(
    await page.locator(".bottom-nav > .active").count(),
    1,
    "Only the current phone destination is active",
  );
  await shot("mobile-command");

  for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width > 768 ? 1000 : 844 });
    await noOverflow();
    if (width <= 768) {
      const nav = await page.locator(".bottom-nav").boundingBox();
      assert.ok(
        nav && nav.y + nav.height <= 845,
        "Phone navigation stays inside the viewport",
      );
    }
    if (width === 1440) await shot("command-center");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("link")
    .filter({ hasText: "Registration congestion" })
    .first()
    .click();
  await page
    .getByRole("heading", { name: "Registration congestion", exact: true })
    .waitFor();
  await noOverflow();
  await shot("mobile-incident");
  await page.getByRole("button", { name: "Acknowledge", exact: true }).click();
  await page.getByRole("button", { name: /^Actions/ }).click();
  await page
    .locator(".action-item")
    .filter({ hasText: "Deploy two available" })
    .getByRole("button", { name: "Approve", exact: true })
    .click();
  await page.getByText("in progress", { exact: true }).waitFor();
  await shot("mobile-actions");
  await page
    .getByRole("button", { name: "Response chat", exact: true })
    .click();
  await page
    .getByRole("heading", {
      name: "Response room needs attention",
      exact: true,
    })
    .waitFor();
  await noOverflow();
  await page.getByRole("button", { name: "Resolve", exact: true }).click();
  await page
    .getByLabel("Resolution summary")
    .fill("Backup scanner deployed and the queue cleared.");
  await page
    .getByLabel("Confirmed root cause")
    .fill("Scanner 2 hardware failure");
  await shot("mobile-resolve-sheet");
  await page.getByRole("button", { name: "Confirm resolution" }).click();
  await page
    .getByRole("heading", { name: "After-action report", exact: true })
    .waitFor();
  const state = await (await page.request.get(base + "/api/state")).json();
  assert.equal(state.incidents[0].status, "RESOLVED");
  assert.equal(
    state.staff.some((s) => s.availability === "ON INCIDENT"),
    false,
  );
  await page.locator(".after-action").scrollIntoViewIfNeeded();
  await shot("mobile-resolution");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator(".after-action").scrollIntoViewIfNeeded();
  await shot("resolution-report");
  await page.setViewportSize({ width: 390, height: 844 });
  await go("Staff & assignments");
  await page.getByRole("heading", { name: "Your team", exact: true }).waitFor();
  await noOverflow();
  await shot("mobile-team");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("dialog", { name: "Your workspace" }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await go("Team channels");
  await page
    .getByRole("heading", { name: "Team channels", exact: true })
    .waitFor();
  await page
    .getByRole("heading", { name: "Connect the conversation", exact: true })
    .waitFor();
  await noOverflow();
  await shot("mobile-chat");
  await go("Command center");
  await page
    .getByRole("button", { name: "Report incident", exact: true })
    .click();
  await page.getByLabel("Incident title").fill("Projector check in Hall A");
  await page
    .getByLabel("Observed details")
    .fill("Staff report an intermittent image on the workshop projector.");
  await page.getByLabel("Venue zone").selectOption("Hall A");
  await page
    .getByRole("button", { name: "Create incident", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Projector check in Hall A", exact: true })
    .waitFor();
  await noOverflow();
  const manifest = await (
    await page.request.get(base + "/manifest.webmanifest")
  ).json();
  assert.equal(manifest.display, "standalone");
  for (const icon of manifest.icons)
    assert.equal((await page.request.get(base + icon.src)).status(), 200);
  await page.request.post(base + "/api/session", {
    data: { uid: "eventops-kabir" },
    headers: { Origin: base },
  });
  assert.equal(
    (
      await page.request.post(base + "/api/simulation/reset", {
        data: {},
        headers: { Origin: base },
      })
    ).status(),
    403,
  );
  assert.equal(
    (
      await page.request.post(base + "/api/simulation/reset", {
        data: {},
        headers: { Origin: "https://untrusted.example" },
      })
    ).status(),
    403,
  );
  for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width > 768 ? 1000 : 844 });
    for (const route of ["/command", "/incidents", "/staff", "/simulation", "/research", "/chat", "/incidents/INC-023"]) {
      await page.goto(base + route, { waitUntil: "domcontentloaded" });
      await page.locator(".main-content h1").first().waitFor();
      await noOverflow();
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: smartphone workflow, incident views, bottom navigation, sheets, manual reporting, 7 layout widths, manifest/icons, role/origin protection; no page errors. Remote writes disabled.",
  );
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
  rmSync(dataDir, { recursive: true, force: true });
}
