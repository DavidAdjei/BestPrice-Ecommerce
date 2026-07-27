import { useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { useCategories } from "../hooks/useProducts";

export type SelectedFilters = Record<string, Record<string, boolean>>;

export interface FilterState {
  category: string;
  filters: SelectedFilters;
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
}

export const emptyFilterState: FilterState = {
  category: "",
  filters: {},
  minPrice: "",
  maxPrice: "",
  inStockOnly: false,
};

interface FilterProps {
  setVisible: (visible: boolean) => void;
  value: FilterState;
  onApply: (next: FilterState) => void;
}

export function Filter({ setVisible, value, onApply }: FilterProps) {
  const { data: categories = [] } = useCategories();
  const [draft, setDraft] = useState<FilterState>(value);

  const activeCategory = categories.find((cat) => cat.title === draft.category) ?? null;

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const title = event.target.value;
    setDraft((prev) => ({ ...prev, category: title, filters: {} }));
  };

  const handleFilterChange = (filterCategory: string, option: string) => {
    setDraft((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterCategory]: {
          ...prev.filters[filterCategory],
          [option]: !prev.filters[filterCategory]?.[option],
        },
      },
    }));
  };

  const activeFilterCount =
    Object.values(draft.filters).reduce((total, group) => total + Object.values(group).filter(Boolean).length, 0) +
    (draft.minPrice ? 1 : 0) +
    (draft.maxPrice ? 1 : 0) +
    (draft.inStockOnly ? 1 : 0);

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/35" onClick={() => setVisible(false)} />
      <aside className="fixed top-0 bottom-0 left-0 z-[200] flex w-[min(20rem,88vw)] flex-col overflow-y-auto bg-surface p-5 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">Filters</h3>
          <button onClick={() => setVisible(false)} className="text-muted" aria-label="Close filters">
            <IoCloseOutline size={22} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5">
          <div>
            <label htmlFor="categorySelect" className="input-label">Category</label>
            <select
              id="categorySelect"
              onChange={handleCategoryChange}
              value={draft.category}
              className="input"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.title}>{cat.title}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="input-label">Price range (GH&#8373;)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={draft.minPrice}
                onChange={(e) => setDraft((prev) => ({ ...prev, minPrice: e.target.value }))}
                className="input"
              />
              <span className="text-muted">&ndash;</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={draft.maxPrice}
                onChange={(e) => setDraft((prev) => ({ ...prev, maxPrice: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              checked={draft.inStockOnly}
              onChange={(e) => setDraft((prev) => ({ ...prev, inStockOnly: e.target.checked }))}
            />
            In stock only
          </label>

          {activeCategory && Object.keys(activeCategory.filters).length > 0 && (
            <div className="flex flex-col gap-5 border-t border-border pt-5">
              {Object.entries(activeCategory.filters).map(([filterCategory, group]) => (
                <div key={filterCategory}>
                  <h4 className="mb-2 text-sm font-semibold text-ink">{group.filterName}</h4>
                  {group.filterList.map((option) => (
                    <label key={option} className="flex items-center gap-2 py-1 text-sm text-body">
                      <input
                        type="checkbox"
                        checked={draft.filters[filterCategory]?.[option] || false}
                        onChange={() => handleFilterChange(filterCategory, option)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
          <button onClick={() => setDraft(emptyFilterState)} className="btn btn-ghost btn-sm">
            Reset
          </button>
          <button
            onClick={() => {
              onApply(draft);
              setVisible(false);
            }}
            className="btn btn-primary btn-block"
          >
            Apply filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>
      </aside>
    </>
  );
}
