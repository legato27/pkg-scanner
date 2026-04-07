import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db";
import { brewScanner } from "./brew";
import { npmScanner } from "./npm";
import { pipScanner } from "./pip";
import { cargoScanner } from "./cargo";
import { gemScanner } from "./gem";
import { ScannerModule, ScannedPackage } from "./types";

export type { ScannedPackage } from "./types";

const scanners: ScannerModule[] = [
  brewScanner,
  npmScanner,
  pipScanner,
  cargoScanner,
  gemScanner,
];

export type ScanProgress = {
  scanId: string;
  status: "running" | "completed" | "failed";
  currentScanner: string;
  packagesFound: number;
  scannersCompleted: number;
  totalScanners: number;
};

let currentScan: ScanProgress | null = null;

export function getScanProgress(): ScanProgress | null {
  return currentScan;
}

export async function runFullScan(): Promise<string> {
  const db = getDb();
  const scanId = uuidv4();

  db.prepare(
    "INSERT INTO scans (id, status) VALUES (?, 'running')"
  ).run(scanId);

  currentScan = {
    scanId,
    status: "running",
    currentScanner: "",
    packagesFound: 0,
    scannersCompleted: 0,
    totalScanners: scanners.length,
  };

  const allPackages: ScannedPackage[] = [];

  try {
    for (const scanner of scanners) {
      currentScan.currentScanner = scanner.name;

      const available = await scanner.isAvailable();
      if (!available) {
        currentScan.scannersCompleted++;
        continue;
      }

      const packages = await scanner.scan();
      allPackages.push(...packages);
      currentScan.packagesFound = allPackages.length;
      currentScan.scannersCompleted++;
    }

    // Upsert packages into database
    const upsert = db.prepare(`
      INSERT INTO packages (id, name, version, manager, description, homepage, license, last_scanned_at, scan_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
      ON CONFLICT(name, manager) DO UPDATE SET
        version = excluded.version,
        description = excluded.description,
        homepage = excluded.homepage,
        license = excluded.license,
        last_scanned_at = excluded.last_scanned_at,
        scan_id = excluded.scan_id
    `);

    const insertMany = db.transaction((packages: ScannedPackage[]) => {
      for (const pkg of packages) {
        upsert.run(
          uuidv4(),
          pkg.name,
          pkg.version,
          pkg.manager,
          pkg.description ?? null,
          pkg.homepage ?? null,
          pkg.license ?? null,
          scanId
        );
      }
    });

    insertMany(allPackages);

    db.prepare(
      "UPDATE scans SET status = 'completed', completed_at = datetime('now'), total_packages = ? WHERE id = ?"
    ).run(allPackages.length, scanId);

    currentScan.status = "completed";
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    db.prepare(
      "UPDATE scans SET status = 'failed', completed_at = datetime('now'), error = ? WHERE id = ?"
    ).run(message, scanId);
    currentScan.status = "failed";
    throw err;
  }

  return scanId;
}
