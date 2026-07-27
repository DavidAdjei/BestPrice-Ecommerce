import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { useMemo } from "react";
import { useIsAuth } from "./hooks/useAuth";
import { useIsDarkMode } from "./hooks/useIsDarkMode";
import { useAuthStore } from "./store/authStore";
import { Toast } from "./components/Toast";
import { Loading } from "./components/Loading";
import { MainLayout } from "./layouts/MainLayout";
import { GuestRoutes } from "./routes/GuestRoutes";
import { BuyerRoutes } from "./routes/BuyerRoutes";
import { SellerRoutes } from "./routes/SellerRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { SellerOnboardingPage } from "./pages/SellerOnboarding";

function App() {
  // Hydrate the session once on load — populates the auth store from the
  // "auth_token" cookie, if one is present. Kept mounted for the whole
  // app lifetime so login/logout elsewhere stay in sync.
  const { isLoading: authLoading, isFetched } = useIsAuth();
  const { isAuth, user } = useAuthStore();

  const isDark = useIsDarkMode();
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? "dark" : "light",
          primary: { main: "#f5a022" },
        },
      }),
    [isDark]
  );

  let body: React.ReactNode;

  if (authLoading && !isFetched) {
    // Previously the nav would flash "guest" state for a moment on every
    // full page load/refresh while this request was in flight. A brief,
    // deliberate loading screen reads better than that flicker.
    body = <Loading fullScreen label="Loading Best Price..." />;
  } else if (isAuth && user && user.registrationStep !== 0) {
    // An interrupted registration (seller signed up but never finished
    // the payment-details step) previously had nowhere to go — isAuth
    // would just fail silently. Block everything else until it's done,
    // whether they're here right after signing up or after logging back
    // in on a different day.
    body = (
      <MainLayout>
        <SellerOnboardingPage />
      </MainLayout>
    );
  } else if (!isAuth) {
    body = <GuestRoutes />;
  } else if (user?.role === "ADMIN") {
    body = <AdminRoutes />;
  } else if (user?.role === "SELLER") {
    body = <SellerRoutes />;
  } else {
    body = <BuyerRoutes />;
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline enableColorScheme />
      <div className="flex min-h-screen w-full flex-col bg-surface">
        <Toast />
        {body}
      </div>
    </ThemeProvider>
  );
}

export default App;
