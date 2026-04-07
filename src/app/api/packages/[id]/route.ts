import { NextResponse } from "next/server";
import { getDb, Package, Vulnerability, Reputation } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const pkg = db.prepare("SELECT * FROM packages WHERE id = ?").get(id) as
    | Package
    | undefined;

  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const vulnerabilities = db
    .prepare(
      "SELECT * FROM vulnerabilities WHERE package_id = ? ORDER BY severity ASC"
    )
    .all(id) as Vulnerability[];

  const reputation = db
    .prepare("SELECT * FROM reputation WHERE package_id = ?")
    .get(id) as Reputation | undefined;

  return NextResponse.json({
    package: pkg,
    vulnerabilities,
    reputation: reputation ?? null,
  });
}
