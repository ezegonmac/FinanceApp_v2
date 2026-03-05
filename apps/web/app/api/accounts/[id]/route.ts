import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // recommended with Prisma

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Invalid ID" },
      { status: 400 }
    );
  }

  const accountId = Number(id);

  if (Number.isNaN(accountId)) {
    return NextResponse.json(
      { error: "ID must be a number" },
      { status: 400 }
    );
  }

  try {
    const account = await prisma.account.findUnique({
        where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(account, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}