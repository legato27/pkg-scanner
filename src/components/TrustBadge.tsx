"use client";

import { Badge } from "@/components/ui/badge";

export function TrustBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Not scored
      </Badge>
    );
  }

  if (score >= 80) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-100">
        {score}/100
      </Badge>
    );
  }

  if (score >= 50) {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-100">
        {score}/100
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100">
      {score}/100
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-600 text-white hover:bg-red-600",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-orange-100",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100",
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100",
  };

  return (
    <Badge className={colors[severity] || "bg-muted text-muted-foreground"}>
      {severity}
    </Badge>
  );
}

export function ManagerBadge({ manager }: { manager: string }) {
  const colors: Record<string, string> = {
    brew: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    npm: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    pip: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    cargo: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    gem: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800",
  };

  return (
    <Badge variant="outline" className={colors[manager] || ""}>
      {manager}
    </Badge>
  );
}

export function LicenseBadge({ type }: { type: string | null }) {
  if (!type || type === "unknown") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Unknown
      </Badge>
    );
  }

  const colors: Record<string, string> = {
    permissive: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
    copyleft: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
    proprietary: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300",
  };

  return (
    <Badge variant="outline" className={colors[type] || ""}>
      {type}
    </Badge>
  );
}
