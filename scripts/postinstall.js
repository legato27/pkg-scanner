const fs = require("fs");
const path = require("path");

// Ensure db directory exists
const dbDir = path.join(__dirname, "..", "db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Remove any existing database (fresh install = fresh scan)
const dbFile = path.join(dbDir, "scanner.db");
if (fs.existsSync(dbFile)) {
  // Keep existing data on reinstall
  console.log("  pkg-scanner: Existing database found, keeping data.");
} else {
  console.log("  pkg-scanner: Database will be created on first scan.");
}
