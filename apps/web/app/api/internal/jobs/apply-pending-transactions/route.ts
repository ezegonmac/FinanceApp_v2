import { NextResponse } from "next/server";
import { applyPendingTransactionsForCurrentMadridMonth } from "@/app/api/_lib/jobs/applyPendingTransactions";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authorizationHeader = request.headers.get("authorization") ?? "";
  return authorizationHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await applyPendingTransactionsForCurrentMadridMonth();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to execute pending transactions job" },
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
        Allow: "POST",
      },
    }
  );
}
