import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useFeedbackStore } from "../store/feedbackStore";
import { useAddAddress } from "../hooks/useAuth";
import { usePlaceOrder } from "../hooks/useOrders";
import { AddressForm } from "../components/AddressForm";
import { getErrorMessage } from "../lib/api";
import type { Address } from "../types";
import { formatPrice } from "../lib/currency";

const emptyAddress: Address = { city: "", region: "", street: "", houseNumber: "", ghanaPost: "" };

export function CheckoutPage() {
  const cart = useCartStore((state) => state.cart);
  const user = useAuthStore((state) => state.user);
  const { showError } = useFeedbackStore();
  const addAddress = useAddAddress();
  const placeOrder = usePlaceOrder(user?.id);
  const [formAddress, setFormAddress] = useState<Address>(user?.address ?? emptyAddress);
  const [submitting, setSubmitting] = useState(false);

  const cartItems = Object.values(cart);
  const total = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const mixedCurrencies = new Set(cartItems.map((item) => item.product.currency || "GHS")).size > 1;

  if (cartItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handleSaveAddress = () => {
    if (!user) return;
    addAddress.mutate(
      { userId: user.id, address: formAddress },
      { onError: (err) => showError(getErrorMessage(err)) }
    );
  };

  const handlePlaceOrder = () => {
    if (!user) return;
    if (!user.address) {
      showError("Add an address first");
      return;
    }
    setSubmitting(true);
    const items = cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity }));
    placeOrder.mutate(items, {
      onSuccess: (res) => {
        window.location.href = res.paymentUrl;
      },
      onError: (err) => {
        showError(getErrorMessage(err));
        setSubmitting(false);
      },
    });
  };

  const deliveryMessage = () => {
    if (!user?.address) return "Add an address first to see delivery information.";
    if (user.address.region === "Greater Accra Region") {
      return "Orders within Greater Accra will be delivered by the end of every week.";
    }
    return "Orders outside Greater Accra will be delivered by the end of every month.";
  };

  return (
    <div className="mx-auto flex max-w-6xl justify-center px-5 py-6 pb-16">
      <div className="flex w-full max-w-[40rem] flex-col gap-5">
        <h1 className="text-2xl font-bold text-ink">Checkout</h1>

        <section className="card-surface p-5">
          <h3 className="mb-4 border-b border-border pb-3 text-lg font-semibold text-ink">Your order</h3>
          <div className="flex flex-col gap-3">
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex justify-between gap-4 text-sm">
                <span className="font-medium text-ink">{item.product.title}</span>
                <span className="whitespace-nowrap text-muted">
                  Qty {item.quantity} &times; {formatPrice(item.product.price, item.product.currency)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4 font-bold text-ink">
            <span>Total (charged in GH&#8373;)</span>
            <span>GH&#8373;{total.toFixed(2)}</span>
          </div>
          {mixedCurrencies && (
            <p className="mt-2 text-xs text-muted">
              Some items are listed in a different currency for browsing — payment is always processed in
              Ghanaian cedis.
            </p>
          )}
        </section>

        <section className="card-surface p-5">
          <h3 className="mb-4 border-b border-border pb-3 text-lg font-semibold text-ink">Shipping address</h3>
          {user?.address ? (
            <div className="flex flex-col gap-1 text-sm text-body">
              <p>House Number {user.address.houseNumber}</p>
              <p>{user.address.street}</p>
              <p>{user.address.city}</p>
              <p>{user.address.region}</p>
              <p>{user.address.ghanaPost}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted">No address on file yet — add one below.</p>
              <AddressForm address={formAddress} onChange={setFormAddress} />
              <button className="btn btn-dark" onClick={handleSaveAddress} disabled={addAddress.isPending}>
                {addAddress.isPending ? "Saving..." : "Save address"}
              </button>
            </div>
          )}
        </section>

        <section className="card-surface p-5">
          <h3 className="mb-4 border-b border-border pb-3 text-lg font-semibold text-ink">Delivery information</h3>
          <p className="text-sm text-body">{deliveryMessage()}</p>
        </section>

        <button
          className="btn btn-primary btn-block py-3.5 text-base"
          onClick={handlePlaceOrder}
          disabled={submitting}
        >
          {submitting ? "Processing..." : "Pay and place order"}
        </button>
      </div>
    </div>
  );
}
