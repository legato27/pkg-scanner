import { getDb, Package, Reputation } from "./db";

type TrustInputs = {
  vulnCount: number;
  hasCriticalVuln: boolean;
  licenseType: string | null;
  githubStars: number | null;
  downloadCount: number | null;
  hasSourceRepo: boolean;
  hasHomepage: boolean;
  hasDescription: boolean;
};

/**
 * Calculate a composite trust score (0-100) for a package.
 *
 * This is the core decision of the security scanner — how much
 * should each signal weigh in the final score? There are real
 * trade-offs:
 *
 * - Should a single critical CVE tank the score to 0?
 * - Should popularity (stars/downloads) boost trust? Popular
 *   packages can still have vulns, but they also have more eyes.
 * - How much should "unknown license" penalize a package?
 *
 * TODO: Implement your trust scoring formula here.
 */
export function calculateTrustScore(inputs: TrustInputs): number {
  let score = 100;

  // Vulnerability penalties (heaviest weight)
  if (inputs.hasCriticalVuln) score -= 40;
  score -= Math.min(inputs.vulnCount * 10, 50);

  // License scoring
  if (inputs.licenseType === "permissive") score -= 0;
  else if (inputs.licenseType === "copyleft") score -= 5;
  else if (inputs.licenseType === "proprietary") score -= 15;
  else score -= 10; // unknown

  // Reputation bonus (can recover up to +15)
  if (inputs.githubStars !== null && inputs.githubStars > 1000) score += 5;
  if (inputs.downloadCount !== null && inputs.downloadCount > 100000) score += 5;
  if (inputs.hasSourceRepo) score += 5;

  // Metadata presence
  if (!inputs.hasHomepage) score -= 5;
  if (!inputs.hasDescription) score -= 5;

  return Math.max(0, Math.min(100, score));
}

export function updateTrustScores(): void {
  const db = getDb();
  const packages = db.prepare("SELECT * FROM packages").all() as Package[];

  const update = db.prepare("UPDATE packages SET trust_score = ? WHERE id = ?");

  const updateAll = db.transaction(() => {
    for (const pkg of packages) {
      const reputation = db
        .prepare("SELECT * FROM reputation WHERE package_id = ?")
        .get(pkg.id) as Reputation | undefined;

      const hasCritical =
        (db
          .prepare(
            "SELECT COUNT(*) as cnt FROM vulnerabilities WHERE package_id = ? AND severity = 'critical'"
          )
          .get(pkg.id) as { cnt: number }).cnt > 0;

      const score = calculateTrustScore({
        vulnCount: pkg.vuln_count,
        hasCriticalVuln: hasCritical,
        licenseType: pkg.license_type,
        githubStars: reputation?.github_stars ?? null,
        downloadCount: reputation?.download_count ?? null,
        hasSourceRepo: !!reputation?.source_repo,
        hasHomepage: !!pkg.homepage,
        hasDescription: !!pkg.description,
      });

      update.run(score, pkg.id);
    }
  });

  updateAll();
}
