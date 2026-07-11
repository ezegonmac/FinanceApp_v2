import { prisma } from "@repo/db";
import { type AssetProvider, type ExposureType } from "@repo/db";

/**
 * Resolves a provider-specific label to a canonical ExposureCategory ID.
 *
 * First checks ExposureCategoryMapping for an existing mapping. On cache miss,
 * generates a canonical key from the label, upserts the ExposureCategory, creates
 * the mapping, and returns the new category_id.
 */
export async function resolveCanonicalCategory(
  provider: AssetProvider,
  providerLabel: string,
  exposureType: ExposureType,
): Promise<number> {
  // 1. Check existing mapping
  const existing = await prisma.exposureCategoryMapping.findFirst({
    where: { provider, provider_label: providerLabel },
    include: { category: true },
  });

  if (existing) return existing.category_id;

  // 2. Auto-create canonical category + mapping
  const canonicalKey = providerLabel.toLowerCase().replace(/\s+/g, "-");
  const category = await prisma.exposureCategory.upsert({
    where: {
      type_canonical_key: {
        exposure_type: exposureType,
        canonical_key: canonicalKey,
      },
    },
    create: {
      exposure_type: exposureType,
      canonical_key: canonicalKey,
      display_name: providerLabel,
    },
    update: {},
  });

  await prisma.exposureCategoryMapping.create({
    data: {
      provider,
      provider_label: providerLabel,
      category_id: category.id,
    },
  });

  return category.id;
}
