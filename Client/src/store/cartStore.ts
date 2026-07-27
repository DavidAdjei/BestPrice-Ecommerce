import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cart, Product } from "../types";

interface CartState {
  cart: Cart;
  addToCart: (product: Product) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: {},

      addToCart: (product) =>
        set((state) => {
          const existing = state.cart[product.id];
          const nextQuantity = Math.min((existing?.quantity ?? 0) + 1, product.inStock || 1);
          return {
            cart: {
              ...state.cart,
              [product.id]: { product, quantity: nextQuantity },
            },
          };
        }),

      increment: (productId) =>
        set((state) => {
          const item = state.cart[productId];
          if (!item) return state;
          if (item.quantity >= item.product.inStock) return state;
          return {
            cart: { ...state.cart, [productId]: { ...item, quantity: item.quantity + 1 } },
          };
        }),

      decrement: (productId) =>
        set((state) => {
          const item = state.cart[productId];
          if (!item || item.quantity <= 1) return state;
          return {
            cart: { ...state.cart, [productId]: { ...item, quantity: item.quantity - 1 } },
          };
        }),

      removeFromCart: (productId) =>
        set((state) => {
          const next = { ...state.cart };
          delete next[productId];
          return { cart: next };
        }),

      clearCart: () => set({ cart: {} }),
    }),
    { name: "bestprice-cart" }
  )
);
