import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useOrders } from "../hooks/useOrders";
import { useWishlist } from "../hooks/useWishlist";
import { useLogout } from "../hooks/useAuth";
import { ProductCard } from "../components/ProductCard";

type Tab = "orders" | "wishlist" | "address";
const tabs: Tab[] = ["orders", "wishlist", "address"];

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<Tab>("orders");
  const { data: orders = [] } = useOrders(user?.id);
  const { data: wishlist = [] } = useWishlist(user?.id);
  const logout = useLogout();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 pb-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Hi, {user?.firstName}</h1>
        <button className="btn btn-outline btn-sm" onClick={() => logout.mutate()}>
          Log out
        </button>
      </div>

      <div className="mb-8 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            className={`capitalize ${t === tab ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div>
          {orders.length === 0 ? (
            <div className="empty-state">
              <h3>No orders yet</h3>
              <p>Your order history will show up here.</p>
              <Link to="/shop" className="btn btn-primary">Start shopping</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <div key={order.id} className="card-surface p-5">
                  <div className="mb-3 flex justify-between">
                    <span className="font-semibold text-ink">Order #{order.id.slice(-8)}</span>
                    <span className="text-sm text-muted">{new Date(order.orderDate).toLocaleDateString()}</span>
                  </div>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-1 text-sm text-body">
                      <span>{item.title} &times; {item.quantity}</span>
                      <span>GH&#8373;{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold text-ink">
                    <span>Status: {order.status}</span>
                    <span>GH&#8373;{Number(order.totalPrice).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "wishlist" && (
        <div>
          {wishlist.length === 0 ? (
            <div className="empty-state">
              <h3>Your wishlist is empty</h3>
              <p>Save products you like to find them again easily.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] gap-6">
              {wishlist.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "address" && (
        <div className="card-surface max-w-[24rem] p-5 text-body">
          {user?.address ? (
            <>
              <p>House Number {user.address.houseNumber}</p>
              <p>{user.address.street}</p>
              <p>{user.address.city}</p>
              <p>{user.address.region}</p>
              <p>{user.address.ghanaPost}</p>
            </>
          ) : (
            <p>No address on file yet — you can add one during checkout.</p>
          )}
        </div>
      )}
    </div>
  );
}
