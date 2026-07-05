import { FinancialProductsView } from "@/components/financial-products/FinancialProductsView";
import { prisma } from "@repo/db";

export default async function FinancialProductsPage() {
  let initialAssets: Awaited<ReturnType<typeof prisma.asset.findMany>> = [];
  let error = false;

  try {
    initialAssets = await prisma.asset.findMany({ orderBy: { name: "asc" } });
  } catch {
    error = true;
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Financial Products
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search, track, and monitor financial assets.
        </p>
      </header>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load tracked assets.
        </div>
      )}

      <FinancialProductsView initialAssets={initialAssets} />
    </section>
  );
}
