// Seeds the DB with ~750 real product listings sampled from Bright Data's
// public eCommerce-dataset-samples (Amazon, Walmart, Shein, Shopee, Lazada),
// pre-normalized by prisma/normalize-dataset.py into prisma/products.seed.json.
//
// Run with: npm run prisma:seed:marketplace
//
// This is intentionally a separate script from prisma/seed.ts (which stays
// untouched) so the two can be run independently.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { prisma } from '../src/lib/prisma.js'
import { hashPassword } from "../src/utils/password.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface SeedReview {
  name: string;
  title: string;
  content: string;
  rating: number;
}

interface SeedProduct {
  title: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  currency: string;
  rating: number | null;
  brand: string | null;
  categoryPath: string[];
  category: string;
  images: string[];
  sku: string | null;
  sourceUrl: string | null;
  sourceMarketplace: "Admin";
  sellerName: string;
  colors: string[];
  sizes: string[];
  deliveryInfo: string[];
  specs: string[];
  inStock: number;
  reviews: SeedReview[];
}

const Admin = { email: "nharnahadjei@gmail.com", firstName: "David", lastName: "Adjei" }

async function getOrCreateMarketplaceSeller() {
  return prisma.user.upsert({
    where: { email: Admin.email },
    update: {},
    create: {
      firstName: Admin.firstName,
      lastName: Admin.lastName,
      email: Admin.email,
      password: await hashPassword("DAyd@2910"),
      role: "SELLER",
      registrationStep: 0,
      verified: true,
    },
  });
}

async function getOrCreateCategory(title: string, cache: Map<string, string>) {
  const cached = cache.get(title);
  if (cached) return cached;

  const category = await prisma.category.upsert({
    where: { title },
    update: {},
    create: { title },
  });
  cache.set(title, category.id);
  return category.id;
}

async function main() {
  const raw = readFileSync(path.join(__dirname, "products.seed.json"), "utf-8");
  const products: SeedProduct[] = JSON.parse(raw);

  console.log(`Loaded ${products.length} products from products.seed.json`);

  const user = await getOrCreateMarketplaceSeller();

  const categoryIdCache = new Map<string, string>();
  // Track distinct brands seen per category while inserting, so we can
  // build each category's Brand filter afterwards without a second
  // full pass over the (large) product list.
  const brandsByCategory = new Map<string, Map<string, number>>();

  let created = 0;
  for (const [index, p] of products.entries()) {
    const categoryId = await getOrCreateCategory(p.category, categoryIdCache);
    const sellerId = user.id!;

    if (p.brand) {
      const counts = brandsByCategory.get(categoryId) ?? new Map<string, number>();
      counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
      brandsByCategory.set(categoryId, counts);
    }

    // A subset of well-rated, discounted items get flagged "popular" so
    // the homepage's featured section has real variety instead of only
    // the two original hand-seeded products.
    const popular = (p.rating ?? 0) >= 4.5 && !!p.originalPrice && p.originalPrice > p.price && index % 6 === 0;

    await prisma.product.upsert({
      where: { id: `seed-import-${index}` },
      update: {},
      create: {
        id: `seed-import-${index}`,
        title: p.title,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        currency: p.currency,
        inStock: p.inStock,
        Brand: p.brand,
        rating: p.rating,
        popular,
        specs: p.specs,
        colors: p.colors,
        sizes: p.sizes,
        deliveryInfo: p.deliveryInfo,
        categoryPath: p.categoryPath,
        sku: p.sku,
        sourceUrl: p.sourceUrl,
        sourceMarketplace: p.sourceMarketplace,
        externalSellerName: p.sellerName,
        categoryId,
        sellerId,
        images: { create: p.images.map((url, position) => ({ url, position })) },
        reviews: {
          create: p.reviews.map((review) => ({
            reviewerName: review.name,
            title: review.title,
            content: review.content,
            rating: review.rating,
          })),
        },
      },
    });
    created += 1;
    if (created % 100 === 0) console.log(`  ...${created}/${products.length}`);
  }

  // One Brand filter per category, built from whatever brands actually
  // showed up in that category — skipped for categories that already
  // have one (e.g. re-running this script, or Mobiles/Laptops from the
  // hand-written seed.ts) so repeated runs don't pile up duplicates.
  for (const [categoryId, counts] of brandsByCategory) {
    const existing = await prisma.categoryFilter.findFirst({ where: { categoryId, filterName: "Brand" } });
    if (existing) continue;

    const topBrands = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([brand]) => brand);

    if (topBrands.length > 0) {
      await prisma.categoryFilter.create({
        data: { categoryId, filterName: "Brand", options: topBrands },
      });
    }
  }

  console.log(`Seed complete — ${created} products across ${categoryIdCache.size} categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
