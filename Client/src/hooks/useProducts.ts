import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Category, Product } from "../types";

export interface ProductSearchParams {
  page: number;
  limit?: number;
  q?: string;
  category?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "rating";
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  filters?: Record<string, Record<string, boolean>>;
}

export interface ProductSearchResult {
  products: Product[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// Powers the shop page — filtering/sorting/paging now happens in the
// database instead of the client fetching every product and slicing it
// in the browser, which stopped being practical once the catalog grew
// past a couple hundred items.
export const useSearchProducts = (params: ProductSearchParams) => {
  return useQuery({
    queryKey: ["products", "search", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      query.set("page", String(params.page));
      if (params.limit) query.set("limit", String(params.limit));
      if (params.q) query.set("q", params.q);
      if (params.category) query.set("category", params.category);
      if (params.sort) query.set("sort", params.sort);
      if (params.minPrice !== undefined) query.set("minPrice", String(params.minPrice));
      if (params.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice));
      if (params.inStockOnly) query.set("inStockOnly", "true");
      if (params.filters && Object.keys(params.filters).length > 0) {
        query.set("filters", JSON.stringify(params.filters));
      }

      const { data } = await api.get<ProductSearchResult>(`/products?${query.toString()}`);
      return data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useProductsByIds = (ids: string[]) => {
  return useQuery({
    queryKey: ["products", "by-ids", ids],
    queryFn: async () => {
      const { data } = await api.get<{ products: Product[] }>("/products/by-ids", {
        params: { ids: ids.join(",") },
      });
      return data.products;
    },
    enabled: ids.length > 0,
  });
};

export const useRelatedProducts = (category: string | null | undefined, excludeId: string | undefined) => {
  return useQuery({
    queryKey: ["products", "related", category, excludeId],
    queryFn: async () => {
      const { data } = await api.get<ProductSearchResult>("/products", {
        params: { category, limit: 8 },
      });
      return data.products.filter((product) => product.id !== excludeId);
    },
    enabled: !!category,
  });
};
export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await api.get<{ products: Product[] }>("/products", { params: { limit: 48 } });
      return data.products;
    },
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data } = await api.get<{ products: Product[] }>("/products/featured");
      return data.products;
    },
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const { data } = await api.get<{ product: Product }>(`/products/${id}`);
      return data.product;
    },
    enabled: !!id,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<{ categories: Category[] }>("/categories");
      return data.categories;
    },
  });
};

export const useSubmitReview = (productId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; title: string; content: string; rating: number }) => {
      const { data } = await api.post(`/products/${productId}/reviews`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId] });
    },
  });
};
