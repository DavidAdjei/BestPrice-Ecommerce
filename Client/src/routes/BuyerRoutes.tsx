import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { Loading } from "../components/Loading";
import {
  Homepage,
  ProductsPage,
  ProductDetails,
  CartPage,
  CheckoutPage,
  AboutPage,
  ProfilePage,
  ChatPage,
  ResetPasswordPage,
  NotFoundPage,
} from "./lazyPages";

export function BuyerRoutes() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/shop" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:roomId/:participantId" element={<ChatPage />} />
          {/* A logged-in buyer might still want to change their password. */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          {/* Already signed in — send them home instead of showing the forms again. */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
