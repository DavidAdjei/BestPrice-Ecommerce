import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { IoWarningOutline } from "react-icons/io5";
import { useAuthStore } from "../store/authStore";
import { useSellerOrders, useSellerProducts, useSellerStats, useUpdateOrderStatus } from "../hooks/useSeller";
import { formatPrice } from "../lib/currency";
import type { OrderStatus } from "../types";

const statuses: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

export function SellerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: products = [] } = useSellerProducts(user?.id);
  const { data: orders = [] } = useSellerOrders(user?.id);
  const { data: stats } = useSellerStats(user?.id);
  const updateStatus = useUpdateOrderStatus(user?.id);

  const chartData = stats?.revenueByDay.map((day) => ({
    ...day,
    label: new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 pb-16">
      <h1 className="mb-6 text-2xl font-bold text-ink">Seller dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="card-surface p-5">
          <p className="text-sm text-muted">Products</p>
          <p className="text-2xl font-bold text-ink">{products.length}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-muted">Orders</p>
          <p className="text-2xl font-bold text-ink">{orders.length}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-muted">Total revenue</p>
          <p className="text-2xl font-bold text-ink">
            {stats ? formatPrice(stats.totalRevenue, "GHS") : "..."}
          </p>
        </div>
      </div>

      {chartData && chartData.length > 0 && (
        <div className="card-surface mb-8 p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Revenue &mdash; last 14 days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f5a022" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f5a022" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-muted)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted)" width={40} />
              <Tooltip
                formatter={(value) => formatPrice(Number(value ?? 0), "GHS")}
                contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "var(--color-border)" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f5a022" strokeWidth={2} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats && stats.lowStockProducts.length > 0 && (
        <div className="mb-8 rounded-2xl border border-danger/30 bg-danger-tint p-5">
          <div className="mb-3 flex items-center gap-2 text-danger">
            <IoWarningOutline size={20} />
            <h2 className="text-sm font-semibold">Low stock &mdash; restock soon</h2>
          </div>
          <div className="flex flex-col gap-2">
            {stats.lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">{product.title}</span>
                <span className="font-semibold text-danger">
                  {product.inStock === 0 ? "Out of stock" : `${product.inStock} left`}
                </span>
              </div>
            ))}
          </div>
          <Link to="/products" className="mt-3 inline-block text-xs font-semibold text-primary-dark">
            Manage products &rarr;
          </Link>
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-ink">Incoming orders</h2>
      {orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>Orders placed against your products will show up here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="card-surface p-5">
              <div className="mb-3 flex justify-between">
                <span className="font-semibold text-ink">Order #{order.id.slice(-8)}</span>
                <span className="text-ink">{formatPrice(Number(order.totalPrice), "GHS")}</span>
              </div>
              {order.items.map((item) => (
                <p key={item.id} className="text-sm text-body">
                  {item.title} &times; {item.quantity}
                </p>
              ))}
              <select
                value={order.status}
                onChange={(e) => updateStatus.mutate({ orderId: order.id, status: e.target.value })}
                className="mt-3 rounded border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-ink"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
