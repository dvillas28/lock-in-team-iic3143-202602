// Measures one production build of the frontend: Lighthouse navigations, a Lighthouse timespan with real
// scripted interactions (lab INP), web-vitals in the browser (LCP, INP, CLS with rating and element), axe-core
// and the client JavaScript weight (size-limit). Nothing is added to the app: web-vitals is injected here.
// Usage: node scripts/performance-measure.mjs <built frontend dir> <output.json>
// The tools load from this script's own node_modules, so the PR's tooling also measures the base branch.
// A failed step is recorded as an error, never replaced by a value.
import { spawn } from "node:child_process";
import { cp, readFile, writeFile } from "node:fs/promises";
import { globSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import sizeLimit from "size-limit";
import filePlugin from "@size-limit/file";
import lighthouse, { startFlow } from "lighthouse";
import puppeteer from "puppeteer-core";

const require = createRequire(import.meta.url);
const [dirArg, outArg] = process.argv.slice(2);
if (!dirArg || !outArg) throw new Error("Usage: performance-measure.mjs <frontend dir> <output.json>");
const dir = resolve(dirArg);
const PORT = 3000;
const RUNS = Number(process.env.PERF_RUNS ?? 5);
// Build with NEXT_PUBLIC_PORTAL_ORIGIN=http://localhost:3000 and uc.localhost as institution origin.
const ROUTES = [
  { id: "portal", label: "Portal público", url: `http://localhost:${PORT}/` },
  { id: "login", label: "Login UC", url: `http://uc.localhost:${PORT}/login` },
];
const AUDITS = ["largest-contentful-paint", "cumulative-layout-shift", "total-blocking-time", "first-contentful-paint",
  "speed-index", "server-response-time"];
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
const CHROME = process.env.CHROME_PATH ?? (process.platform === "darwin"
  ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "/usr/bin/google-chrome");
const wait = ms => new Promise(done => setTimeout(done, ms));
const failure = error => ({ error: String(error?.message ?? error).split("\n")[0] });

async function startServer() {
  // Never measure a server that was already running: it could be another build.
  if (await fetch(`http://127.0.0.1:${PORT}/`).then(() => true, () => false)) throw new Error("Port 3000 is already in use");
  const { relativeAppDir = "" } = JSON.parse(await readFile(join(dir, ".next/required-server-files.json"), "utf8"));
  const standalone = join(dir, ".next/standalone", relativeAppDir);
  // Same layout as the Docker image: standalone output does not include static assets.
  await cp(join(dir, ".next/static"), join(standalone, ".next/static"), { recursive: true });
  await cp(join(dir, "public"), join(standalone, "public"), { recursive: true });
  const server = spawn(process.execPath, ["server.js"], { cwd: standalone, stdio: "ignore",
    env: { ...process.env, NODE_ENV: "production", PORT: String(PORT), HOSTNAME: "0.0.0.0" } });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await fetch(`http://127.0.0.1:${PORT}/login`).then(r => r.ok, () => false)) return server;
    await wait(1000);
  }
  server.kill();
  throw new Error("The frontend did not answer on port 3000");
}

async function clientJavaScript() {
  const files = globSync(".next/static/chunks/**/*.js", { cwd: dir }).map(file => join(dir, file));
  const [{ size }] = await sizeLimit([filePlugin], { checks: [{ files, gzip: true }] });
  return { gzipBytes: size, files: files.length };
}

async function navigation(browser, url) {
  const page = await browser.newPage();
  try {
    const { lhr } = await lighthouse(url, { output: "json", logLevel: "error", onlyCategories: CATEGORIES }, undefined, page);
    if (lhr.runtimeError) throw new Error(lhr.runtimeError.message);
    return {
      audits: Object.fromEntries(AUDITS.map(id => [id, lhr.audits[id]?.numericValue ?? null])),
      scores: Object.fromEntries(CATEGORIES.map(id => [id, lhr.categories[id]?.score == null ? null : lhr.categories[id].score * 100])),
    };
  } finally { await page.close(); }
}

