CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'running', -- running | completed | failed
  total_packages INTEGER DEFAULT 0,
  error TEXT
);

CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT,
  manager TEXT NOT NULL, -- brew | npm | pip | cargo | gem
  description TEXT,
  homepage TEXT,
  license TEXT,
  license_type TEXT, -- permissive | copyleft | proprietary | unknown
  trust_score INTEGER, -- 0-100
  vuln_count INTEGER DEFAULT 0,
  last_scanned_at TEXT,
  scan_id TEXT,
  UNIQUE(name, manager)
);

CREATE TABLE IF NOT EXISTS vulnerabilities (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  vuln_id TEXT NOT NULL, -- CVE or GHSA ID
  summary TEXT,
  severity TEXT, -- critical | high | medium | low
  published_at TEXT,
  fixed_version TEXT,
  reference_url TEXT,
  FOREIGN KEY (package_id) REFERENCES packages(id)
);

CREATE TABLE IF NOT EXISTS reputation (
  package_id TEXT PRIMARY KEY,
  github_stars INTEGER,
  download_count INTEGER,
  maintainer_count INTEGER,
  first_published TEXT,
  last_updated TEXT,
  source_repo TEXT,
  FOREIGN KEY (package_id) REFERENCES packages(id)
);

CREATE INDEX IF NOT EXISTS idx_packages_manager ON packages(manager);
CREATE INDEX IF NOT EXISTS idx_packages_trust ON packages(trust_score);
CREATE INDEX IF NOT EXISTS idx_vulns_package ON vulnerabilities(package_id);
CREATE INDEX IF NOT EXISTS idx_vulns_severity ON vulnerabilities(severity);
