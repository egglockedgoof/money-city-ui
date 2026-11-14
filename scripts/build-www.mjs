// Copies the web app (and only the web app) into www/ for Capacitor to bundle.
// Whitelist on purpose: never ship package.json, scripts, ios/, workflows or notes inside the IPA.
import { cpSync, rmSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const root = process.cwd();
const out = join(root, "www");
const FILE_EXT = new Set([".html", ".js", ".css", ".json", ".jpg", ".png"]);
const SKIP = new Set(["package.json", "package-lock.json", "capacitor.config.json", "sw.js"]); // sw.js: no service workers in the native shell
const DIRS = ["icons", "highway-icons"];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let n = 0;
for (const f of readdirSync(root, { withFileTypes: true })) {
  if (!f.isFile() || SKIP.has(f.name) || !FILE_EXT.has(extname(f.name))) continue;
  cpSync(join(root, f.name), join(out, f.name)); n++;
}
for (const d of DIRS) {
  if (existsSync(join(root, d))) { cpSync(join(root, d), join(out, d), { recursive: true }); n++; }
}
if (!existsSync(join(out, "index.html"))) { console.error("build-www: index.html missing"); process.exit(1); }
console.log(`build-www: ${n} entries -> www/`);