// Lab INP: Lighthouse timespan around real input events dispatched by Chrome (typing and two clicks).
async function interaction(browser) {
  const page = await browser.newPage();
  try {
    await page.goto(ROUTES[1].url, { waitUntil: "networkidle0" });
    await page.waitForSelector("#email:not([disabled])");
    const flow = await startFlow(page, { name: "Interacción en el login", config: { extends: "lighthouse:default" } });
    await flow.startTimespan({ name: "Escribir el correo y mostrar la contraseña" });
    await page.type("#email", "estudiante@uc.cl", { delay: 50 });
    await page.click('button[aria-label="Mostrar contraseña"]');
    await page.click('button[aria-label="Ocultar contraseña"]');
    await wait(1000);
    await flow.endTimespan();
    const [step] = (await flow.createFlowResult()).steps;
    const inp = step.lhr.audits["interaction-to-next-paint"];
    if (inp?.numericValue == null) throw new Error(inp?.errorMessage ?? "Lighthouse did not report INP");
    return { inp: inp.numericValue, tbt: step.lhr.audits["total-blocking-time"]?.numericValue ?? null,
      cls: step.lhr.audits["cumulative-layout-shift"]?.numericValue ?? null };
  } finally { await page.close(); }
}

// The same web-vitals library Google uses, injected before the page loads (fresh context: cold cache).
// Real input events: type the email and toggle the password; INP only exists after those interactions.
async function webVitals(browser) {
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.evaluateOnNewDocument(`${webVitalsSource}
      window.__vitals = {};
      const keep = m => { window.__vitals[m.name] = { value: m.value, rating: m.rating,
        element: m.attribution.target ?? m.attribution.interactionTarget ?? m.attribution.largestShiftTarget ?? null }; };
      for (const on of ["onLCP", "onINP", "onCLS"]) webVitals[on](keep, { reportAllChanges: true });`);
    await page.goto(ROUTES[1].url, { waitUntil: "networkidle0" });
    await page.waitForSelector("#email:not([disabled])");
    await page.type("#email", "estudiante@uc.cl", { delay: 50 });
    await page.click('button[aria-label="Mostrar contraseña"]');
    await page.click('button[aria-label="Ocultar contraseña"]');
    await wait(1000);
    const vitals = await page.evaluate(() => window.__vitals);
    for (const name of ["LCP", "INP", "CLS"]) if (!vitals[name]) throw new Error(`web-vitals did not report ${name}`);
    return vitals;
  } finally { await context.close(); }
}

async function accessibility(browser, url) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle0" });
    await wait(1500); // client components render after hydration
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const { violations, passes } = await page.evaluate(() => window.axe.run(document));
    return { passes: passes.length, violations: violations.map(v => ({ rule: v.id, impact: v.impact, help: v.help, url: v.helpUrl,
      elements: v.nodes.length, targets: v.nodes.slice(0, 3).map(node => node.target.join(" ")) })) };
  } finally { await page.close(); }
}

async function collect(label, task) {
  try { return await task(); } catch (error) { console.error(`${label}: ${failure(error).error}`); return failure(error); }
}

// The IIFE build is not in the package exports: locate it next to the exported attribution build.
const webVitalsSource = await readFile(join(dirname(require.resolve("web-vitals/attribution")), "web-vitals.attribution.iife.js"), "utf8");
const result = { measuredAt: new Date().toISOString(), runs: RUNS, routes: ROUTES, lighthouse: {}, interaction: [], webVitals: [], axe: {} };
result.javascript = await collect("size-limit", clientJavaScript);
let server;
let browser;
try {
  server = await startServer();
  browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
    args: process.env.CI ? ["--no-sandbox"] : [] });
  result.chrome = await browser.version();
  result.lighthouseVersion = JSON.parse(await readFile(require.resolve("lighthouse/package.json"), "utf8")).version;
  for (const route of ROUTES) {
    result.lighthouse[route.id] = [];
    for (let run = 0; run < RUNS; run += 1) {
      result.lighthouse[route.id].push(await collect(`Lighthouse ${route.id}`, () => navigation(browser, route.url)));
    }
    result.axe[route.id] = await collect(`axe ${route.id}`, () => accessibility(browser, route.url));
  }
  for (let run = 0; run < RUNS; run += 1) result.interaction.push(await collect("INP", () => interaction(browser)));
  for (let run = 0; run < RUNS; run += 1) result.webVitals.push(await collect("web-vitals", () => webVitals(browser)));
} catch (error) {
  result.error = failure(error).error;
  console.error(result.error);
} finally {
  await browser?.close();
  server?.kill();
}
await writeFile(outArg, `${JSON.stringify(result, null, 1)}\n`);
