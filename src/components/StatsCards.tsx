"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatsData = {
  totalPackages: number;
  vulnerablePackages: number;
  totalVulnerabilities: number;
  criticalVulns: number;
  avgTrustScore: number | null;
};

export function StatsCards({ stats }: { stats: StatsData }) {
  const cards = [
    {
      title: "Total Packages",
      value: stats.totalPackages,
      description: "Across all managers",
      color: "text-foreground",
    },
    {
      title: "Vulnerable",
      value: stats.vulnerablePackages,
      description: `${stats.totalVulnerabilities} total vulns`,
      color: stats.vulnerablePackages > 0 ? "text-red-600" : "text-emerald-600",
    },
    {
      title: "Critical CVEs",
      value: stats.criticalVulns,
      description: "Immediate attention needed",
      color: stats.criticalVulns > 0 ? "text-red-600" : "text-emerald-600",
    },
    {
      title: "Avg Trust Score",
      value: stats.avgTrustScore !== null ? `${stats.avgTrustScore}/100` : "N/A",
      description: "Across all packages",
      color:
        stats.avgTrustScore !== null && stats.avgTrustScore >= 70
          ? "text-emerald-600"
          : "text-amber-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
