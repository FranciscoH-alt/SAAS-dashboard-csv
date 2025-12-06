import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface PlatformBreakdown {
  platform: string;
  revenue: number;
}

export interface TopProduct {
  name: string;
  revenue: number;
  orders: number;
}

export interface FinancialData {
  gross_sales: number;
  net_revenue: number;
  net_profit: number;
  aov: number;
  num_orders: number;
  platform_breakdown?: PlatformBreakdown[];
  top_products?: TopProduct[];
}

export interface DIOHEntry {
  sku: string;
  dioh?: number;
}

export interface StockoutPrediction {
  sku: string;
  title: string;
  inventory_qty: number;
  dioh: number;
  predicted_stockout_date: string;
}

export interface InventoryData {
  total_inventory_units: number;
  total_inventory_value: number;
  dioh_by_sku?: DIOHEntry[];
  stockout_predictions?: StockoutPrediction[];
}

export interface DashboardData {
  financial?: FinancialData;
  inventory?: InventoryData;
}

interface DashboardContextValue {
  data: DashboardData | null;
  setData: (value: DashboardData | null) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = sessionStorage.getItem("dashboardData");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Failed to parse saved dashboard data", error);
      return null;
    }
  });

  useEffect(() => {
    if (data) {
      sessionStorage.setItem("dashboardData", JSON.stringify(data));
    } else {
      sessionStorage.removeItem("dashboardData");
    }
  }, [data]);

  const value = useMemo(() => ({ data, setData }), [data]);

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}

export function useDashboardData() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboardData must be used within DashboardProvider");
  }
  return ctx;
}
