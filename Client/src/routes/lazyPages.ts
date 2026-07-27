import { lazy } from "react";

export const Homepage = lazy(() => import("../pages/Homepage").then((m) => ({ default: m.Homepage })));
export const ProductsPage = lazy(() => import("../pages/ProductsPage").then((m) => ({ default: m.ProductsPage })));
export const ProductDetails = lazy(() =>
  import("../pages/ProductDetails").then((m) => ({ default: m.ProductDetails }))
);
export const CartPage = lazy(() => import("../pages/Cart").then((m) => ({ default: m.CartPage })));
export const CheckoutPage = lazy(() => import("../pages/Checkout").then((m) => ({ default: m.CheckoutPage })));
export const AboutPage = lazy(() => import("../pages/About").then((m) => ({ default: m.AboutPage })));
export const LoginPage = lazy(() => import("../pages/Login").then((m) => ({ default: m.LoginPage })));
export const SignUpPage = lazy(() => import("../pages/SignUp").then((m) => ({ default: m.SignUpPage })));
export const ForgotPasswordPage = lazy(() =>
  import("../pages/ForgotPassword").then((m) => ({ default: m.ForgotPasswordPage }))
);
export const ResetPasswordPage = lazy(() =>
  import("../pages/ResetPassword").then((m) => ({ default: m.ResetPasswordPage }))
);
export const VerifyEmailPage = lazy(() =>
  import("../pages/VerifyEmail").then((m) => ({ default: m.VerifyEmailPage }))
);
export const ProfilePage = lazy(() => import("../pages/Profile").then((m) => ({ default: m.ProfilePage })));
export const ChatPage = lazy(() => import("../pages/Chat").then((m) => ({ default: m.ChatPage })));
export const SellerDashboardPage = lazy(() =>
  import("../pages/SellerDashboard").then((m) => ({ default: m.SellerDashboardPage }))
);
export const SellerProductsPage = lazy(() =>
  import("../pages/SellerProducts").then((m) => ({ default: m.SellerProductsPage }))
);
export const NotFoundPage = lazy(() => import("../pages/NotFound").then((m) => ({ default: m.NotFoundPage })));
export const AdminDashboardPage = lazy(() =>
  import("../pages/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboardPage }))
);
