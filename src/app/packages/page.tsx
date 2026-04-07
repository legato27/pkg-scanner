"use client";

import { PackageTable } from "@/components/PackageTable";

export default function PackagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Packages</h2>
        <p className="text-muted-foreground mt-1">
          All installed packages across your system
        </p>
      </div>
      <PackageTable />
    </div>
  );
}
