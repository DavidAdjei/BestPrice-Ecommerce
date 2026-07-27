import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useAddProduct, useSellerProducts, useUploadProductImages } from "../hooks/useSeller";
import { useCategories } from "../hooks/useProducts";
import { useFeedbackStore } from "../store/feedbackStore";
import { getErrorMessage } from "../lib/api";

export function SellerProductsPage() {
  const user = useAuthStore((state) => state.user);
  const { data: products = [] } = useSellerProducts(user?.id);
  const { data: categories = [] } = useCategories();
  const addProduct = useAddProduct(user?.id);
  const uploadImages = useUploadProductImages();
  const { showSuccess, showError } = useFeedbackStore();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [inStock, setInStock] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setInStock("");
    setDescription("");
    setCategoryId("");
    setFiles([]);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imgs: string[] = [];
      if (files.length > 0) {
        imgs = await uploadImages.mutateAsync(files);
      }
      await addProduct.mutateAsync({
        title,
        price: Number(price),
        inStock: Number(inStock),
        description,
        categoryId: categoryId || undefined,
        imgs,
      });
      showSuccess("Product added");
      resetForm();
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 pb-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">My products</h1>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add product"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-surface mb-8 flex max-w-[28rem] flex-col gap-4 p-6">
          <label className="flex flex-col gap-1 text-sm text-body">
            <span className="input-label">Title</span>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-body">
            <span className="input-label">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-body">
            <span className="input-label">Price (GH&#8373;)</span>
            <input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-body">
            <span className="input-label">In stock</span>
            <input required type="number" min="0" value={inStock} onChange={(e) => setInStock(e.target.value)} className="input" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-body">
            <span className="input-label">Category</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.title}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-body">
            <span className="input-label">Images</span>
            <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          </label>
          <button className="btn btn-primary btn-block" type="submit" disabled={addProduct.isPending || uploadImages.isPending}>
            {addProduct.isPending || uploadImages.isPending ? "Saving..." : "Save product"}
          </button>
        </form>
      )}

      {products.length === 0 ? (
        <div className="empty-state">
          <h3>No products listed yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] gap-6">
          {products.map((product) => (
            <div key={product.id} className="card-surface relative p-4">
              {product.inStock <= 5 && (
                <span className="absolute top-2 right-2 rounded-full bg-danger px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                  {product.inStock === 0 ? "Out of stock" : `Low: ${product.inStock} left`}
                </span>
              )}
              <img src={product.imgs?.[0]} alt={product.title} className="mb-3 aspect-square w-full object-contain" />
              <p className="font-semibold text-ink">{product.title}</p>
              <p className="text-sm text-muted">GH&#8373;{product.price} &middot; {product.inStock} in stock</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
