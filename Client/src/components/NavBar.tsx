import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  IoPersonOutline,
  IoCartOutline,
  IoChatbubblesOutline,
  IoSearchOutline,
  IoMenuOutline,
  IoCloseOutline,
} from "react-icons/io5";
import { useMediaQuery } from "@mui/material";
import Logo from "../assets/images/Logo.jpeg";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import { ThemeToggle } from "./ThemeToggle";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative pb-1 text-sm font-medium transition-colors ${isActive
    ? "text-ink font-semibold after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary"
    : "text-body hover:text-ink"
  }`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-3 text-center text-lg font-medium ${isActive ? "bg-primary-tint text-primary-dark" : "text-ink hover:bg-surface-alt"
  }`;

export function NavBar() {
  const { isAuth, user } = useAuthStore();
  const cart = useCartStore((state) => state.cart);
  const [keyword, setKeyword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const cartCount = Object.values(cart).reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    setMenuOpen(false);
    setSearching(false);
  }, [location.pathname]);

  const submitSearch = () => {
    const query = new URLSearchParams({ searchKeyword: keyword });
    navigate(`/shop?${query.toString()}`);
    setSearching(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submitSearch();
    if (e.key === "Escape") setSearching(false);
  };

  const handleLogin = () => {
    const query = new URLSearchParams({ page: location.pathname });
    navigate(`/login?${query.toString()}`);
  };

  const toggleMenu = () => setMenuOpen((open) => !open);
  const toggleSearch = () => setSearching((open) => !open);

  const isBuyerNav = !isAuth || user?.role === "BUYER";
  const isSellerNav = isAuth && user?.role === "SELLER";

  const iconBtn =
    "relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-body transition-colors hover:bg-surface-alt hover:text-ink";

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border bg-surface">
      <nav className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-5 px-5">
        <div className="flex min-w-0 items-center gap-10">
          <NavLink to="/" className="block h-11 w-11 shrink-0 overflow-hidden rounded-full" aria-label="Best Price home">
            <img src={Logo} alt="Best Price" className="h-full w-full object-cover" />
          </NavLink>

          {!isMobile && (
            <div className="flex items-center gap-8">
              {isBuyerNav && (
                <>
                  <NavLink to="/" end className={navLinkClass}>Home</NavLink>
                  <NavLink to="/shop" className={navLinkClass}>Shop</NavLink>
                  <NavLink to="/about" className={navLinkClass}>About</NavLink>
                </>
              )}
              {isSellerNav && (
                <>
                  <NavLink to="/" className={navLinkClass}>Dashboard</NavLink>
                  <NavLink to="/about" className={navLinkClass}>About</NavLink>
                  <NavLink to="/products" className={navLinkClass}>My Products</NavLink>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />

          {!isAuth && (
            <>
              <button className={iconBtn} onClick={toggleSearch} aria-label="Search">
                <IoSearchOutline size={22} />
              </button>
              {!isMobile && (
                <button className="btn btn-outline btn-sm ml-1" onClick={handleLogin}>
                  Log in
                </button>
              )}
              <Link to="/cart" className={iconBtn} aria-label="Cart">
                <IoCartOutline size={22} />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {isAuth && user?.role === "BUYER" && (
            <>
              <button className={iconBtn} onClick={toggleSearch} aria-label="Search">
                <IoSearchOutline size={22} />
              </button>
              <Link to="/profile" className={iconBtn} aria-label="My account">
                <IoPersonOutline size={22} />
              </Link>
              <Link to="/chat" className={iconBtn} aria-label="Messages">
                <IoChatbubblesOutline size={22} />
              </Link>
              <Link to="/cart" className={iconBtn} aria-label="Cart">
                <IoCartOutline size={22} />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {isSellerNav && (
            <>
              <Link to="/chat" className={iconBtn} aria-label="Messages">
                <IoChatbubblesOutline size={22} />
              </Link>
              <Link to="/profile" className={iconBtn} aria-label="My account">
                <IoPersonOutline size={22} />
              </Link>
            </>
          )}

          {isMobile && (
            <button className={iconBtn} onClick={toggleMenu} aria-label="Menu">
              {menuOpen ? <IoCloseOutline size={26} /> : <IoMenuOutline size={26} />}
            </button>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/35" onClick={toggleMenu} />
          <div className="absolute inset-x-0 top-full z-[200] flex flex-col gap-3 border-t border-border bg-surface p-4 shadow-lg">
            {isBuyerNav && (
              <>
                <NavLink to="/" end onClick={toggleMenu} className={mobileLinkClass}>Home</NavLink>
                <NavLink to="/shop" onClick={toggleMenu} className={mobileLinkClass}>Shop</NavLink>
                <NavLink to="/about" onClick={toggleMenu} className={mobileLinkClass}>About</NavLink>
              </>
            )}
            {isSellerNav && (
              <>
                <NavLink to="/" onClick={toggleMenu} className={mobileLinkClass}>Dashboard</NavLink>
                <NavLink to="/about" onClick={toggleMenu} className={mobileLinkClass}>About</NavLink>
                <NavLink to="/products" onClick={toggleMenu} className={mobileLinkClass}>My Products</NavLink>
              </>
            )}
            {!isAuth && (
              <button className="btn btn-outline btn-block" onClick={handleLogin}>
                Log in
              </button>
            )}
          </div>
        </>
      )}

      {searching && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/35" onClick={() => setSearching(false)} />
          <div className="absolute left-1/2 top-full z-[200] mt-3 flex w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 items-center gap-2 rounded-2xl border border-border bg-surface p-3 shadow-lg">
            <IoSearchOutline size={20} className="shrink-0 text-muted" />
            <input
              autoFocus
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              value={keyword}
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
              type="text"
              placeholder="Search products and brands..."
            />
            <button className="btn btn-primary btn-sm" onClick={submitSearch}>
              Search
            </button>
          </div>
        </>
      )}
    </header>
  );
}
