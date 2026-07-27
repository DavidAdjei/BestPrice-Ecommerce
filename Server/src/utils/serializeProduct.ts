import type { Category, Product, ProductImage, Review } from "../generated/client.js";

type FullProduct = Product & {
  images: ProductImage[];
  reviews: Review[];
  category: Category | null;
};

export const serializeProduct = (product: FullProduct) => {
  const { images, category, price, originalPrice, ...rest } = product;
  return {
    ...rest,
    price: Number(price),
    originalPrice: originalPrice === null ? null : Number(originalPrice),
    category: category?.title ?? null,
    imgs: images.sort((a, b) => a.position - b.position).map((img) => img.url),
    reviews: product.reviews.map((review) => ({
      name: review.reviewerName,
      title: review.title,
      content: review.content,
      rating: review.rating,
    })),
  };
};

export const productInclude = {
  images: true,
  reviews: true,
  category: true,
} as const;
