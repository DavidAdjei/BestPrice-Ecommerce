import { useRecentlyViewedStore } from "../store/recentlyViewedStore";
import { useProductsByIds } from "../hooks/useProducts";
import { ProductCard } from "./ProductCard";

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const productIds = useRecentlyViewedStore((state) => state.productIds);
  const ids = productIds.filter((id) => id !== excludeId);
  const { data: products = [] } = useProductsByIds(ids);

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="mb-4 text-lg font-bold text-ink">Recently viewed</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] gap-5">
        {products.map((product) => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </section>
  );
}
