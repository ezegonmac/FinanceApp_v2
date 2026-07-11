import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { getEuropeMadridDateParts } from "@repo/utils";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/financial-products/assets/[id]/exposure
// Returns sector and country exposure for the asset in the current period
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const assetId = parseInt(id, 10);

    if (isNaN(assetId)) {
      return NextResponse.json(
        { error: "Invalid asset id" },
        { status: 400 }
      );
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    // Get current period (YYYY-MM)
    const { year, month } = getEuropeMadridDateParts();
    const period = `${year}-${String(month).padStart(2, "0")}`;

    const snapshots = await prisma.assetExposureSnapshot.findMany({
      where: { asset_id: assetId, period },
      include: { category: true },
      orderBy: { percentage: "desc" },
    });

    const sectors = snapshots
      .filter((s) => s.category.exposure_type === "SECTOR")
      .map((s) => ({
        categoryName: s.category.display_name,
        percentage: Number(s.percentage),
      }));

    const countries = snapshots
      .filter((s) => s.category.exposure_type === "COUNTRY")
      .map((s) => ({
        categoryName: s.category.display_name,
        percentage: Number(s.percentage),
      }));

    return NextResponse.json({ sectors, countries }, { status: 200 });
  } catch (error) {
    console.error("GET /api/financial-products/assets/[id]/exposure error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 405,
      headers: {
        Allow: "GET, OPTIONS",
      },
    }
  );
}
