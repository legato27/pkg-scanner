import { getDb } from "../db";

type NpmsResult = {
  collected?: {
    metadata?: {
      description?: string;
      links?: { repository?: string; homepage?: string };
      license?: string;
    };
    github?: {
      starsCount?: number;
      homepage?: string;
    };
    npm?: {
      downloads?: Array<{ count: number }>;
    };
  };
  score?: {
    final?: number;
  };
};

type PypiResult = {
  info?: {
    summary?: string;
    home_page?: string;
    license?: string;
    project_urls?: Record<string, string>;
    author?: string;
  };
};

export async function enrichReputation(
  packageId: string,
  packageName: string,
  manager: string
): Promise<void> {
  const db = getDb();

  try {
    let stars: number | null = null;
    let downloads: number | null = null;
    let sourceRepo: string | null = null;
    let description: string | null = null;
    let license: string | null = null;
    let homepage: string | null = null;

    if (manager === "npm") {
      const res = await fetch(`https://api.npms.io/v2/package/${encodeURIComponent(packageName)}`);
      if (res.ok) {
        const data: NpmsResult = await res.json();
        stars = data.collected?.github?.starsCount ?? null;
        downloads =
          data.collected?.npm?.downloads?.reduce((sum, d) => sum + d.count, 0) ?? null;
        sourceRepo = data.collected?.metadata?.links?.repository ?? null;
        description = data.collected?.metadata?.description ?? null;
        license = data.collected?.metadata?.license ?? null;
        homepage = data.collected?.metadata?.links?.homepage ?? null;
      }
    } else if (manager === "pip") {
      const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`);
      if (res.ok) {
        const data: PypiResult = await res.json();
        description = data.info?.summary ?? null;
        homepage = data.info?.home_page ?? null;
        license = data.info?.license ?? null;
        sourceRepo =
          data.info?.project_urls?.["Source"] ??
          data.info?.project_urls?.["Repository"] ??
          null;
      }
    }

    // Update reputation table
    db.prepare(`
      INSERT INTO reputation (package_id, github_stars, download_count, source_repo)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(package_id) DO UPDATE SET
        github_stars = excluded.github_stars,
        download_count = excluded.download_count,
        source_repo = excluded.source_repo
    `).run(packageId, stars, downloads, sourceRepo);

    // Update package metadata if enriched
    if (description || license || homepage) {
      const updates: string[] = [];
      const params: (string | null)[] = [];

      if (description) {
        updates.push("description = ?");
        params.push(description);
      }
      if (license) {
        updates.push("license = ?");
        params.push(license);
      }
      if (homepage) {
        updates.push("homepage = ?");
        params.push(homepage);
      }

      if (updates.length > 0) {
        params.push(packageId);
        db.prepare(
          `UPDATE packages SET ${updates.join(", ")} WHERE id = ?`
        ).run(...params);
      }
    }
  } catch (err) {
    console.error(`Reputation enrichment failed for ${packageName}:`, err);
  }
}
