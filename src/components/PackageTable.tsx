"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrustBadge, ManagerBadge, LicenseBadge } from "./TrustBadge";
import type { Package } from "@/lib/db";

type PackagesResponse = {
  packages: Package[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  managerCounts: Record<string, number>;
};

const MANAGERS = ["all", "brew", "npm", "pip", "cargo", "gem"];

export function PackageTable() {
  const [data, setData] = useState<PackagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [manager, setManager] = useState("all");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(1);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "50",
      sort,
      order,
    });
    if (manager !== "all") params.set("manager", manager);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/packages?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch packages:", err);
    } finally {
      setLoading(false);
    }
  }, [page, sort, order, manager, search]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPackages();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function toggleSort(col: string) {
    if (sort === col) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(col);
      setOrder("asc");
    }
  }

  function SortIndicator({ col }: { col: string }) {
    if (sort !== col) return null;
    return <span className="ml-1">{order === "asc" ? "\u2191" : "\u2193"}</span>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search packages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {MANAGERS.map((m) => (
            <Button
              key={m}
              variant={manager === m ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setManager(m);
                setPage(1);
              }}
            >
              {m === "all" ? "All" : m}
              {data?.managerCounts?.[m] !== undefined && ` (${data.managerCounts[m]})`}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("name")}
              >
                Name <SortIndicator col="name" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("version")}
              >
                Version <SortIndicator col="version" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("manager")}
              >
                Manager <SortIndicator col="manager" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("trust_score")}
              >
                Trust <SortIndicator col="trust_score" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("vuln_count")}
              >
                Vulns <SortIndicator col="vuln_count" />
              </TableHead>
              <TableHead>License</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading packages...
                </TableCell>
              </TableRow>
            ) : data?.packages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No packages found. Run a scan first.
                </TableCell>
              </TableRow>
            ) : (
              data?.packages.map((pkg) => (
                <TableRow key={pkg.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/packages/${pkg.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {pkg.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {pkg.version || "-"}
                  </TableCell>
                  <TableCell>
                    <ManagerBadge manager={pkg.manager} />
                  </TableCell>
                  <TableCell>
                    <TrustBadge score={pkg.trust_score} />
                  </TableCell>
                  <TableCell>
                    {pkg.vuln_count > 0 ? (
                      <span className="text-red-600 font-semibold">{pkg.vuln_count}</span>
                    ) : (
                      <span className="text-emerald-600">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <LicenseBadge type={pkg.license_type} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * data.limit + 1}-
            {Math.min(page * data.limit, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
