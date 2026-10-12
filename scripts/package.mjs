#!/usr/bin/env node
// Packages the plugin into dist/<name>-<version>-<platform>.zip, the asset
// names Lithe Store's release tracker recognizes (docs/publishing.md there).
//
// The Lua language server is platform-specific, so each platform gets its own
// archive with the pinned LuaLS release from language-server.json bundled under
// <package>/language-server. Archives are downloaded at build time and checked
// against the pinned SHA-256; nothing is downloaded when the user installs.
//
// Usage: node scripts/package.mjs [--expect-tag <tag>]

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PACKAGE_DIR = "io.github.lithe-idea.lua-support";
const ASSET_PREFIX = "lua-support";
const CACHE_DIR = ".cache";
const STAGING_DIR = join("dist", "staging");

const manifest = JSON.parse(readFileSync(`${PACKAGE_DIR}/plugin.json`, "utf8"));
const languageServer = JSON.parse(readFileSync("language-server.json", "utf8"));
const problems = [];
if (manifest.id !== PACKAGE_DIR) problems.push(`plugin.json id ${manifest.id} must equal the directory ${PACKAGE_DIR}`);
if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(manifest.version)) problems.push(`version ${manifest.version} is not MAJOR.MINOR.PATCH`);
if (manifest.vendor?.signatureRequirement !== "none") problems.push('vendor.signatureRequirement must be "none"');
if (manifest.id === "dev.lithe" || manifest.id.startsWith("dev.lithe.")) problems.push("dev.lithe.* is reserved for official plugins");
for (const [platform, archive] of Object.entries(languageServer.archives)) {
  if (!/^[a-z0-9]+-[a-z0-9]+$/.test(platform)) problems.push(`${platform}: platform must look like darwin-arm64`);
  if (!/^[0-9a-f]{64}$/.test(archive.sha256)) problems.push(`${platform}: sha256 must be 64 lowercase hex digits`);
  if (!archive.url.startsWith("https://")) problems.push(`${platform}: url must be https`);
}

const tagFlag = process.argv.indexOf("--expect-tag");
if (tagFlag >= 0) {
  const tag = process.argv[tagFlag + 1];
  if (tag !== `v${manifest.version}`) problems.push(`tag ${tag} does not match plugin.json version ${manifest.version} (expected v${manifest.version})`);
}
if (problems.length > 0) {
  for (const problem of problems) console.error(`✗ ${problem}`);
  process.exit(1);
}

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

/** Returns the pinned LuaLS archive, reusing a cached copy only if its checksum still matches. */
async function pinnedArchive(platform, { url, sha256: expected }) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const path = join(CACHE_DIR, `${languageServer.name}-${languageServer.version}-${platform}.tar.gz`);
  if (!existsSync(path) || sha256(path) !== expected) {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(300_000) });
    if (!response.ok) throw new Error(`${platform}: download ${url} failed with HTTP ${response.status}`);
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
  }
  const actual = sha256(path);
  if (actual !== expected) {
    rmSync(path, { force: true });
    throw new Error(`${platform}: ${url} has SHA-256 ${actual}, expected ${expected}`);
  }
  return path;
}

rmSync("dist", { recursive: true, force: true });
mkdirSync(STAGING_DIR, { recursive: true });
for (const [platform, archive] of Object.entries(languageServer.archives)) {
  const tarball = resolve(await pinnedArchive(platform, archive));
  const stagingRoot = join(STAGING_DIR, platform);
  const packageRoot = join(stagingRoot, PACKAGE_DIR);
  cpSync(PACKAGE_DIR, packageRoot, { recursive: true });
  const serverRoot = join(packageRoot, "language-server");
  mkdirSync(serverRoot, { recursive: true });
  execFileSync("tar", ["-xzf", tarball, "-C", serverRoot]);
  if (!existsSync(join(serverRoot, "bin", "lua-language-server"))) {
    throw new Error(`${platform}: archive has no bin/lua-language-server`);
  }
  const asset = resolve("dist", `${ASSET_PREFIX}-${manifest.version}-${platform}.zip`);
  // -X drops extra file attributes; -y stores a symbolic link as a link so
  // Lithe refuses it instead of the archive silently carrying its target.
  execFileSync("zip", ["-qrXy", asset, PACKAGE_DIR, "-x", "*.DS_Store"], { cwd: stagingRoot });
  console.log(`dist/${ASSET_PREFIX}-${manifest.version}-${platform}.zip ${sha256(asset)}`);
}
rmSync(STAGING_DIR, { recursive: true, force: true });
