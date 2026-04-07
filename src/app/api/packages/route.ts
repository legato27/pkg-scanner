import { NextRequest, NextResponse } from "next/server";
import { getDb, Package } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const manager = searchParams.get("manager");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "name";
  const order = searchParams.get("order") || "asc";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (manager && manager !== "all") {
    conditions.push("manager = ?");
    params.push(manager);
  }

  if (search) {
    conditions.push("(name LIKE ? OR description LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const allowedSorts = ["name", "trust_score", "vuln_count", "manager", "version"];
  const sortCol = allowedSorts.includes(sort) ? sort : "name";
  const sortOrder = order === "desc" ? "DESC" : "ASC";

  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM packages ${where}`).get(...params) as {
      count: number;
    }
  ).count;

  const offset = (page - 1) * limit;
  const packages = db
    .prepare(
      `SELECT * FROM packages ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Package[];

  // Get manager counts
  const managerCounts = db
    .prepare("SELECT manager, COUNT(*) as count FROM packages GROUP BY manager")
    .all() as Array<{ manager: string; count: number }>;

  return NextResponse.json({
    packages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    managerCounts: Object.fromEntries(managerCounts.map((m) => [m.manager, m.count])),
  });
}
