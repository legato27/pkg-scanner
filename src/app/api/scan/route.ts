import { NextResponse } from "next/server";
import { runFullScan, getScanProgress } from "@/lib/scanner";
import { getDb } from "@/lib/db";

export async function GET() {
  const progress = getScanProgress();
  const db = getDb();
  const lastScan = db
    .prepare("SELECT * FROM scans ORDER BY started_at DESC LIMIT 1")
    .get();

  return NextResponse.json({ progress, lastScan });
}

export async function POST() {
  const progress = getScanProgress();
  if (progress && progress.status === "running") {
    return NextResponse.json(
      { error: "A scan is already in progress", progress },
      { status: 409 }
    );
  }

  // Run scan in background (don't await)
  runFullScan().catch((err) => {
    console.error("Scan failed:", err);
  });

  return NextResponse.json({
    message: "Scan started",
    progress: getScanProgress(),
  });
}
