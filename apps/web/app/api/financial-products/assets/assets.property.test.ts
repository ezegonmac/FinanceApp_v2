import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

/**
 * In-memory store simulating the assets table.
 * The mock functions mutate this store so the route handlers
 * can read and write state across multiple calls.
 */
let assetStore: Array<{
  id: number;
  ticker: string;
  name: string;
  asset_type: string;
  price_frequency: string;
  currency: string;
  isin: string | null;
  created_at: Date;
}> = [];
let nextId = 1;

vi.mock("@repo/db", () => ({
  prisma: {
    asset: {
      findMany: vi.fn(({ orderBy }: { orderBy?: { name: string } }) => {
        const sorted = [...assetStore].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        return Promise.resolve(sorted);
      }),
      findUnique: vi.fn(
        ({ where }: { where: { ticker?: string; id?: number } }) => {
          if (where.ticker) {
            return Promise.resolve(
              assetStore.find((a) => a.ticker === where.ticker) ?? null,
            );
          }
          if (where.id) {
            return Promise.resolve(
              assetStore.find((a) => a.id === where.id) ?? null,
            );
          }
          return Promise.resolve(null);
        },
      ),
      create: vi.fn(
        ({
          data,
        }: {
          data: {
            ticker: string;
            name: string;
            asset_type: string;
            price_frequency: string;
            currency: string;
            isin: string | null;
          };
        }) => {
          const asset = {
            id: nextId++,
            ...data,
            created_at: new Date(),
          };
          assetStore.push(asset);
          return Promise.resolve(asset);
        },
      ),
      delete: vi.fn(({ where }: { where: { id: number } }) => {
        const idx = assetStore.findIndex((a) => a.id === where.id);
        if (idx === -1) return Promise.resolve(null);
        const [removed] = assetStore.splice(idx, 1);
        return Promise.resolve(removed);
      }),
    },
  },
}));

import { GET, POST } from "./route";
import { DELETE } from "./[id]/route";

function createPostRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/financial-products/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createDeleteRequest(id: number) {
  return new Request(
    `http://localhost/api/financial-products/assets/${id}`,
    { method: "DELETE" },
  );
}

function createDeleteContext(id: number): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id: String(id) }) };
}

describe("Assets API - Property 6: Tracked asset list is consistent after add/delete", () => {
  /**
   * **Validates: Requirements 2.1, 2.5, 3.1**
   *
   * Property 6: For any sequence of track (POST /assets) and untrack
   * (DELETE /assets/[id]) operations, the GET /assets response SHALL
   * contain exactly the assets that were tracked and not subsequently
   * deleted, in name-ascending order, regardless of operation order.
   */
  beforeEach(() => {
    assetStore = [];
    nextId = 1;
  });

  it("GET /assets returns exactly the non-deleted assets sorted by name ascending", async () => {
    // Arbitrary to generate unique tickers for track operations, then
    // randomly decide which ones to delete afterwards.
    const operationsArb = fc.record({
      assets: fc.uniqueArray(
        fc.record({
          ticker: fc.stringMatching(/^[A-Z][A-Z0-9]{0,4}$/),
          name: fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) => s.trim().length > 0,
          ),
        }),
        { minLength: 1, maxLength: 8, selector: (a) => a.ticker },
      ),
      deleteFlags: fc.array(fc.boolean(), {
        minLength: 8,
        maxLength: 8,
      }),
    });

    await fc.assert(
      fc.asyncProperty(operationsArb, async ({ assets, deleteFlags }) => {
        // Reset store for each iteration
        assetStore = [];
        nextId = 1;

        // Track all generated assets via POST
        const createdAssets: Array<{
          id: number;
          ticker: string;
          name: string;
        }> = [];

        for (const asset of assets) {
          const req = createPostRequest({
            ticker: asset.ticker,
            name: asset.name,
            asset_type: "ETF",
            price_frequency: "DAILY",
            currency: "USD",
            isin: null,
          });

          const res = await POST(req);
          expect(res.status).toBe(200);

          const body = await res.json();
          createdAssets.push({
            id: body.id,
            ticker: body.ticker,
            name: body.name,
          });
        }

        // Delete some assets based on deleteFlags
        const deletedIds = new Set<number>();
        for (let i = 0; i < assets.length; i++) {
          if (deleteFlags[i]) {
            const assetToDelete = createdAssets[i]!;
            const req = createDeleteRequest(assetToDelete.id);
            const ctx = createDeleteContext(assetToDelete.id);
            const res = await DELETE(req, ctx);
            expect(res.status).toBe(204);
            deletedIds.add(assetToDelete.id);
          }
        }

        // Call GET /assets
        const getRes = await GET();
        expect(getRes.status).toBe(200);

        const listedAssets: Array<{ id: number; name: string; ticker: string }> =
          await getRes.json();

        // Compute expected: tracked - deleted, sorted by name ASC
        const expectedAssets = createdAssets
          .filter((a) => !deletedIds.has(a.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        // Assert count matches
        expect(listedAssets.length).toBe(expectedAssets.length);

        // Assert exact match in order
        for (let i = 0; i < expectedAssets.length; i++) {
          expect(listedAssets[i]!.id).toBe(expectedAssets[i]!.id);
          expect(listedAssets[i]!.ticker).toBe(expectedAssets[i]!.ticker);
          expect(listedAssets[i]!.name).toBe(expectedAssets[i]!.name);
        }

        // Assert name-ascending order
        for (let i = 1; i < listedAssets.length; i++) {
          expect(
            listedAssets[i - 1]!.name.localeCompare(listedAssets[i]!.name),
          ).toBeLessThanOrEqual(0);
        }
      }),
      { numRuns: 100 },
    );
  });
});
