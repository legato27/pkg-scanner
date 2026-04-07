#!/usr/bin/env node

const { execFile, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const net = require("net");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_PORT = 4000;

function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function openBrowser(url) {
  try {
    const open = await import("open");
    await open.default(url);
  } catch {
    console.log(`  Open your browser to: ${url}`);
  }
}

function printBanner() {
  console.log("");
  console.log("  ========================================");
  console.log("    pkg-scanner - Security Dashboard");
  console.log("  ========================================");
  console.log("");
  console.log("  Scans installed packages from:");
  console.log("    - Homebrew (brew)");
  console.log("    - npm (global)");
  console.log("    - pip / pip3");
  console.log("    - Cargo (Rust)");
  console.log("    - RubyGems (gem)");
  console.log("");
  console.log("  Checks for:");
  console.log("    - Known vulnerabilities (CVEs via OSV.dev)");
  console.log("    - License compliance");
  console.log("    - Source reputation & trust scores");
  console.log("");
}

async function main() {
  const args = process.argv.slice(2);
  const portArg = args.find((a) => a.startsWith("--port="));
  const requestedPort = portArg
    ? parseInt(portArg.split("=")[1], 10)
    : DEFAULT_PORT;
  const noBrowser = args.includes("--no-browser");

  printBanner();

  const port = await findAvailablePort(requestedPort);

  // Check if Next.js build exists, if not build first
  const nextDir = path.join(PROJECT_ROOT, ".next");
  if (!fs.existsSync(nextDir)) {
    console.log("  First run detected. Building the dashboard...");
    console.log("  This may take 30-60 seconds.\n");

    await new Promise((resolve, reject) => {
      const build = spawn("npx", ["next", "build"], {
        cwd: PROJECT_ROOT,
        stdio: "inherit",
        shell: true,
      });
      build.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Build failed with code ${code}`));
      });
    });
    console.log("");
  }

  console.log(`  Starting dashboard on port ${port}...`);
  console.log("");

  const server = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: PROJECT_ROOT,
    stdio: "pipe",
    shell: true,
  });

  server.stdout.on("data", async (data) => {
    const output = data.toString();
    if (output.includes("Ready") || output.includes("started")) {
      const url = `http://localhost:${port}`;
      console.log(`  Dashboard ready at: ${url}`);
      console.log("");
      console.log("  Quick start:");
      console.log("    1. Click 'Scan' in the sidebar");
      console.log("    2. Run 'Package Discovery' to find installed packages");
      console.log("    3. Run 'Trust Enrichment' to check vulnerabilities");
      console.log("");
      console.log("  Press Ctrl+C to stop the server.");
      console.log("");

      if (!noBrowser) {
        await openBrowser(url);
      }
    }
  });

  server.stderr.on("data", (data) => {
    const msg = data.toString().trim();
    if (msg && !msg.includes("ExperimentalWarning") && !msg.includes("Warning:")) {
      console.error(msg);
    }
  });

  process.on("SIGINT", () => {
    console.log("\n  Shutting down pkg-scanner...");
    server.kill();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    server.kill();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("  Failed to start pkg-scanner:", err.message);
  process.exit(1);
});
