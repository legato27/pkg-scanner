"use client";

import { useState, useEffect } from "react";
import { StatsCards } from "@/components/StatsCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ManagerBadge } from "@/components/TrustBadge";

type Stats = {
  totalPackages: number;
  vulnerablePackages: number;
  totalVulnerabilities: number;
  criticalVulns: number;
  avgTrustScore: number | null;
  managerCounts: Array<{ manager: string; count: number }>;
  severityBreakdown: Array<{ severity: string; count: number }>;
  licenseBreakdown: Array<{ license_type: string; count: number }>;
  topVulnerable: Array<{
    name: string;
    manager: string;
    vuln_count: number;
    trust_score: number | null;
  }>;
  lastScan: { started_at: string; status: string; total_packages: number } | null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (!stats || stats.totalPackages === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Security Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Overview of your installed packages and their security status
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <svg
              className="w-16 h-16 text-muted-foreground mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No packages scanned yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Go to the <strong>Scan</strong> page to run your first security scan.
              This will inventory all installed packages from brew, npm, pip, cargo,
              and gem.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Security Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Overview of your installed packages and their security status
        </p>
        {stats.lastScan && (
          <p className="text-xs text-muted-foreground mt-2">
            Last scan: {new Date(stats.lastScan.started_at).toLocaleString()} -{" "}
            {stats.lastScan.total_packages} packages found
          </p>
        )}
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Packages by Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.managerCounts.map((mc) => (
                <div key={mc.manager} className="flex items-center justify-between">
                  <ManagerBadge manager={mc.manager} />
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{
                          width: `${Math.round((mc.count / stats.totalPackages) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">
                      {mc.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vulnerability Severity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.severityBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No vulnerabilities found. Run enrichment after scanning.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.severityBreakdown.map((s) => {
                  const colors: Record<string, string> = {
                    critical: "bg-red-600",
                    high: "bg-orange-500",
                    medium: "bg-yellow-500",
                    low: "bg-blue-500",
                  };
                  return (
                    <div key={s.severity} className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize min-w-[80px] justify-center">
                        {s.severity}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div
                            className={`${colors[s.severity] || "bg-muted-foreground"} rounded-full h-2`}
                            style={{
                              width: `${Math.min(Math.round((s.count / stats.totalVulnerabilities) * 100), 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-10 text-right">
                          {s.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Most Vulnerable Packages</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topVulnerable.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No vulnerable packages found. Run enrichment after scanning.
              </p>
            ) : (
              <div className="grid gap-2">
                {stats.topVulnerable.map((pkg) => (
                  <div
                    key={`${pkg.name}-${pkg.manager}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{pkg.name}</span>
                      <ManagerBadge manager={pkg.manager} />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-red-600 font-semibold">
                        {pkg.vuln_count} vulns
                      </span>
                      {pkg.trust_score !== null && (
                        <span className="text-sm text-muted-foreground">
                          Trust: {pkg.trust_score}/100
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
