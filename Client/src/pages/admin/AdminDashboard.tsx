import { useState } from "react";
import {
  usePlatformStats,
  useAdminUsers,
  useUpdateUserStatus,
  useAdminOrders,
  useAdminCoupons,
  useCreateCoupon,
  useDeleteCoupon,
} from "../../hooks/useAdmin";
import { useFeedbackStore } from "../../store/feedbackStore";
import { getErrorMessage } from "../../lib/api";
import { formatPrice } from "../../lib/currency";
import { Loading } from "../../components/Loading";

type Tab = "overview" | "users" | "orders" | "coupons";
const tabs: Tab[] = ["overview", "users", "orders", "coupons"];

export function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 pb-16">
      <h1 className="mb-6 text-2xl font-bold text-ink">Admin</h1>

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

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "coupons" && <CouponsTab />}
    </div>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = usePlatformStats();
  if (isLoading || !stats) return <Loading />;

  const cards = [
    { label: "Users", value: stats.userCount },
    { label: "Products", value: stats.productCount },
    { label: "Orders", value: stats.orderCount },
    { label: "Total revenue", value: formatPrice(stats.totalRevenue, "GHS") },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="card-surface p-5">
          <p className="text-sm text-muted">{card.label}</p>
          <p className="text-xl font-bold text-ink">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const { data: users = [], isLoading } = useAdminUsers();
  const updateStatus = useUpdateUserStatus();
  const { showSuccess, showError } = useFeedbackStore();

  if (isLoading) return <Loading />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-alt text-xs text-muted uppercase">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-border">
              <td className="px-4 py-3">{user.firstName} {user.lastName}</td>
              <td className="px-4 py-3 text-muted">{user.email}</td>
              <td className="px-4 py-3">{user.role}</td>
              <td className="px-4 py-3">
                <span>{user.accountStatus ?? "ACTIVE"}</span>
              </td>
              <td className="px-4 py-3">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() =>
                    updateStatus.mutate(
                      {
                        id: user.id,
                        accountStatus: user.accountStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
                      },
                      {
                        onSuccess: () => showSuccess("Account status updated"),
                        onError: (err) => showError(getErrorMessage(err)),
                      }
                    )
                  }
                >
                  {user.accountStatus === "SUSPENDED" ? "Reactivate" : "Suspend"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTab() {
  const { data: orders = [], isLoading } = useAdminOrders();
  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <div key={order.id} className="card-surface flex items-center justify-between p-4 text-sm">
          <div>
            <p className="font-semibold text-ink">Order #{order.id.slice(-8)}</p>
            <p className="text-muted">{new Date(order.orderDate).toLocaleDateString()} &middot; {order.status}</p>
          </div>
          <p className="font-bold text-ink">{formatPrice(order.totalPrice, "GHS")}</p>
        </div>
      ))}
    </div>
  );
}

function CouponsTab() {
  const { data: coupons = [], isLoading } = useAdminCoupons();
  const createCoupon = useCreateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const { showSuccess, showError } = useFeedbackStore();
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCoupon.mutate(
      { code, percentOff: Number(percentOff) },
      {
        onSuccess: () => {
          showSuccess("Coupon created");
          setCode("");
          setPercentOff("");
        },
        onError: (err) => showError(getErrorMessage(err)),
      }
    );
  };

  if (isLoading) return <Loading />;

  return (
    <div>
      <form onSubmit={handleCreate} className="card-surface mb-6 flex max-w-md flex-wrap items-end gap-3 p-5">
        <div className="flex-1">
          <label className="input-label" htmlFor="code">Code</label>
          <input id="code" required value={code} onChange={(e) => setCode(e.target.value)} className="input" />
        </div>
        <div className="w-28">
          <label className="input-label" htmlFor="percentOff">% off</label>
          <input
            id="percentOff"
            required
            type="number"
            min="1"
            max="100"
            value={percentOff}
            onChange={(e) => setPercentOff(e.target.value)}
            className="input"
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={createCoupon.isPending}>
          Add
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="card-surface flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-mono font-semibold text-ink">{coupon.code}</p>
              <p className="text-muted">
                {coupon.percentOff ? `${coupon.percentOff}% off` : `${coupon.amountOff} off`} &middot; used{" "}
                {coupon.timesRedeemed} times
              </p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => deleteCoupon.mutate(coupon.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
