import { useNavigate } from "react-router-dom";
import HeroImage from "../assets/images/hero.png";
import { BsShieldLock, BsTruck } from "react-icons/bs";
import { GrRotateLeft } from "react-icons/gr";
import { TfiHeadphoneAlt } from "react-icons/tfi";
import { useFeaturedProducts, useCategories } from "../hooks/useProducts";
import { ProductCard } from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/ProductCardSkeleton";
import { RecentlyViewed } from "../components/RecentlyViewed";

const supportItems = [
  { icon: BsTruck, title: "Nationwide delivery", description: "Delivery available across the whole country" },
  { icon: BsShieldLock, title: "Secure payment", description: "Your payments are encrypted and protected" },
  { icon: TfiHeadphoneAlt, title: "24/7 customer support", description: "We're here to help, any time of day" },
  { icon: GrRotateLeft, title: "Free returns", description: "Free returns within the return period" },
];

export function Homepage() {
  const navigate = useNavigate();
  const { data: featuredProducts, isLoading } = useFeaturedProducts();
  const { data: categories = [] } = useCategories();

  const handleCategoryClick = (title: string) => {
    const params = new URLSearchParams({ category: title });
    navigate(`/shop?${params.toString()}`);
  };

  return (
    <div className="w-full">
      <section className="flex flex-col items-center justify-between gap-8 overflow-hidden bg-gradient-to-br from-secondary to-secondary-dark px-6 py-14 text-white md:flex-row md:px-8">
        <div className="z-1 flex max-w-[34rem] flex-col items-center gap-3 text-center md:items-start md:text-left">
          <span className="inline-block rounded-full bg-primary/20 px-3.5 py-1.5 text-xs font-bold tracking-wide text-primary uppercase">
            Limited-time offer
          </span>
          <h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            Raining offers for a hot summer
          </h1>
          <p className="text-base text-white/70 sm:text-lg">
            Save up to 25% across electronics, fashion and home essentials —
            new deals added every week.
          </p>
          <div className="mt-3 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button className="btn btn-primary" onClick={() => navigate("/shop")}>
              Shop now
            </button>
            <button
              className="btn border-white/35 text-white hover:border-white hover:bg-white/10"
              onClick={() => navigate("/shop")}
            >
              Browse categories
            </button>
          </div>
        </div>
        <div className="w-full shrink-0 md:w-[min(26rem,40%)]">
          <img src={HeroImage} alt="Featured deals" className="w-full rounded-2xl" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5">
        <section className="py-12">
          <h2 className="section-heading">Shop by category</h2>
          <p className="section-subheading">Browse everything we carry, organized the way you shop</p>
          <div className="mt-5 flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <button
                key={cat._id}
                className="flex items-center gap-2 rounded-full border border-border bg-surface py-2 pr-4 pl-2 transition hover:border-primary hover:shadow-sm"
                onClick={() => handleCategoryClick(cat.title)}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white uppercase">
                  {cat.title.slice(0, 2)}
                </span>
                <span className="text-sm font-semibold text-ink">{cat.title}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 py-8 md:grid-cols-4">
          {supportItems.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center gap-2 rounded-2xl bg-surface-alt px-3 py-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary-dark">
                <Icon size={22} />
              </div>
              <h4 className="text-sm font-bold text-ink">{title}</h4>
              <p className="text-xs text-muted">{description}</p>
            </div>
          ))}
        </section>

        <section className="py-12 pb-16">
          <h2 className="section-heading">Featured products</h2>
          <p className="section-subheading">Popular picks buyers are loving right now</p>

          {isLoading ? (
            <div className="mt-5"><ProductGridSkeleton count={8} /></div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] gap-5">
              {featuredProducts.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No featured products yet</h3>
              <p>Check back soon — new deals are added regularly.</p>
            </div>
          )}
        </section>

        <RecentlyViewed />
      </div>
    </div>
  );
}
