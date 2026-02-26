import { NextRequest, NextResponse } from "next/server";
import { getAPOD } from "@/lib/nasa";

export const dynamic = "force-dynamic";

/**
 * GET /api/apod
 *
 * Fetch NASA Astronomy Picture of the Day
 *
 * Query params:
 * - date: Optional date in YYYY-MM-DD format
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || undefined;

    const apod = await getAPOD(date);

    return NextResponse.json(apod, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200"
      }
    });
  } catch (error) {
    console.error("[api/apod] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch APOD" },
      { status: 500 }
    );
  }
}
