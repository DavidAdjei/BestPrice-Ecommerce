import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { Loading } from "../components/Loading";
import {
  Homepage,
  AboutPage,
  ChatPage,
  SellerDashboardPage,
  SellerProductsPage,
  ResetPasswordPage,
  NotFoundPage,
} from "./lazyPages";

export function SellerRoutes() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/dashboard" element={<SellerDashboardPage />} />
          <Route path="/products" element={<SellerProductsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:roomId/:participantId" element={<ChatPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
