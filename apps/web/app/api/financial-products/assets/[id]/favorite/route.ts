import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/financial-products/assets/[id]/favorite — toggle is_favorite
export async function PATCH(request: Request, { params }: RouteContext) {
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

    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: { is_favorite: !asset.is_favorite },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/financial-products/assets/[id]/favorite error:", error);
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
        Allow: "PATCH, OPTIONS",
      },
    }
  );
}
