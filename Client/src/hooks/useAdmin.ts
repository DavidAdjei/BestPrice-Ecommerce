import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Order, User } from "../types";

export interface PlatformStats {
  userCount: number;
  productCount: number;
  orderCount: number;
  totalRevenue: number;
}

export interface Coupon {
  id: string;
  code: string;
  percentOff: number | null;
  amountOff: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  active: boolean;
  expiresAt: string | null;
}

export const usePlatformStats = () => {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const { data } = await api.get<PlatformStats>("/admin/stats");
      return data;
    },
  });
};

export const useAdminUsers = (role?: string) => {
  return useQuery({
    queryKey: ["admin", "users", role],
    queryFn: async () => {
      const { data } = await api.get<{ users: User[] }>("/admin/users", { params: role ? { role } : undefined });
      return data.users;
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accountStatus }: { id: string; accountStatus: string }) => {
      const { data } = await api.put(`/admin/users/${id}/status`, { accountStatus });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
};

export const useAdminOrders = () => {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data } = await api.get<{ orders: Order[] }>("/admin/orders");
      return data.orders;
    },
  });
};

export const useAdminCoupons = () => {
  return useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => {
      const { data } = await api.get<{ coupons: Coupon[] }>("/admin/coupons");
      return data.coupons;
    },
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; percentOff?: number; amountOff?: number; expiresAt?: string }) => {
      const { data } = await api.post("/admin/coupons", input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/coupons/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
};
