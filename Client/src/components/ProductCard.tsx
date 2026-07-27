import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoCartOutline, IoChatbubbleOutline } from "react-icons/io5";
import { FaStar, FaHeart, FaRegHeart } from "react-icons/fa";
import type { Product } from "../types";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import { useFeedbackStore } from "../store/feedbackStore";
import { useWishlist, useToggleWishlist } from "../hooks/useWishlist";
import { useCreateRoom } from "../hooks/useChat";
import { socket } from "../lib/socket";
import { getErrorMessage } from "../lib/api";
import { discountPercent, formatPrice } from "../lib/currency";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const addToCart = useCartStore((state) => state.addToCart);
  const { showSuccess, showError } = useFeedbackStore();
  const { data: wishList } = useWishlist(user?.id);
  const { add, remove } = useToggleWishlist(user?.id);
  const createRoom = useCreateRoom();

  const isInWishlist = useMemo(
    () => !!wishList?.some((p) => p.id === product.id),
    [wishList, product.id]
  );

  const outOfStock = product.inStock === 0;
  const discount = discountPercent(product.price, product.originalPrice);

  const handleAddToWish = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      showError("You need to login first");
      return;
    }
    add.mutate(product.id, {
      onError: (err) => showError(getErrorMessage(err)),
    });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    remove.mutate(product.id, {
      onError: (err) => showError(getErrorMessage(err)),
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    showSuccess("Item added to cart");
  };

  const handleChatWithSeller = (e: React.MouseEvent) => {
    e.preventDefault();
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

  return (
    <div className="flex w-full max-w-[17rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/product/${product.id}`} className="text-inherit no-underline">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-surface-alt">
          <ProductImage
            src={product.imgs?.[0]}
            alt={product.title}
            width={340}
            className="h-full w-full object-contain p-4 transition-transform group-hover:scale-105"
          />
          {outOfStock && (
            <span className="absolute top-3 left-3 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">
              Out of stock
            </span>
          )}
          {!outOfStock && discount && (
            <span className="absolute top-3 left-3 rounded-full bg-danger px-2.5 py-1 text-xs font-semibold text-white">
              -{discount}%
            </span>
          )}
          {product.sourceMarketplace && (
            <span className="absolute top-3 right-3 rounded-full bg-surface/90 px-2 py-1 text-[0.65rem] font-semibold text-body backdrop-blur-sm">
              {product.sourceMarketplace}
            </span>
          )}
        </div>

        <div className="px-4 pt-4">
          {product.Brand && (
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">{product.Brand}</span>
          )}
          <p className="mt-1 line-clamp-2 min-h-[2.6em] text-sm font-medium text-ink">{product.title}</p>

          {!!product.rating && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-dark">
              <FaStar size={13} />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          )}

          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-lg font-bold text-ink">{formatPrice(Number(product.price), product.currency)}</p>
            {discount && (
              <p className="text-xs text-muted line-through">
                {formatPrice(Number(product.originalPrice), product.currency)}
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 p-4">
        <button
          className="btn btn-primary btn-sm flex-1"
          onClick={handleAddToCart}
          disabled={outOfStock}
        >
          <IoCartOutline size={18} />
          {outOfStock ? "Unavailable" : "Add to cart"}
        </button>

        <button
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-body transition hover:scale-105 hover:border-primary"
          onClick={handleChatWithSeller}
          aria-label="Chat with seller"
          title="Chat with seller"
        >
          <IoChatbubbleOutline size={18} />
        </button>

        {user && (
          <button
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-body transition hover:scale-105 hover:border-primary"
            onClick={!isInWishlist ? handleAddToWish : handleRemove}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isInWishlist ? <FaHeart size={16} color="#e5484d" /> : <FaRegHeart size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
