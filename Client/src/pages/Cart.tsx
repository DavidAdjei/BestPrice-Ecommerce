import { Link, useNavigate } from "react-router-dom";
import { IoArrowBackOutline, IoCartOutline } from "react-icons/io5";
import { CartItem } from "../components/CartItem";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useFeedbackStore } from "../store/feedbackStore";
import { formatPrice } from "../lib/currency";

export function CartPage() {
  const cart = useCartStore((state) => state.cart);
  const user = useAuthStore((state) => state.user);
  const showError = useFeedbackStore((state) => state.showError);
  const navigate = useNavigate();

  const cartItems = Object.values(cart);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.quantity * item.product.price, 0);
  const currencies = new Set(cartItems.map((item) => item.product.currency || "GHS"));
  const mixedCurrencies = currencies.size > 1;
  const cartCurrency = mixedCurrencies ? null : [...currencies][0];

  const handleProceed = () => {
    if (!user) {
      showError("You need to log in first");
      const query = new URLSearchParams({ page: "/cart" });
      navigate(`/login?${query.toString()}`);
      return;
    }
    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="empty-state">
          <IoCartOutline size={48} />
          <h3>Your cart is empty</h3>
          <p>Looks like you haven&apos;t added anything yet.</p>
          <Link to="/shop" className="btn btn-primary">Start shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-5 pb-16">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <IoArrowBackOutline size={20} />
        Continue shopping
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-ink">Your shopping cart</h1>
      <p className="mt-1 mb-5 text-sm text-muted">{itemCount} item{itemCount === 1 ? "" : "s"}</p>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-3">
          {cartItems.map((item) => (
            <CartItem key={item.product.id} item={item} />
          ))}
        </div>

        <div className="card-surface sticky top-[calc(4.5rem+1rem)] p-5">
          <h3 className="mb-4 text-lg font-semibold text-ink">Order summary</h3>
          <div className="flex justify-between py-2 text-sm font-semibold text-body">
            <span>Subtotal</span>
            <span>{mixedCurrencies ? subtotal.toFixed(2) : formatPrice(subtotal, cartCurrency)}</span>
          </div>
          <p className="mb-4 text-xs text-muted">
            {mixedCurrencies
              ? "Items are listed in different currencies — you'll be charged the total in Ghanaian cedis (GH₵) at checkout."
              : "Shipping and taxes calculated at checkout."}
          </p>
          <button className="btn btn-primary btn-block" onClick={handleProceed}>
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
}
