import { NextResponse } from "next/server";
import { featuredListings } from "@/lib/mock";

export async function GET() {
  return NextResponse.json({ listings: featuredListings });
}
