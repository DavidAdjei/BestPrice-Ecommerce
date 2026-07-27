import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Rating } from "@mui/material";
import { IoCartOutline, IoChatbubbleOutline } from "react-icons/io5";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useProduct, useRelatedProducts, useSubmitReview } from "../hooks/useProducts";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import { useFeedbackStore } from "../store/feedbackStore";
import { useToggleWishlist, useWishlist } from "../hooks/useWishlist";
import { useCreateRoom } from "../hooks/useChat";
import { useRecentlyViewedStore } from "../store/recentlyViewedStore";
import { RecentlyViewed } from "../components/RecentlyViewed";
import { ProductCard } from "../components/ProductCard";
import { ProductImage } from "../components/ProductImage";
import { socket } from "../lib/socket";
import { getErrorMessage } from "../lib/api";
import { Loading } from "../components/Loading";
import { discountPercent, formatPrice } from "../lib/currency";

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const { data: product, isLoading } = useProduct(id);
  const recordView = useRecentlyViewedStore((state) => state.recordView);
  const { data: relatedProducts = [] } = useRelatedProducts(product?.category, product?.id);

  useEffect(() => {
    if (product) recordView(product.id);
  }, [product, recordView]);

  const submitReview = useSubmitReview(id);
  const [reviewRating, setReviewRating] = useState<number | null>(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const user = useAuthStore((state) => state.user);
  const addToCart = useCartStore((state) => state.addToCart);
  const { showSuccess, showError } = useFeedbackStore();
  const { data: wishList } = useWishlist(user?.id);
  const { add, remove } = useToggleWishlist(user?.id);
  const createRoom = useCreateRoom();

  const isInWishlist = useMemo(
    () => !!product && wishList?.some((p) => p.id === product.id),
    [wishList, product]
  );

  if (isLoading || !product) return <Loading fullScreen label="Loading product..." />;

  const outOfStock = product.inStock === 0;
  const images = product.imgs || [];

  const handleAddToWish = () => {
    if (!user) {
      showError("You need to login first");
      return;
    }
    add.mutate(product.id, { onError: (err) => showError(getErrorMessage(err)) });
  };

  const handleRemove = () => {
    remove.mutate(product.id, { onError: (err) => showError(getErrorMessage(err)) });
  };

  const handleChatWithSeller = () => {
    if (!user) {
      showError("You need to login first");
      return;
    }
    createRoom.mutate(
      { buyerId: user.id, sellerId: product.sellerId, productId: product.id },
      {
        onSuccess: (roomId) => {
          if (!socket.connected) socket.connect();
          socket.emit("joinRoom", { userId: user.id, roomId });
          navigate(`/chat/${roomId}/${product.sellerId}`);
        },
      }
    );
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewRating) return;
    submitReview.mutate(
      { userId: user.id, title: reviewTitle, content: reviewContent, rating: reviewRating },
      {
        onSuccess: () => {
          showSuccess("Review submitted");
          setReviewRating(0);
          setReviewTitle("");
          setReviewContent("");
        },
        onError: (err) => showError(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-5 pb-16">
      <Link to="/shop" className="mb-2 inline-block text-sm text-muted hover:text-ink">
        &larr; Back to shop
      </Link>
      {!!product.categoryPath?.length && (
        <p className="mb-5 truncate text-xs text-muted">{product.categoryPath.join(" / ")}</p>
      )}

      <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="flex flex-col gap-3">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-surface-alt">
            <ProductImage src={images[activeImage]} alt={product.title} width={600} className="h-full w-full object-contain p-5" />
            {outOfStock && (
              <span className="absolute top-4 left-4 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                Out of stock
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 bg-surface-alt p-1 ${
                    index === activeImage ? "border-primary" : "border-border"
                  }`}
                  onClick={() => setActiveImage(index)}
                >
                  <ProductImage src={img} alt={`${product.title} ${index + 1}`} width={100} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {product.Brand && (
            <span className="text-xs font-bold tracking-wide text-muted uppercase">{product.Brand}</span>
          )}
          <h1 className="text-2xl font-bold text-ink">{product.title}</h1>

          {!!product.rating && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Rating readOnly value={product.rating} size="small" precision={0.1} />
              <span>{product.rating.toFixed(1)} ({product.reviews?.length || 0} reviews)</span>
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <p className="text-2xl font-bold text-ink">{formatPrice(Number(product.price), product.currency)}</p>
            {discountPercent(product.price, product.originalPrice) && (
              <>
                <p className="text-base text-muted line-through">
                  {formatPrice(Number(product.originalPrice), product.currency)}
                </p>
                <span className="rounded-full bg-danger-tint px-2 py-0.5 text-xs font-bold text-danger">
                  -{discountPercent(product.price, product.originalPrice)}%
                </span>
              </>
            )}
          </div>
          {(product.sourceMarketplace || product.externalSellerName) && (
            <p className="text-xs text-muted">
              Sold by {product.externalSellerName || "a marketplace seller"}
              {product.sourceMarketplace && ` \u00b7 imported from ${product.sourceMarketplace}`}
              {product.sourceUrl && (
                <>
                  {" \u00b7 "}
                  <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-dark">
                    View original listing
                  </a>
                </>
              )}
            </p>
          )}
          {product.description && <p className="mt-2 leading-relaxed text-body">{product.description}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              className="btn btn-primary"
              disabled={outOfStock}
              onClick={() => {
                addToCart(product);
                showSuccess("Item added to cart");
              }}
            >
              <IoCartOutline size={20} /> {outOfStock ? "Out of stock" : "Add to cart"}
            </button>

            <button className="btn btn-outline" onClick={handleChatWithSeller}>
              <IoChatbubbleOutline size={18} /> Chat with seller
            </button>

            {user && (
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border-strong bg-surface"
                onClick={!isInWishlist ? handleAddToWish : handleRemove}
                aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                {isInWishlist ? <FaHeart size={20} color="#e5484d" /> : <FaRegHeart size={20} />}
              </button>
            )}
          </div>

          {!!product.colors?.length && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-ink">Available colors</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <span key={color} className="rounded-full border border-border-strong px-3 py-1 text-xs text-body">
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!!product.sizes?.length && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-ink">Available sizes</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <span key={size} className="rounded-lg border border-border-strong px-3 py-1 text-xs text-body uppercase">
                    {size}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!!product.deliveryInfo?.length && (
            <div className="mt-4 rounded-lg bg-surface-alt p-3">
              {product.deliveryInfo.map((line, index) => (
                <p key={index} className="text-xs text-body">{line}</p>
              ))}
            </div>
          )}

          {!!product.specs?.length && (
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold text-ink">Specifications</h3>
              <ul className="flex flex-col gap-2">
                {product.specs.map((spec, index) => (
                  <li key={index} className="rounded-lg bg-surface-alt p-3 text-sm text-body">
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {product.reviews?.length > 0 && (
        <div className="mt-16 border-t border-border pt-6">
          <h3 className="mb-3 text-lg font-semibold text-ink">Customer reviews</h3>
          <div className="flex flex-col gap-4">
            {product.reviews.map((review, index) => (
              <div key={index} className="rounded-lg bg-surface-alt p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{review.name}</span>
                  <Rating readOnly value={review.rating} size="small" />
                </div>
                <p className="mb-1 text-sm font-semibold">{review.title}</p>
                <p className="text-sm leading-relaxed text-body">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {user?.role === "BUYER" && (
        <div className="mt-10 border-t border-border pt-6">
          <h3 className="mb-3 text-lg font-semibold text-ink">Write a review</h3>
          <p className="mb-3 text-xs text-muted">
            Only available for products from your delivered orders.
          </p>
          <form onSubmit={handleSubmitReview} className="flex max-w-lg flex-col gap-3">
            <Rating
              value={reviewRating}
              onChange={(_event, value) => setReviewRating(value)}
            />
            <input
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Review title"
              className="input"
            />
            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Share your thoughts about this product..."
              rows={3}
              required
              className="input"
            />
            <button className="btn btn-primary self-start" type="submit" disabled={submitReview.isPending || !reviewRating}>
              {submitReview.isPending ? "Submitting..." : "Submit review"}
            </button>
          </form>
        </div>
      )}

      {relatedProducts.length > 0 && (
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="mb-4 text-lg font-bold text-ink">More in {product.category}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] gap-5">
            {relatedProducts.map((related) => (
              <ProductCard product={related} key={related.id} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={product.id} />
    </div>
  );
}
