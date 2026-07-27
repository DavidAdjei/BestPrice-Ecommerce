import { prisma } from '../src/lib/prisma.js'
import { hashPassword } from "../src/utils/password.js";

async function main() {
  const mobiles = await prisma.category.upsert({
    where: { title: "Mobiles" },
    update: {},
    create: {
      title: "Mobiles",
      keywords: ["phone", "smartphone", "mobile"],
      filters: {
        create: [
          { filterName: "Brand", options: ["Apple", "Samsung", "Redmi"] },
          { filterName: "RAM", options: ["4GB", "6GB", "8GB", "12GB"] },
        ],
      },
    },
  });

  const laptops = await prisma.category.upsert({
    where: { title: "Laptops" },
    update: {},
    create: {
      title: "Laptops",
      keywords: ["laptop", "notebook", "computer"],
      filters: {
        create: [
          { filterName: "Brand", options: ["HP", "Dell", "Apple"] },
          { filterName: "RAM", options: ["8GB", "16GB", "32GB"] },
        ],
      },
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {},
    create: {
      firstName: "Demo",
      lastName: "Seller",
      email: "seller@example.com",
      password: await hashPassword("password123"),
      role: "SELLER",
      registrationStep: 0,
    },
  });

  await prisma.product.upsert({
    where: { id: "seed-product-iphone" },
    update: {},
    create: {
      id: "seed-product-iphone",
      title: "iPhone 15",
      description: "The latest iPhone with an incredible camera system.",
      price: 8500,
      inStock: 25,
      Brand: "Apple",
      ram: "6GB",
      popular: true,
      rating: 4.5,
      categoryId: mobiles.id,
      sellerId: seller.id,
      specs: ["6.1-inch display", "A16 Bionic chip", "128GB storage"],
      images: { create: [{ url: "https://images.unsplash.com/photo-1592286927505-1def25115481", position: 0 }] },
    },
  });

  await prisma.product.upsert({
    where: { id: "seed-product-hp" },
    update: {},
    create: {
      id: "seed-product-hp",
      title: "HP Pavilion 15",
      description: "A reliable everyday laptop for work and study.",
      price: 6200,
      inStock: 10,
      Brand: "HP",
      ram: "16GB",
      popular: true,
      rating: 4.2,
      categoryId: laptops.id,
      sellerId: seller.id,
      specs: ["15.6-inch display", "Intel Core i5", "512GB SSD"],
      images: { create: [{ url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8", position: 0 }] },
    },
  });

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
