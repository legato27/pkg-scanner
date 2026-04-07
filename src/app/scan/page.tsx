"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type ScanProgress = {
  scanId: string;
  status: "running" | "completed" | "failed";
  currentScanner: string;
  packagesFound: number;
  scannersCompleted: number;
  totalScanners: number;
};

type ScanStatus = {
  progress: ScanProgress | null;
  lastScan: {
    id: string;
    started_at: string;
    completed_at: string | null;
    status: string;
    total_packages: number;
  } | null;
};

type EnrichStatus = {
  enriching: boolean;
};

export default function ScanPage() {
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [enrichStatus, setEnrichStatus] = useState<EnrichStatus>({ enriching: false });
  const [scanning, setScanning] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchStatus() {
    try {
      const [scanRes, enrichRes] = await Promise.all([
        fetch("/api/scan"),
        fetch("/api/enrich"),
      ]);
      const scanData = await scanRes.json();
      const enrichData = await enrichRes.json();
      setStatus(scanData);
      setEnrichStatus(enrichData);

      if (scanData.progress?.status === "running") {
        setScanning(true);
      } else {
        setScanning(false);
      }

      if (enrichData.enriching) {
        setEnriching(true);
      } else {
        setEnriching(false);
      }
    } catch (err) {
      console.error("Failed to fetch status:", err);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (scanning || enriching) {
      pollRef.current = setInterval(fetchStatus, 1500);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [scanning, enriching]);

  async function startScan() {
    setScanning(true);
    try {
      await fetch("/api/scan", { method: "POST" });
      fetchStatus();
    } catch (err) {
      console.error("Failed to start scan:", err);
      setScanning(false);
    }
  }

  async function startEnrichment() {
    setEnriching(true);
    try {
      await fetch("/api/enrich", { method: "POST" });
      fetchStatus();
    } catch (err) {
      console.error("Failed to start enrichment:", err);
      setEnriching(false);
    }
  }

  const progress = status?.progress;
  const scanPercent = progress
    ? Math.round((progress.scannersCompleted / progress.totalScanners) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Security Scan</h2>
        <p className="text-muted-foreground mt-1">
          Scan your system for installed packages and check their security status
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Step 1: Package Discovery */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                1
              </span>
              Package Discovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan all installed packages from brew, npm, pip, cargo, and gem.
              This inventories what&apos;s on your system.
            </p>

            {scanning && progress ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Scanning: <strong>{progress.currentScanner}</strong>
                  </span>
                  <span className="font-medium">{scanPercent}%</span>
                </div>
                <Progress value={scanPercent} />
                <p className="text-xs text-muted-foreground">
                  {progress.packagesFound} packages found so far
                </p>
              </div>
            ) : (
              <Button onClick={startScan} disabled={scanning} className="w-full">
                {scanning ? "Scanning..." : "Run Package Scan"}
              </Button>
            )}

            {status?.lastScan && !scanning && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Last scan:</p>
                <p className="text-sm font-medium">
                  {status.lastScan.total_packages} packages found
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(status.lastScan.started_at).toLocaleString()} -{" "}
                  <span
                    className={
                      status.lastScan.status === "completed"
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  >
                    {status.lastScan.status}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Trust Enrichment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                2
              </span>
              Trust Enrichment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Check each package against vulnerability databases (OSV.dev),
              fetch reputation data, classify licenses, and calculate trust scores.
            </p>

            {enriching ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Enriching package data... This may take a few minutes.
                  </span>
                </div>
                <Progress value={50} className="animate-pulse" />
              </div>
            ) : (
              <Button
                onClick={startEnrichment}
                disabled={enriching || !status?.lastScan}
                variant="outline"
                className="w-full"
              >
                {enriching
                  ? "Enriching..."
                  : !status?.lastScan
                    ? "Run scan first"
                    : "Run Trust Enrichment"}
              </Button>
            )}

            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">What this checks:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>Known CVEs via OSV.dev</li>
                <li>GitHub stars and download counts</li>
                <li>License classification (permissive/copyleft)</li>
                <li>Composite trust score calculation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How Scanning Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">1. Discovery</h4>
              <p className="text-xs text-muted-foreground">
                We run <code className="bg-muted px-1 rounded">brew info</code>,{" "}
                <code className="bg-muted px-1 rounded">npm list -g</code>,{" "}
                <code className="bg-muted px-1 rounded">pip list</code>, and similar
                commands to inventory every installed package.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">2. Vulnerability Check</h4>
              <p className="text-xs text-muted-foreground">
                Each package + version is queried against OSV.dev, which aggregates
                CVEs, GitHub Security Advisories, and ecosystem-specific databases.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">3. Trust Score</h4>
              <p className="text-xs text-muted-foreground">
                A composite 0-100 trust score combines vulnerability count, severity,
                license type, popularity, and metadata completeness.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
