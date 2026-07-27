import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Order, Product } from "../types";

export interface Bank {
  name: string;
  code: string;
  type: string;
}

export const useBanks = () => {
  return useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const { data } = await api.get<{ banks: Bank[] }>("/auth/banks");
      return data.banks;
    },
    staleTime: 24 * 60 * 60 * 1000, // bank lists barely change; cache for a day
  });
};

export const useSellerProducts = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ["seller", sellerId, "products"],
    queryFn: async () => {
      const { data } = await api.get<{ products: Product[] }>(`/seller/${sellerId}`);
      return data.products;
    },
    enabled: !!sellerId,
  });
};

export const useAddProduct = (sellerId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Record<string, unknown>) => {
      const { data } = await api.post<{ product: Product }>(`/seller/${sellerId}`, { product });
      return data.product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller", sellerId, "products"] });
    },
  });
};

export const useUploadProductImages = () => {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("image", file));
      const { data } = await api.post<{ imageUrls: string[] }>("/seller/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.imageUrls;
    },
  });
};

export const useSellerOrders = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ["seller", sellerId, "orders"],
    queryFn: async () => {
      const { data } = await api.get<{ orders: Order[] }>(`/seller/${sellerId}/orders`);
      return data.orders;
    },
    enabled: !!sellerId,
  });
};

export interface SellerStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  revenueByDay: { date: string; revenue: number }[];
  lowStockProducts: { id: string; title: string; inStock: number }[];
}

export const useSellerStats = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ["seller", sellerId, "stats"],
    queryFn: async () => {
      const { data } = await api.get<SellerStats>(`/seller/${sellerId}/stats`);
      return data;
    },
    enabled: !!sellerId,
  });
};

export const useUpdateOrderStatus = (sellerId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { data } = await api.put(`/seller/orders/${orderId}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller", sellerId, "orders"] });
    },
  });
};
