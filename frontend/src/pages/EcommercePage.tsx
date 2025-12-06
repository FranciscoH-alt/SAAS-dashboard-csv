import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface FinancialKpis {
  gross_sales: number;
  net_revenue: number;
  average_order_value: number;
  gross_profit: number;
  revenue_by_platform: { platform?: string; net_revenue: number }[];
  top_products: { sku?: string; product?: string; net_revenue: number }[];
  bottom_products: { sku?: string; product?: string; net_revenue: number }[];
  revenue_daily: { order_date?: string; net_revenue: number }[];
}

interface InventoryKpis {
  inventory_on_hand: number;
  inventory_value: number;
  days_of_inventory_on_hand: number | null;
  stockout_predictions: { sku?: string; title?: string; days_left: number }[];
}

interface AnalysisResponse {
  financial_kpis: FinancialKpis;
  inventory_kpis: InventoryKpis;
  row_counts: { sales_rows: number; product_rows: number };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function EcommercePage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/analyze-ecommerce`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = (await response.json()) as AnalysisResponse;
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Unable to analyze files");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Ecommerce Analytics</h1>
            <p className="text-sm text-slate-300">
              Upload Shopify, Amazon, eBay, or training CSVs together. We auto-detect
              file types and compute KPIs.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleAnalyze}
          className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 space-y-4"
        >
          <div>
            <label className="text-sm font-semibold">Upload multiple CSVs</label>
            <input
              type="file"
              multiple
              accept=".csv"
              className="mt-2 block w-full text-sm text-slate-200"
              onChange={(e) => setFiles(e.target.files)}
            />
            <p className="text-xs text-slate-400 mt-1">
              Supported: ecommerce_sales.csv, train_df_Orders/OrderItems/Products/Payments,
              Shopify product exports.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || !files || files.length === 0}
            className="px-4 py-2 rounded bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-600"
          >
            {loading ? "Analyzing..." : "Run analysis"}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>

        {result && (
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Financial KPIs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Gross Sales" value={formatCurrency(result.financial_kpis.gross_sales)} />
                <KpiCard title="Net Revenue" value={formatCurrency(result.financial_kpis.net_revenue)} />
                <KpiCard
                  title="Average Order Value"
                  value={formatCurrency(result.financial_kpis.average_order_value)}
                />
                <KpiCard title="Gross Profit" value={formatCurrency(result.financial_kpis.gross_profit)} />
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TableCard
                title="Revenue by platform"
                headers={["Platform", "Net Revenue"]}
                rows={result.financial_kpis.revenue_by_platform.map((row) => [
                  row.platform || "Unknown",
                  formatCurrency(row.net_revenue),
                ])}
              />
              <TableCard
                title="Top products"
                headers={["SKU", "Product", "Revenue"]}
                rows={result.financial_kpis.top_products.map((row) => [
                  row.sku || "-",
                  row.product || "",
                  formatCurrency(row.net_revenue),
                ])}
              />
              <TableCard
                title="Bottom products"
                headers={["SKU", "Product", "Revenue"]}
                rows={result.financial_kpis.bottom_products.map((row) => [
                  row.sku || "-",
                  row.product || "",
                  formatCurrency(row.net_revenue),
                ])}
              />
              <TableCard
                title="Revenue per day"
                headers={["Date", "Net Revenue"]}
                rows={result.financial_kpis.revenue_daily.map((row) => [
                  row.order_date || "-",
                  formatCurrency(row.net_revenue),
                ])}
              />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Inventory KPIs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <KpiCard title="Inventory on hand" value={result.inventory_kpis.inventory_on_hand.toLocaleString()} />
                <KpiCard title="Inventory value" value={formatCurrency(result.inventory_kpis.inventory_value)} />
                <KpiCard
                  title="DIOH"
                  value={
                    result.inventory_kpis.days_of_inventory_on_hand
                      ? `${result.inventory_kpis.days_of_inventory_on_hand.toFixed(1)} days`
                      : "N/A"
                  }
                />
              </div>
              <TableCard
                title="Stockout predictions"
                headers={["SKU", "Title", "Days left"]}
                rows={result.inventory_kpis.stockout_predictions.map((row) => [
                  row.sku || "-",
                  row.title || "",
                  row.days_left.toFixed(1),
                ])}
              />
            </section>

            <div className="text-xs text-slate-400">
              Rows processed: {result.row_counts.sales_rows} sales rows / {" "}
              {result.row_counts.product_rows} product rows
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function TableCard({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              {headers.map((h) => (
                <th key={h} className="py-1 pr-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-slate-700/60">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="py-1 pr-4">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="py-2 text-slate-400">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EcommercePage;
