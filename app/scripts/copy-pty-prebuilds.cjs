#!/usr/bin/env node
/**
 * Copy correct node-pty prebuilds to build/Release/ based on target architecture.
 *
 * This replaces the node-gyp rebuild approach which fails under Rosetta 2
 * (x86_64 terminal can't cross-compile arm64 native modules reliably).
 *
 * node-pty's loadNativeModule checks build/Release FIRST, then prebuilds/.
 * By copying the correct prebuild to build/Release, we ensure the right
 * architecture is loaded regardless of the build environment.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

const NODE_PTY_DIR = path.join(__dirname, "..", "node_modules", "node-pty");
const RELEASE_DIR = path.join(NODE_PTY_DIR, "build", "Release");

// Determine target architecture:
// 1. npm_config_arch (set by electron-builder during packaging)
// 2. npm_config_target_arch (alternative env var)
// 3. process.arch (current runtime arch — may be wrong under Rosetta)
const targetArch =
  process.env.npm_config_arch || process.env.npm_config_target_arch || process.arch;

const platform = process.platform;
const prebuildDir = path.join(NODE_PTY_DIR, "prebuilds", `${platform}-${targetArch}`);

console.log(
  `\x1b[32m[node-pty prebuilds]\x1b[0m Platform: ${platform}, Target arch: ${targetArch}`,
);
console.log(`\x1b[32m[node-pty prebuilds]\x1b[0m Prebuild dir: ${prebuildDir}`);

if (!fs.existsSync(prebuildDir)) {
  console.log(
    `\x1b[33m[node-pty prebuilds]\x1b[0m No prebuilds found for ${platform}-${targetArch}, skipping`,
  );
  process.exit(0);
}

// Clean and recreate build/Release
if (fs.existsSync(RELEASE_DIR)) {
  fs.rmSync(RELEASE_DIR, { recursive: true });
}
fs.mkdirSync(RELEASE_DIR, { recursive: true });

// Copy all files from prebuild dir to build/Release
const files = fs.readdirSync(prebuildDir);
for (const file of files) {
  const src = path.join(prebuildDir, file);
  const dest = path.join(RELEASE_DIR, file);
  fs.copyFileSync(src, dest);

  // Make spawn-helper executable
  if (file === "spawn-helper") {
    fs.chmodSync(dest, 0o755);
  }

  console.log(`\x1b[32m[node-pty prebuilds]\x1b[0m Copied ${file} (${targetArch})`);
}

console.log(
  `\x1b[32m[node-pty prebuilds]\x1b[0m Done — build/Release ready for ${platform}-${targetArch}`,
);
