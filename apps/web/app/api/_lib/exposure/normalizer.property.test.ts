import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

/** Feature: portfolio-exposure, Property 5: Category normalization idempotency */

/**
 * In-memory stores simulating ExposureCategory and ExposureCategoryMapping tables.
 * The mock functions mutate these stores so resolveCanonicalCategory can read and
 * write state across multiple calls within the same test iteration.
 */
let categoryStore: Array<{
  id: number;
  exposure_type: string;
  canonical_key: string;
  display_name: string;
}> = [];

let mappingStore: Array<{
  id: number;
  provider: string;
  provider_label: string;
  category_id: number;
  category: (typeof categoryStore)[number];
}> = [];

let nextCategoryId = 1;
let nextMappingId = 1;

vi.mock("@repo/db", () => {
  return {
    prisma: {
      exposureCategoryMapping: {
        findFirst: vi.fn(({ where }: { where: { provider: string; provider_label: string } }) => {
          const found = mappingStore.find(
            (m) => m.provider === where.provider && m.provider_label === where.provider_label,
          );
          return Promise.resolve(found ?? null);
        }),
        create: vi.fn(({ data }: { data: { provider: string; provider_label: string; category_id: number } }) => {
          const category = categoryStore.find((c) => c.id === data.category_id);
          const record = {
            id: nextMappingId++,
            provider: data.provider,
            provider_label: data.provider_label,
            category_id: data.category_id,
            category: category!,
          };
          mappingStore.push(record);
          return Promise.resolve(record);
        }),
      },
      exposureCategory: {
        upsert: vi.fn(
          ({
            where,
            create,
          }: {
            where: { type_canonical_key: { exposure_type: string; canonical_key: string } };
            create: { exposure_type: string; canonical_key: string; display_name: string };
            update: Record<string, unknown>;
          }) => {
            const existing = categoryStore.find(
              (c) =>
                c.exposure_type === where.type_canonical_key.exposure_type &&
                c.canonical_key === where.type_canonical_key.canonical_key,
            );
            if (existing) return Promise.resolve(existing);

            const record = {
              id: nextCategoryId++,
              exposure_type: create.exposure_type,
              canonical_key: create.canonical_key,
              display_name: create.display_name,
            };
            categoryStore.push(record);
            return Promise.resolve(record);
          },
        ),
      },
    },
  };
});

import { resolveCanonicalCategory } from "./normalizer";

describe("resolveCanonicalCategory - Property 5: Category normalization idempotency", () => {
  /**
   * **Validates: Requirements 3.1, 3.3**
   *
   * Property 5: For any provider label string, resolving it to a canonical
   * category multiple times SHALL always return the same category_id.
   * If the label has no existing mapping, a new ExposureCategory and
   * ExposureCategoryMapping SHALL be created on first resolution and reused
   * on subsequent resolutions.
   */
  beforeEach(() => {
    categoryStore = [];
    mappingStore = [];
    nextCategoryId = 1;
    nextMappingId = 1;
  });

  it("resolving the same label multiple times always returns the same category_id", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (label) => {
          // Reset stores for each iteration
          categoryStore = [];
          mappingStore = [];
          nextCategoryId = 1;
          nextMappingId = 1;

          // First call: creates the category and mapping
          const firstResult = await resolveCanonicalCategory(
            "YAHOO_FINANCE" as never,
            label,
            "SECTOR" as never,
          );

          // Second call: should find the existing mapping
          const secondResult = await resolveCanonicalCategory(
            "YAHOO_FINANCE" as never,
            label,
            "SECTOR" as never,
          );

          // Both calls must return the same category_id
          expect(firstResult).toBe(secondResult);
          expect(typeof firstResult).toBe("number");
        },
      ),
      { numRuns: 100 },
    );
  });
});
