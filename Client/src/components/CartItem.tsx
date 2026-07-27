import { Link } from "react-router-dom";
import { FaRegTrashAlt } from "react-icons/fa";
import type { CartItem as CartItemType } from "../types";
import { useCartStore } from "../store/cartStore";
import { formatPrice } from "../lib/currency";

export function CartItem({ item }: { item: CartItemType }) {
  const { product, quantity } = item;
  const { increment, decrement, removeFromCart } = useCartStore();
  const atMaxStock = quantity >= product.inStock;
  const subtitle = product.Brand || product.genre || product.forWhom || product.type;

  return (
    <div className="grid grid-cols-[3.5rem_1fr] gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-[4.5rem_1fr_auto_auto_auto] sm:items-center">
      <Link to={`/product/${product.id}`} className="row-span-1 block h-14 w-14 overflow-hidden rounded-lg bg-surface-alt sm:h-[4.5rem] sm:w-[4.5rem]">
        <img src={product.imgs?.[0]} alt={product.title} className="h-full w-full object-contain" />
      </Link>

      <div className="flex min-w-0 flex-col gap-0.5">
        <Link to={`/product/${product.id}`} className="text-sm font-semibold text-ink hover:text-primary-dark">
          {product.title}
        </Link>
        {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
        <span className="text-xs text-muted">{formatPrice(Number(product.price), product.currency)} each</span>
      </div>

      <div className="col-span-1 flex items-center gap-2">
        <button
          className="h-7 w-7 rounded border border-border-strong bg-surface font-bold text-ink"
          onClick={() => quantity > 1 && decrement(product.id)}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span className="min-w-5 text-center text-sm">{quantity}</span>
        <button
          className="h-7 w-7 rounded border border-border-strong bg-surface font-bold text-ink disabled:opacity-40"
          onClick={() => !atMaxStock && increment(product.id)}
          disabled={atMaxStock}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <div className="text-right text-sm font-bold whitespace-nowrap text-ink sm:text-left">
        {formatPrice(product.price * quantity, product.currency)}
      </div>

      <button
        onClick={() => removeFromCart(product.id)}
        className="col-span-2 justify-self-end rounded-lg p-2 text-muted hover:bg-danger-tint hover:text-danger sm:col-span-1"
        aria-label="Remove item"
      >
        <FaRegTrashAlt size={16} />
      </button>
    </div>
  );
}
