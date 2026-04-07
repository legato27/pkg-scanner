import { getDb } from "../db";

const PERMISSIVE_LICENSES = new Set([
  "MIT",
  "MIT License",
  "Apache-2.0",
  "Apache License 2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "Unlicense",
  "CC0-1.0",
  "WTFPL",
  "Zlib",
  "BSL-1.0",
]);

const COPYLEFT_LICENSES = new Set([
  "GPL-2.0",
  "GPL-2.0-only",
  "GPL-2.0-or-later",
  "GPL-3.0",
  "GPL-3.0-only",
  "GPL-3.0-or-later",
  "LGPL-2.1",
  "LGPL-3.0",
  "AGPL-3.0",
  "AGPL-3.0-only",
  "MPL-2.0",
  "EUPL-1.2",
  "CPAL-1.0",
  "SSPL-1.0",
]);

export function classifyLicense(license: string | null): string {
  if (!license || license.trim() === "") return "unknown";

  const normalized = license.trim();

  if (PERMISSIVE_LICENSES.has(normalized)) return "permissive";
  if (COPYLEFT_LICENSES.has(normalized)) return "copyleft";

  // Fuzzy match
  const upper = normalized.toUpperCase();
  if (upper.includes("MIT") || upper.includes("APACHE") || upper.includes("BSD") || upper.includes("ISC")) {
    return "permissive";
  }
  if (upper.includes("GPL") || upper.includes("AGPL") || upper.includes("LGPL")) {
    return "copyleft";
  }
  if (upper.includes("PROPRIETARY") || upper.includes("COMMERCIAL")) {
    return "proprietary";
  }

  return "unknown";
}

export function updateLicenseClassifications(): void {
  const db = getDb();
  const packages = db
    .prepare("SELECT id, license FROM packages WHERE license IS NOT NULL")
    .all() as Array<{ id: string; license: string }>;

  const update = db.prepare("UPDATE packages SET license_type = ? WHERE id = ?");
  const updateMany = db.transaction(() => {
    for (const pkg of packages) {
      update.run(classifyLicense(pkg.license), pkg.id);
    }
  });

  updateMany();
}
