#!/usr/bin/env node
// Packages the plugin directory into dist/<name>-<version>-<os>.zip, the asset
// name Lithe Store's release tracker recognizes (docs/publishing.md there).
// Usage: node scripts/package.mjs [--expect-tag <tag>]

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync } from "node:fs";

const PACKAGE_DIR = "io.github.lithe-idea.lua-support";
const ASSET_PREFIX = "lua-support";
// System-command plugins carry no binaries, so one archive serves every
// architecture. Add "windows" once Lithe for Windows installs marketplace plugins.
const OPERATING_SYSTEMS = ["darwin"];

const manifest = JSON.parse(readFileSync(`${PACKAGE_DIR}/plugin.json`, "utf8"));
const problems = [];
if (manifest.id !== PACKAGE_DIR) problems.push(`plugin.json id ${manifest.id} must equal the directory ${PACKAGE_DIR}`);
if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(manifest.version)) problems.push(`version ${manifest.version} is not MAJOR.MINOR.PATCH`);
if (manifest.vendor?.signatureRequirement !== "none") problems.push('vendor.signatureRequirement must be "none"');
if (manifest.id === "dev.lithe" || manifest.id.startsWith("dev.lithe.")) problems.push("dev.lithe.* is reserved for official plugins");

const tagFlag = process.argv.indexOf("--expect-tag");
if (tagFlag >= 0) {
  const tag = process.argv[tagFlag + 1];
  if (tag !== `v${manifest.version}`) problems.push(`tag ${tag} does not match plugin.json version ${manifest.version} (expected v${manifest.version})`);
}
if (problems.length > 0) {
  for (const problem of problems) console.error(`✗ ${problem}`);
  process.exit(1);
}

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const os of OPERATING_SYSTEMS) {
  const asset = `dist/${ASSET_PREFIX}-${manifest.version}-${os}.zip`;
  // -X drops extra file attributes so the archive bytes do not depend on the machine.
  execFileSync("zip", ["-qrX", asset, PACKAGE_DIR, "-x", "*.DS_Store"]);
  const sha256 = createHash("sha256").update(readFileSync(asset)).digest("hex");
  console.log(`${asset} ${sha256}`);
}
