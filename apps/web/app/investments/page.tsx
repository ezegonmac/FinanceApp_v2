import { FinancialProductsView } from "@/components/financial-products/FinancialProductsView";
import { prisma } from "@repo/db";

export default async function InvestmentsPortfolioPage() {
  let initialAssets: Awaited<ReturnType<typeof prisma.asset.findMany>> = [];
  let error = false;

  try {
    initialAssets = await prisma.asset.findMany({ orderBy: { name: "asc" } });
  } catch {
    error = true;
  }

  return (
    <div>
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load tracked assets.
        </div>
      )}

      <FinancialProductsView initialAssets={initialAssets} />
    </div>
  );
}
