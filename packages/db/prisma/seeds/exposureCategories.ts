import { prisma } from "../../src/client";

/**
 * Seed script for ExposureCategory and ExposureCategoryMapping records.
 *
 * Seeds canonical categories for common Yahoo Finance sector and country labels.
 * Uses upsert for idempotency — safe to run multiple times.
 *
 * Run with: npx tsx packages/db/prisma/seeds/exposureCategories.ts
 */

interface SeedEntry {
  canonicalKey: string;
  displayName: string;
  providerLabel: string;
}

const SECTOR_ENTRIES: SeedEntry[] = [
  { canonicalKey: "technology", displayName: "Technology", providerLabel: "Technology" },
  { canonicalKey: "healthcare", displayName: "Healthcare", providerLabel: "Healthcare" },
  { canonicalKey: "financial-services", displayName: "Financial Services", providerLabel: "Financial Services" },
  { canonicalKey: "consumer-cyclical", displayName: "Consumer Cyclical", providerLabel: "Consumer Cyclical" },
  { canonicalKey: "communication-services", displayName: "Communication Services", providerLabel: "Communication Services" },
  { canonicalKey: "industrials", displayName: "Industrials", providerLabel: "Industrials" },
  { canonicalKey: "consumer-defensive", displayName: "Consumer Defensive", providerLabel: "Consumer Defensive" },
  { canonicalKey: "energy", displayName: "Energy", providerLabel: "Energy" },
  { canonicalKey: "real-estate", displayName: "Real Estate", providerLabel: "Real Estate" },
  { canonicalKey: "basic-materials", displayName: "Basic Materials", providerLabel: "Basic Materials" },
  { canonicalKey: "utilities", displayName: "Utilities", providerLabel: "Utilities" },
];

const COUNTRY_ENTRIES: SeedEntry[] = [
  { canonicalKey: "united-states", displayName: "United States", providerLabel: "United States" },
  { canonicalKey: "china", displayName: "China", providerLabel: "China" },
  { canonicalKey: "japan", displayName: "Japan", providerLabel: "Japan" },
  { canonicalKey: "united-kingdom", displayName: "United Kingdom", providerLabel: "United Kingdom" },
  { canonicalKey: "germany", displayName: "Germany", providerLabel: "Germany" },
  { canonicalKey: "france", displayName: "France", providerLabel: "France" },
  { canonicalKey: "canada", displayName: "Canada", providerLabel: "Canada" },
  { canonicalKey: "australia", displayName: "Australia", providerLabel: "Australia" },
  { canonicalKey: "switzerland", displayName: "Switzerland", providerLabel: "Switzerland" },
  { canonicalKey: "netherlands", displayName: "Netherlands", providerLabel: "Netherlands" },
  { canonicalKey: "india", displayName: "India", providerLabel: "India" },
  { canonicalKey: "south-korea", displayName: "South Korea", providerLabel: "South Korea" },
  { canonicalKey: "brazil", displayName: "Brazil", providerLabel: "Brazil" },
  { canonicalKey: "taiwan", displayName: "Taiwan", providerLabel: "Taiwan" },
];

async function seedExposureCategories() {
  console.log("Seeding exposure categories and mappings...");

  let sectorsCreated = 0;
  let countriesCreated = 0;
  let mappingsCreated = 0;

  // Seed SECTOR categories + mappings
  for (const entry of SECTOR_ENTRIES) {
    const category = await prisma.exposureCategory.upsert({
      where: {
        type_canonical_key: {
          exposure_type: "SECTOR",
          canonical_key: entry.canonicalKey,
        },
      },
      create: {
        exposure_type: "SECTOR",
        canonical_key: entry.canonicalKey,
        display_name: entry.displayName,
      },
      update: {},
    });

    sectorsCreated++;

    // Upsert the Yahoo Finance mapping
    await prisma.exposureCategoryMapping.upsert({
      where: {
        provider_label_category: {
          provider: "YAHOO_FINANCE",
          provider_label: entry.providerLabel,
          category_id: category.id,
        },
      },
      create: {
        provider: "YAHOO_FINANCE",
        provider_label: entry.providerLabel,
        category_id: category.id,
      },
      update: {},
    });

    mappingsCreated++;
  }

  // Seed COUNTRY categories + mappings
  for (const entry of COUNTRY_ENTRIES) {
    const category = await prisma.exposureCategory.upsert({
      where: {
        type_canonical_key: {
          exposure_type: "COUNTRY",
          canonical_key: entry.canonicalKey,
        },
      },
      create: {
        exposure_type: "COUNTRY",
        canonical_key: entry.canonicalKey,
        display_name: entry.displayName,
      },
      update: {},
    });

    countriesCreated++;

    // Upsert the Yahoo Finance mapping
    await prisma.exposureCategoryMapping.upsert({
      where: {
        provider_label_category: {
          provider: "YAHOO_FINANCE",
          provider_label: entry.providerLabel,
          category_id: category.id,
        },
      },
      create: {
        provider: "YAHOO_FINANCE",
        provider_label: entry.providerLabel,
        category_id: category.id,
      },
      update: {},
    });

    mappingsCreated++;
  }

  console.log(`✓ Seeded ${sectorsCreated} sector categories`);
  console.log(`✓ Seeded ${countriesCreated} country categories`);
  console.log(`✓ Seeded ${mappingsCreated} provider mappings (Yahoo Finance)`);
}

seedExposureCategories()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
