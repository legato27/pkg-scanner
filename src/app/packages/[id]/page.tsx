"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  TrustBadge,
  ManagerBadge,
  SeverityBadge,
  LicenseBadge,
} from "@/components/TrustBadge";
import type { Package, Vulnerability, Reputation } from "@/lib/db";

type PackageDetail = {
  package: Package;
  vulnerabilities: Vulnerability[];
  reputation: Reputation | null;
};

export default function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/packages/${id}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading package details...
      </div>
    );
  }

  if (!data || !data.package) {
    return (
      <div className="space-y-4">
        <Link href="/packages">
          <Button variant="outline" size="sm">
            Back to packages
          </Button>
        </Link>
        <p className="text-muted-foreground">Package not found.</p>
      </div>
    );
  }

  const pkg = data.package;
  const vulns = data.vulnerabilities;
  const rep = data.reputation;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/packages" className="text-sm text-muted-foreground hover:text-foreground">
            &larr; Back to packages
          </Link>
          <h2 className="text-3xl font-bold mt-2">{pkg.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <ManagerBadge manager={pkg.manager} />
            {pkg.version && (
              <Badge variant="outline" className="font-mono">
                v{pkg.version}
              </Badge>
            )}
            <TrustBadge score={pkg.trust_score} />
            <LicenseBadge type={pkg.license_type} />
          </div>
        </div>
      </div>

      {pkg.description && (
        <p className="text-muted-foreground">{pkg.description}</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Package Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Package Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Name" value={pkg.name} />
            <InfoRow label="Version" value={pkg.version || "Unknown"} />
            <InfoRow label="Manager" value={pkg.manager} />
            <InfoRow label="License" value={pkg.license || "Unknown"} />
            {pkg.homepage && (
              <InfoRow
                label="Homepage"
                value={
                  <a
                    href={pkg.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    {pkg.homepage}
                  </a>
                }
              />
            )}
            {pkg.last_scanned_at && (
              <InfoRow
                label="Last Scanned"
                value={new Date(pkg.last_scanned_at).toLocaleString()}
              />
            )}
          </CardContent>
        </Card>

        {/* Reputation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reputation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rep ? (
              <>
                {rep.github_stars !== null && (
                  <InfoRow label="GitHub Stars" value={rep.github_stars.toLocaleString()} />
                )}
                {rep.download_count !== null && (
                  <InfoRow
                    label="Downloads"
                    value={rep.download_count.toLocaleString()}
                  />
                )}
                {rep.source_repo && (
                  <InfoRow
                    label="Source"
                    value={
                      <a
                        href={rep.source_repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        {rep.source_repo}
                      </a>
                    }
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No reputation data available. Run enrichment to fetch data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vulnerabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Vulnerabilities ({vulns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vulns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No known vulnerabilities found.
            </p>
          ) : (
            <div className="space-y-4">
              {vulns.map((vuln) => (
                <div key={vuln.id}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {vuln.vuln_id}
                        </span>
                        <SeverityBadge severity={vuln.severity} />
                      </div>
                      {vuln.summary && (
                        <p className="text-sm text-muted-foreground">
                          {vuln.summary}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {vuln.published_at && (
                          <span>Published: {vuln.published_at}</span>
                        )}
                        {vuln.fixed_version && (
                          <span>Fixed in: v{vuln.fixed_version}</span>
                        )}
                      </div>
                    </div>
                    {vuln.reference_url && (
                      <a
                        href={vuln.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        View Details &rarr;
                      </a>
                    )}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
