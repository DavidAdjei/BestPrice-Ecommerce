import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Product } from "../types";

export const useWishlist = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["wishlist", userId],
    queryFn: async () => {
      const { data } = await api.get<{ wishlist: Product[] }>(`/wishlist/${userId}`);
      return data.wishlist;
    },
    enabled: !!userId,
  });
};

export const useToggleWishlist = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["wishlist", userId] });

  const add = useMutation({
    mutationFn: async (productId: string) => {
      await api.post(`/wishlist/${userId}/${productId}`);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/wishlist/${userId}/${productId}`);
    },
    onSuccess: invalidate,
  });

  return { add, remove };
};
