import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";

export function MainLayout({ children }: { children?: ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="flex w-full flex-1 overflow-x-hidden">
        <div className="w-full">{children ?? <Outlet />}</div>
      </main>
      <Footer />
    </>
  );
}
