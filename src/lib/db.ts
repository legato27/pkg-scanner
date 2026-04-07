import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "db", "scanner.db");
const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
    db.exec(schema);
  }
  return db;
}

export type Package = {
  id: string;
  name: string;
  version: string | null;
  manager: string;
  description: string | null;
  homepage: string | null;
  license: string | null;
  license_type: string | null;
  trust_score: number | null;
  vuln_count: number;
  last_scanned_at: string | null;
  scan_id: string | null;
};

export type Vulnerability = {
  id: string;
  package_id: string;
  vuln_id: string;
  summary: string | null;
  severity: string;
  published_at: string | null;
  fixed_version: string | null;
  reference_url: string | null;
};

export type Reputation = {
  package_id: string;
  github_stars: number | null;
  download_count: number | null;
  maintainer_count: number | null;
  first_published: string | null;
  last_updated: string | null;
  source_repo: string | null;
};

export type Scan = {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  total_packages: number;
  error: string | null;
};
