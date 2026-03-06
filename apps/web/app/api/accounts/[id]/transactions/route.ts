import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic"; // recommended with Prisma

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/accounts/:id/transactions
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    console.log("Fetching transactions for account ID:", accountId);

    const transactions = await prisma.transaction.findMany({
      where: {  OR: [
        { from_account_id: accountId },
        { to_account_id: accountId },
      ]},
    });

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 405,
      headers: {
        Allow: "GET",
      },
    }
  );
}