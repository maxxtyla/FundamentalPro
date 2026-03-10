// app/api/seasonality/route.ts
//
// Reads CSV files from:  app/data/seasonality/{symbol}_seasonality.csv
//
// GET /api/seasonality?symbol=EURUSD
// Returns JSON: { symbol, monthly: [{ month, avg_return }] }

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Missing ?symbol= param" }, { status: 400 });
  }

  // CSV lives at  app/data/seasonality/{symbol}_seasonality.csv
  const csvPath = path.join(
    process.cwd(),
    "data",
    "seasonality",
    `${symbol.toLowerCase()}_seasonality.csv`
  );

  if (!fs.existsSync(csvPath)) {
    return NextResponse.json(
      { error: `File not found: ${symbol.toLowerCase()}_seasonality.csv` },
      { status: 404 }
    );
  }

  const text = fs.readFileSync(csvPath, "utf-8");
  const lines = text.trim().split("\n").slice(1); // skip header

  const monthly = MONTH_NAMES.map((name, idx) => ({
    month: name,
    avg_return: null as number | null,
  }));

  for (const line of lines) {
    const [mStr, rStr] = line.split(",");
    const mNum = parseInt(mStr?.trim(), 10);
    const ret  = parseFloat(rStr?.trim());
    if (mNum >= 1 && mNum <= 12 && !isNaN(ret)) {
      monthly[mNum - 1].avg_return = ret;
    }
  }

  return NextResponse.json({ symbol: symbol.toUpperCase(), monthly });
}