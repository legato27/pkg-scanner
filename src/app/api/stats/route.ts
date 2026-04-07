import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();

  const totalPackages = (
    db.prepare("SELECT COUNT(*) as count FROM packages").get() as { count: number }
  ).count;

  const vulnerablePackages = (
    db.prepare("SELECT COUNT(*) as count FROM packages WHERE vuln_count > 0").get() as {
      count: number;
    }
  ).count;

  const totalVulnerabilities = (
    db.prepare("SELECT COUNT(*) as count FROM vulnerabilities").get() as { count: number }
  ).count;

  const criticalVulns = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM vulnerabilities WHERE severity = 'critical'"
      )
      .get() as { count: number }
  ).count;

  const avgTrustScore = (
    db
      .prepare(
        "SELECT AVG(trust_score) as avg FROM packages WHERE trust_score IS NOT NULL"
      )
      .get() as { avg: number | null }
  ).avg;

  const managerCounts = db
    .prepare("SELECT manager, COUNT(*) as count FROM packages GROUP BY manager ORDER BY count DESC")
    .all() as Array<{ manager: string; count: number }>;

  const severityBreakdown = db
    .prepare(
      "SELECT severity, COUNT(*) as count FROM vulnerabilities GROUP BY severity ORDER BY count DESC"
    )
    .all() as Array<{ severity: string; count: number }>;

  const licenseBreakdown = db
    .prepare(
      "SELECT license_type, COUNT(*) as count FROM packages WHERE license_type IS NOT NULL GROUP BY license_type ORDER BY count DESC"
    )
    .all() as Array<{ license_type: string; count: number }>;

  const lastScan = db
    .prepare("SELECT * FROM scans ORDER BY started_at DESC LIMIT 1")
    .get();

  const topVulnerable = db
    .prepare(
      "SELECT name, manager, vuln_count, trust_score FROM packages WHERE vuln_count > 0 ORDER BY vuln_count DESC LIMIT 10"
    )
    .all();

  return NextResponse.json({
    totalPackages,
    vulnerablePackages,
    totalVulnerabilities,
    criticalVulns,
    avgTrustScore: avgTrustScore ? Math.round(avgTrustScore) : null,
    managerCounts,
    severityBreakdown,
    licenseBreakdown,
    lastScan,
    topVulnerable,
  });
}
