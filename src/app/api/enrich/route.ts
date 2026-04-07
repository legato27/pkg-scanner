import { NextResponse } from "next/server";
import { getDb, Package } from "@/lib/db";
import { checkVulnerabilities } from "@/lib/trust/vulnerability";
import { enrichReputation } from "@/lib/trust/reputation";
import { updateLicenseClassifications } from "@/lib/trust/license";
import { updateTrustScores } from "@/lib/trust-score";

let enriching = false;

export async function POST() {
  if (enriching) {
    return NextResponse.json(
      { error: "Enrichment already in progress" },
      { status: 409 }
    );
  }

  enriching = true;

  // Run enrichment in background
  (async () => {
    try {
      const db = getDb();
      const packages = db.prepare("SELECT * FROM packages").all() as Package[];

      // Check vulnerabilities (with rate limiting)
      for (const pkg of packages) {
        await checkVulnerabilities(pkg.id, pkg.name, pkg.version, pkg.manager);
        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 100));
      }

      // Enrich reputation for npm and pip packages
      const enrichable = packages.filter(
        (p) => p.manager === "npm" || p.manager === "pip"
      );
      for (const pkg of enrichable) {
        await enrichReputation(pkg.id, pkg.name, pkg.manager);
        await new Promise((r) => setTimeout(r, 200));
      }

      // Classify licenses
      updateLicenseClassifications();

      // Calculate trust scores
      updateTrustScores();
    } catch (err) {
      console.error("Enrichment failed:", err);
    } finally {
      enriching = false;
    }
  })();

  return NextResponse.json({ message: "Enrichment started" });
}

export async function GET() {
  return NextResponse.json({ enriching });
}
