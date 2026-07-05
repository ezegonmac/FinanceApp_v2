import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recalculateMonthSnapshot } from "@/app/api/_lib/snapshots/recalculateMonthSnapshot";
import { syncPrices } from "@/app/api/_lib/financialProducts/priceSyncAlgorithm";

export const dynamic = "force-dynamic";

const cancelSchema = z.object({
  investment_id: z.number().int().positive(),
  action: z.literal("cancel"),
});

// Two input modes:
// 1. Manual: units + unit_price provided → total_amount = units × unit_price
// 2. Amount: total_amount + executed_at provided → look up price at date → derive units & unit_price
const investmentSchema = z
  .object({
    asset_id: z.number().int().positive(),
    type: z.enum(["BUY", "SELL"]),
    units: z.number().positive().optional(),
    unit_price: z.number().positive().optional(),
    total_amount: z.number().positive().optional(),
    executed_at: z.string().optional(),
    description: z.string().optional(),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
  })
  .refine(
    (data) => {
      // Either manual mode (units + unit_price) or amount mode (total_amount)
      const hasManual = data.units != null && data.unit_price != null;
      const hasAmount = data.total_amount != null;
      return hasManual || hasAmount;
    },
    { message: "Provide either (units + unit_price) or total_amount" }
  );

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/accounts/:id/investments
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const url = new URL(request.url);
    const assetIdParam = url.searchParams.get("asset_id");
    const assetId = assetIdParam ? Number(assetIdParam) : null;
    const cursorParam = url.searchParams.get("cursor");
    const cursor = cursorParam ? Number(cursorParam) : null;
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "30"), 100);

    const where = {
      account_id: accountId,
      ...(assetId != null ? { asset_id: assetId } : {}),
    };

    const orderBy = [
      { month: { year: "desc" as const } },
      { month: { month: "desc" as const } },
      { created_at: "desc" as const },
      { id: "desc" as const },
    ];

    const [items, total] = await Promise.all([
      prisma.investment.findMany({
        where,
        orderBy,
        include: { month: true, asset: true },
        take: limit + 1,
        ...(cursor != null ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.investment.count({ where }),
    ]);

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1]!.id : null;

    return NextResponse.json({ data, total, nextCursor }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch investments" }, { status: 500 });
  }
}

// POST /api/accounts/:id/investments
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = investmentSchema.parse(body);

    // Verify account exists
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Verify asset exists (with provider mapping for potential price sync)
    const asset = await prisma.asset.findUnique({
      where: { id: parsed.asset_id },
      select: { id: true, providerMappings: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Resolve units, unit_price, and total_amount depending on input mode
    let finalUnits: number;
    let finalUnitPrice: number;
    let totalAmount: number;

    if (parsed.units != null && parsed.unit_price != null) {
      // Manual mode: units + unit_price provided
      finalUnits = parsed.units;
      finalUnitPrice = parsed.unit_price;
      totalAmount = Math.round(finalUnits * finalUnitPrice * 100) / 100;
    } else if (parsed.total_amount != null) {
      // Amount mode: total_amount provided, look up price at executed_at date
      if (!parsed.executed_at) {
        return NextResponse.json(
          { error: "executed_at is required when providing total_amount without units/unit_price" },
          { status: 400 }
        );
      }

      const executedDate = new Date(parsed.executed_at.includes("T") ? parsed.executed_at : `${parsed.executed_at}T00:00:00.000Z`);

      // Sync daily prices around the executed date so we have data available
      const yahooMapping = asset.providerMappings.find(
        (m: { provider: string }) => m.provider === "YAHOO_FINANCE"
      );
      if (yahooMapping) {
        const syncFrom = new Date(executedDate);
        syncFrom.setDate(syncFrom.getDate() - 5); // a few days buffer
        const syncTo = new Date(executedDate);
        syncTo.setDate(syncTo.getDate() + 1);
        try {
          await syncPrices(
            { id: parsed.asset_id, ticker: yahooMapping.provider_symbol },
            "DAILY",
            "1d",
            syncFrom,
            syncTo,
          );
        } catch {
          // Non-fatal: if sync fails, we'll still try the DB lookup
        }
      }

      // Find the price for the exact date (start of day), or the closest one before it
      const endOfDay = new Date(executedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const priceRecord = await prisma.assetPrice.findFirst({
        where: {
          asset_id: parsed.asset_id,
          timestamp: { gte: executedDate, lte: endOfDay },
        },
        orderBy: { timestamp: "asc" },
        select: { price: true, timestamp: true },
      });

      // If no price for that exact date, fall back to the closest price before it
      const finalPriceRecord = priceRecord ?? await prisma.assetPrice.findFirst({
        where: {
          asset_id: parsed.asset_id,
          timestamp: { lt: executedDate },
        },
        orderBy: { timestamp: "desc" },
        select: { price: true, timestamp: true },
      });

      if (!finalPriceRecord) {
        return NextResponse.json(
          { error: "No price data available for this asset on or before the specified date" },
          { status: 400 }
        );
      }

      finalUnitPrice = Number(finalPriceRecord.price);
      totalAmount = parsed.total_amount;
      finalUnits = Math.round((totalAmount / finalUnitPrice) * 1_000_000) / 1_000_000;
    } else {
      // Should not reach here due to Zod refine, but just in case
      return NextResponse.json(
        { error: "Provide either (units + unit_price) or total_amount" },
        { status: 400 }
      );
    }

    // Upsert Month record
    const monthRecord = await prisma.month.upsert({
      where: {
        year_month: {
          year: parsed.year,
          month: parsed.month,
        },
      },
      update: {},
      create: {
        year: parsed.year,
        month: parsed.month,
      },
    });

    // Classify month as current/past or future
    const { year: currentYear, month: currentMonth } = getEuropeMadridDateParts();

    const isCurrentMonth =
      monthRecord.year === currentYear && monthRecord.month === currentMonth;

    const isPreviousMonth =
      monthRecord.year < currentYear ||
      (monthRecord.year === currentYear && monthRecord.month < currentMonth);

    const isEffectiveNow = isCurrentMonth || isPreviousMonth;

    // For SELL: validate sufficient units held
    if (parsed.type === "SELL") {
      const buyUnits = await prisma.investment.aggregate({
        where: { account_id: accountId, asset_id: parsed.asset_id, status: "COMPLETED", type: "BUY" },
        _sum: { units: true },
      });
      const sellUnits = await prisma.investment.aggregate({
        where: { account_id: accountId, asset_id: parsed.asset_id, status: "COMPLETED", type: "SELL" },
        _sum: { units: true },
      });
      const availableUnits = Number(buyUnits._sum.units ?? 0) - Number(sellUnits._sum.units ?? 0);

      if (availableUnits < finalUnits) {
        return NextResponse.json(
          { error: "Insufficient units", available: availableUnits.toString() },
          { status: 400 }
        );
      }
    }

    let newInvestment;

    if (isEffectiveNow) {
      // Current/past month: create COMPLETED in $transaction, update balance
      const executedAtDate = parsed.executed_at
        ? new Date(parsed.executed_at.includes("T") ? parsed.executed_at : `${parsed.executed_at}T00:00:00.000Z`)
        : new Date();

      newInvestment = await prisma.$transaction(async (tx) => {
        const investment = await tx.investment.create({
          data: {
            account_id: accountId,
            asset_id: parsed.asset_id,
            month_id: monthRecord.id,
            type: parsed.type,
            units: finalUnits,
            unit_price: finalUnitPrice,
            total_amount: totalAmount,
            description: parsed.description ?? null,
            status: "COMPLETED",
            executed_at: executedAtDate,
            processed_at: new Date(),
          },
        });

        if (parsed.type === "BUY") {
          await tx.account.update({
            where: { id: accountId },
            data: { balance: { decrement: totalAmount } },
          });
        } else {
          await tx.account.update({
            where: { id: accountId },
            data: { balance: { increment: totalAmount } },
          });
        }

        return investment;
      });

      await recalculateMonthSnapshot(accountId, monthRecord.id);
    } else {
      // Future month: create PENDING, no balance change
      const executedAtDate = parsed.executed_at
        ? new Date(parsed.executed_at.includes("T") ? parsed.executed_at : `${parsed.executed_at}T00:00:00.000Z`)
        : null;

      newInvestment = await prisma.investment.create({
        data: {
          account_id: accountId,
          asset_id: parsed.asset_id,
          month_id: monthRecord.id,
          type: parsed.type,
          units: finalUnits,
          unit_price: finalUnitPrice,
          total_amount: totalAmount,
          description: parsed.description ?? null,
          status: "PENDING",
          executed_at: executedAtDate,
        },
      });
    }

    return NextResponse.json(newInvestment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create investment" },
      { status: 500 }
    );
  }
}

// OPTIONS /api/accounts/:id/investments
export function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 405,
      headers: {
        Allow: "GET, POST, PATCH",
      },
    }
  );
}


