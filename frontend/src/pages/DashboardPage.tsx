import { useEffect, useMemo, useState } from "react";
import { StockoutPrediction, useDashboardData } from "../state/dashboard";
import { useNavigation } from "../navigation";

function MetricCard({
  title,
  value,
  badge,
  accent,
  icon,
}: {
  title: string;
  value: string;
  badge?: string;
  accent: string;
  icon: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-900 border border-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.25),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.18),transparent_35%)]" />
      <div className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl font-semibold ${accent}`}
            >
              {icon}
            </div>
            <div>
              <p className="text-sm text-slate-400">{title}</p>
              <p className="text-2xl font-semibold text-white">{value}</p>
            </div>
          </div>
          {badge && (
            <span className="px-3 py-1 text-xs rounded-full bg-white/10 text-slate-100 border border-white/10">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PlatformPie({ data }: { data: { platform: string; revenue: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.revenue, 0);
  let currentStart = 0;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="relative w-56 h-56">
        <div className="absolute inset-0 rounded-full blur-3xl bg-gradient-to-br from-indigo-500/40 via-purple-500/30 to-cyan-400/30" />
        <svg viewBox="0 0 32 32" className="w-56 h-56 rotate-[-90deg] relative z-10 drop-shadow-2xl">
          {data.map((item, index) => {
            const angle = (item.revenue / total) * 100;
            const dashArray = `${angle} ${100 - angle}`;
            const dashOffset = currentStart;
            currentStart += angle;
            const colorPalette = [
              "#8B5CF6",
              "#EC4899",
              "#06B6D4",
              "#22C55E",
              "#F97316",
              "#E11D48",
            ];
            return (
              <circle
                key={item.platform}
                r="15.915"
                cx="16"
                cy="16"
                fill="transparent"
                stroke={colorPalette[index % colorPalette.length]}
                strokeWidth="3"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700 ease-out"
              />
            );
          })}
        </svg>
        <div className="absolute inset-6 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center text-center">
          <div>
            <p className="text-xs text-slate-400">Total revenue</p>
            <p className="text-xl font-semibold text-white">${total.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="space-y-3 w-full">
        {data.map((item, index) => {
          const colorPalette = [
            "from-indigo-500 to-purple-500",
            "from-rose-500 to-orange-400",
            "from-cyan-400 to-blue-500",
            "from-emerald-400 to-teal-500",
            "from-amber-400 to-orange-500",
            "from-pink-600 to-rose-500",
          ];
          const percentage = ((item.revenue / total) * 100).toFixed(1);
          return (
            <div
              key={item.platform}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-lg bg-gradient-to-br ${colorPalette[index % colorPalette.length]} shadow-lg`}
                />
                <div>
                  <p className="text-white font-semibold">{item.platform}</p>
                  <p className="text-xs text-slate-400">{percentage}% of total</p>
                </div>
              </div>
              <p className="text-slate-100 font-semibold">
                ${item.revenue.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StockoutTable({
  items,
}: {
  items: StockoutPrediction[];
}) {
  return (
    <div className="rounded-2xl border border-red-400/30 bg-gradient-to-br from-red-500/15 via-red-600/10 to-red-700/10 shadow-[0_25px_60px_rgba(248,113,113,0.25)]">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-sm text-red-200">Critical Alerts</p>
          <p className="text-xl font-semibold text-white">Stockout Warnings</p>
        </div>
        <span className="px-4 py-1 rounded-full bg-red-500/20 text-red-100 text-xs border border-red-300/30">
          {items.length} SKUs at risk
        </span>
      </div>
      <div className="overflow-hidden rounded-b-2xl">
        <table className="w-full text-sm">
          <thead className="bg-red-500/20 text-red-50">
            <tr>
              <th className="text-left px-5 py-3">SKU</th>
              <th className="text-left px-5 py-3">Product</th>
              <th className="text-right px-5 py-3">On Hand</th>
              <th className="text-right px-5 py-3">DIOH</th>
              <th className="text-right px-5 py-3">Est. Stockout</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={row.sku}
                className="border-t border-red-500/20 hover:bg-red-500/10 transition-colors"
              >
                <td className="px-5 py-3 font-mono text-red-100">{row.sku}</td>
                <td className="px-5 py-3 text-white font-medium">{row.title}</td>
                <td className="px-5 py-3 text-right text-amber-200 font-semibold">
                  {row.inventory_qty}
                </td>
                <td className="px-5 py-3 text-right text-red-200 font-semibold">
                  {Math.round(row.dioh)} days
                </td>
                <td className="px-5 py-3 text-right text-red-100">
                  {new Date(row.predicted_stockout_date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DIOHChart({ data }: { data: { sku: string; dioh?: number }[] }) {
  const valid = data.filter((item) => item.dioh && item.dioh < 200).slice(0, 10);
  const max = Math.max(...valid.map((i) => i.dioh || 0), 1);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <span className="h-3 w-3 rounded-full bg-red-500" />
        <span className="text-xs">Red: fast movers (&lt;30 days)</span>
        <span className="h-3 w-3 rounded-full bg-amber-400 ml-4" />
        <span className="text-xs">Yellow: 30-60 days</span>
        <span className="h-3 w-3 rounded-full bg-emerald-400 ml-4" />
        <span className="text-xs">Green: &gt;60 days</span>
      </div>
      <div className="flex items-end gap-3 h-72">
        {valid.map((item) => {
          const height = ((item.dioh || 0) / max) * 100;
          const color = item.dioh! < 30
            ? "bg-red-500"
            : item.dioh! < 60
              ? "bg-amber-400"
              : "bg-emerald-400";
          return (
            <div key={item.sku} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full rounded-t-xl ${color}`}
                style={{
                  height: animate ? `${height}%` : "0%",
                  transition: "height 900ms ease",
                  minHeight: "20px",
                }}
              />
              <div className="text-xs text-slate-300 truncate w-full text-center" title={item.sku}>
                {item.sku}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopProducts({
  data,
}: {
  data: { name: string; revenue: number; orders: number }[];
}) {
  const topFive = data.slice(0, 5);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const maxRevenue = Math.max(...topFive.map((item) => item.revenue), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Top 5 Products</h3>
        <div className="space-y-4">
          {topFive.map((product, index) => {
            const percentage = (product.revenue / maxRevenue) * 100;
            const colors = [
              "from-indigo-500 to-purple-500",
              "from-emerald-400 to-teal-500",
              "from-amber-400 to-orange-500",
              "from-pink-500 to-rose-500",
              "from-sky-400 to-blue-500",
            ];
            return (
              <div key={product.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span className="font-semibold text-white">{product.name}</span>
                  <span className="font-semibold text-white">
                    ${product.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="h-4 rounded-full bg-white/5 overflow-hidden border border-white/5">
                  <div
                    className={`h-full bg-gradient-to-r ${colors[index % colors.length]}`}
                    style={{
                      width: animate ? `${percentage}%` : "0%",
                      transition: "width 800ms ease",
                      transitionDelay: `${index * 80}ms`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/10 text-slate-200">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-right px-4 py-3">Revenue</th>
              <th className="text-right px-4 py-3">Orders</th>
            </tr>
          </thead>
          <tbody>
            {data.map((product, idx) => (
              <tr
                key={product.name + idx}
                className="border-t border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3 text-slate-300">{idx + 1}</td>
                <td className="px-4 py-3 text-white font-semibold">{product.name}</td>
                <td className="px-4 py-3 text-right text-emerald-300 font-semibold">
                  ${product.revenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-slate-200">{product.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState() {
  const { navigate } = useNavigation();
  return (
    <div className="flex flex-col items-center text-center gap-4 py-16 bg-white/5 border border-dashed border-white/10 rounded-3xl">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
        📂
      </div>
      <div>
        <p className="text-xl font-semibold text-white">No dashboard data yet</p>
        <p className="text-slate-400 text-sm">Upload ecommerce_sales.csv, train_df files or Shopify exports to unlock insights.</p>
      </div>
      <button
        onClick={() => navigate("/upload")}
        className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        Go to upload studio
      </button>
    </div>
  );
}

export function DashboardPage() {
  const { data } = useDashboardData();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const financialCards = useMemo(() => {
    if (!data?.financial) return [];
    return [
      {
        title: "Gross Sales",
        value: `$${(data.financial.gross_sales || 0).toLocaleString()}`,
        badge: "Before discounts",
        accent: "bg-gradient-to-br from-indigo-500 to-purple-500",
        icon: "💵",
      },
      {
        title: "Net Revenue",
        value: `$${(data.financial.net_revenue || 0).toLocaleString()}`,
        badge: "After discounts",
        accent: "bg-gradient-to-br from-emerald-400 to-teal-500",
        icon: "📈",
      },
      {
        title: "Net Profit",
        value: `$${(data.financial.net_profit || 0).toLocaleString()}`,
        badge: "Est. after COGS",
        accent: "bg-gradient-to-br from-amber-400 to-orange-500",
        icon: "💎",
      },
      {
        title: "Avg Order Value",
        value: `$${(data.financial.aov || 0).toLocaleString()}`,
        badge: `${(data.financial.num_orders || 0).toLocaleString()} orders`,
        accent: "bg-gradient-to-br from-cyan-400 to-blue-500",
        icon: "🛒",
      },
    ];
  }, [data]);

  if (!data) return <EmptyState />;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-400">Executive dashboard</p>
        <h1 className="text-3xl font-bold text-white">Performance & Inventory Control</h1>
        <p className="text-slate-400 text-sm max-w-3xl">
          Sticky navigation, 3D gradient cards, animated charts and polished tables keep Shopify products, ecommerce_sales.csv
          and train_df exports aligned in one command center.
        </p>
      </div>

      {financialCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {financialCards.map((card, index) => (
            <div
              key={card.title}
              style={{
                transform: animate ? "translateY(0px)" : "translateY(12px)",
                transition: `transform 500ms ease ${(index + 1) * 80}ms`,
              }}
            >
              <MetricCard {...card} />
            </div>
          ))}
        </div>
      )}

      {data.financial && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.financial.platform_breakdown && data.financial.platform_breakdown.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-400">Channel mix</p>
                  <p className="text-xl font-semibold text-white">Revenue by platform</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-slate-100 border border-white/10">
                  Animated chart
                </span>
              </div>
              <PlatformPie data={data.financial.platform_breakdown} />
            </div>
          )}

          {data.financial.top_products && data.financial.top_products.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <TopProducts data={data.financial.top_products} />
            </div>
          )}
        </div>
      )}

      {data.inventory && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Inventory command center</p>
              <p className="text-2xl font-semibold text-white">Stock health & velocity</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/5">DIOH chart</span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/5">Stockout alerts</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <MetricCard
              title="Inventory Units"
              value={(data.inventory.total_inventory_units || 0).toLocaleString()}
              badge="Items in stock"
              accent="bg-gradient-to-br from-blue-500 to-sky-500"
              icon="📦"
            />
            <MetricCard
              title="Inventory Value"
              value={`$${(data.inventory.total_inventory_value || 0).toLocaleString()}`}
              badge="Total stock value"
              accent="bg-gradient-to-br from-teal-400 to-emerald-500"
              icon="💰"
            />
          </div>

          {data.inventory.dioh_by_sku && data.inventory.dioh_by_sku.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-400">Velocity</p>
                  <p className="text-xl font-semibold text-white">Days of Inventory on Hand</p>
                </div>
                <span className="text-xs text-slate-200 px-3 py-1 rounded-full bg-white/10 border border-white/10">
                  Red / Yellow / Green coding
                </span>
              </div>
              <DIOHChart data={data.inventory.dioh_by_sku} />
            </div>
          )}

          {data.inventory.stockout_predictions && data.inventory.stockout_predictions.length > 0 && (
            <StockoutTable items={data.inventory.stockout_predictions} />
          )}
        </div>
      )}

      {data.financial?.platform_breakdown && data.inventory?.stockout_predictions && (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 px-6 py-5 text-sm text-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <p className="font-semibold text-white mb-1">Upload once, analyze everywhere</p>
          <p className="text-slate-300">
            ecommerce_sales.csv, train_df Orders/OrderItems/Products/Payments and Shopify exports (even without cost per item) automatically align with this dashboard, preserving all metrics.
          </p>
        </div>
      )}
    </div>
  );
}
