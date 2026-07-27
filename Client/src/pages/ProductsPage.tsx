import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Pagination from "@mui/material/Pagination";
import { BsFilterLeft } from "react-icons/bs";
import { IoCloseCircle, IoSearchOutline } from "react-icons/io5";
import { ProductCard } from "../components/ProductCard";
import { Filter, type FilterState } from "../components/Filter";
import { useSearchProducts } from "../hooks/useProducts";
import { ProductGridSkeleton } from "../components/ProductCardSkeleton";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
] as const;

export function ProductsPage() {
  const [visible, setVisible] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || "";
  const q = searchParams.get("searchKeyword") || "";
  const sort = (searchParams.get("sort") as (typeof SORT_OPTIONS)[number]["value"]) || "newest";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const inStockOnly = searchParams.get("inStockOnly") === "true";
  const page = Number(searchParams.get("page")) || 1;

  const filters = useMemo<Record<string, Record<string, boolean>>>(() => {
    const raw = searchParams.get("filters");
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [searchParams]);

  const [searchDraft, setSearchDraft] = useState(q);

  const { data, isLoading, isPlaceholderData } = useSearchProducts({
    page,
    limit: PAGE_SIZE,
    q,
    category,
    sort,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    inStockOnly,
    filters,
  });

  const products = data?.products ?? [];
  const pagination = data?.pagination;

  const updateParams = (updates: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
    }
    if (resetPage) next.delete("page");
    setSearchParams(next);
  };

  const filterState: FilterState = { category, filters, minPrice, maxPrice, inStockOnly };

  const applyFilters = (next: FilterState) => {
    updateParams({
      category: next.category || undefined,
      filters: Object.keys(next.filters).length ? JSON.stringify(next.filters) : undefined,
      minPrice: next.minPrice || undefined,
      maxPrice: next.maxPrice || undefined,
      inStockOnly: next.inStockOnly ? "true" : undefined,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ searchKeyword: searchDraft || undefined });
  };

  // Chips summarizing every active filter, each individually removable —
  // the old page gave no way to see (or clear) what was applied without
  // reopening the whole panel.
  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (category) activeChips.push({ label: category, onRemove: () => applyFilters({ ...filterState, category: "" }) });
  if (minPrice || maxPrice) {
    activeChips.push({
      label: `GH\u20B5${minPrice || "0"} \u2013 ${maxPrice || "\u221E"}`,
      onRemove: () => applyFilters({ ...filterState, minPrice: "", maxPrice: "" }),
    });
  }
  if (inStockOnly) {
    activeChips.push({ label: "In stock only", onRemove: () => applyFilters({ ...filterState, inStockOnly: false }) });
  }
  for (const [group, options] of Object.entries(filters)) {
    for (const [option, checked] of Object.entries(options)) {
      if (!checked) continue;
      activeChips.push({
        label: option,
        onRemove: () =>
          applyFilters({
            ...filterState,
            filters: { ...filterState.filters, [group]: { ...filterState.filters[group], [option]: false } },
          }),
      });
    }
  }
  if (q) activeChips.push({ label: `"${q}"`, onRemove: () => { setSearchDraft(""); updateParams({ searchKeyword: undefined }); } });

  return (
    <div className="mx-auto max-w-6xl px-5 py-5 pb-16">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary-dark"
          onClick={() => setVisible(true)}
        >
          <BsFilterLeft size={20} /> Filters{activeChips.length > 0 ? ` (${activeChips.length})` : ""}
        </button>

        <form onSubmit={handleSearchSubmit} className="flex min-w-[14rem] flex-1 items-center gap-2">
          <div className="relative flex-1">
            <IoSearchOutline size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search products..."
              className="input pl-9"
            />
          </div>
        </form>

        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="input w-auto"
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <p className="ml-auto text-sm text-muted">
          {pagination ? `${pagination.total} product${pagination.total === 1 ? "" : "s"}` : ""}
        </p>
      </div>

      {activeChips.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {activeChips.map((chip, index) => (
            <button
              key={`${chip.label}-${index}`}
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-tint px-3 py-1 text-xs font-medium text-primary-dark"
            >
              {chip.label}
              <IoCloseCircle size={14} />
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <ProductGridSkeleton count={PAGE_SIZE} />
      ) : products.length > 0 ? (
        <div
          className={`grid grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] gap-5 transition-opacity ${
            isPlaceholderData ? "opacity-50" : "opacity-100"
          }`}
        >
          {products.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No products match your filters</h3>
          <p>Try a different category or clear your filters to see more.</p>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          count={pagination.totalPages}
          page={pagination.page}
          onChange={(_event, value) => updateParams({ page: String(value) }, false)}
          color="primary"
          className="mt-6 flex justify-center [&_button.Mui-selected]:bg-primary! [&_button.Mui-selected]:text-white!"
        />
      )}

      {visible && <Filter setVisible={setVisible} value={filterState} onApply={applyFilters} />}
    </div>
  );
}