// PATCH /api/accounts/:id/investments (cancel)
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = cancelSchema.parse(body);

    // Find the investment and verify it belongs to the account
    const investment = await prisma.investment.findFirst({
      where: { id: parsed.investment_id, account_id: accountId },
    });

    if (!investment) {
      return NextResponse.json({ error: "Investment not found" }, { status: 404 });
    }

    // Already cancelled → 400
    if (investment.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Investment is already cancelled" },
        { status: 400 }
      );
    }

    let updatedInvestment;

    if (investment.status === "PENDING") {
      // PENDING: set CANCELLED, no balance change
      updatedInvestment = await prisma.investment.update({
        where: { id: investment.id },
        data: { status: "CANCELLED" },
      });
    } else {
      // COMPLETED: in $transaction set CANCELLED and reverse balance
      updatedInvestment = await prisma.$transaction(async (tx) => {
        const updated = await tx.investment.update({
          where: { id: investment.id },
          data: { status: "CANCELLED" },
        });

        if (investment.type === "BUY") {
          // BUY was a deduction, so reverse = increment
          await tx.account.update({
            where: { id: accountId },
            data: { balance: { increment: investment.total_amount } },
          });
        } else {
          // SELL was an increment, so reverse = decrement
          await tx.account.update({
            where: { id: accountId },
            data: { balance: { decrement: investment.total_amount } },
          });
        }

        return updated;
      });

      await recalculateMonthSnapshot(accountId, investment.month_id);
    }

    return NextResponse.json(updatedInvestment, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to cancel investment" },
      { status: 500 }
    );
  }
}
