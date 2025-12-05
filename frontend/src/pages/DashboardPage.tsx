import { useEffect, useState } from "react";
import { api } from "../api";

interface CashflowPoint {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface Summary {
  total_income: number;
  total_expenses: number;
  net: number;
  cashflow: CashflowPoint[];
}

export function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api
      .getDashboardSummary()
      .then(setSummary)
      .catch((e) => console.error(e));
  }, []);

  if (!summary) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="p-6 text-white space-y-4">
      <h2 className="text-xl">Dashboard</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-sm text-slate-400">Total income</p>
          <p className="text-2xl font-semibold">
            ${summary.total_income.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-sm text-slate-400">Total expenses</p>
          <p className="text-2xl font-semibold">
            ${summary.total_expenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-sm text-slate-400">Net</p>
          <p className="text-2xl font-semibold">
            ${summary.net.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl">
        <h3 className="mb-2 font-semibold">Monthly cashflow (table MVP)</h3>
        <table className="w-full text-sm">
          <thead className="bg-slate-700">
            <tr>
              <th className="p-2 text-left">Month</th>
              <th className="p-2 text-left">Income</th>
              <th className="p-2 text-left">Expenses</th>
              <th className="p-2 text-left">Net</th>
            </tr>
          </thead>
          <tbody>
            {summary.cashflow.map((c) => (
              <tr key={c.month} className="border-t border-slate-700">
                <td className="p-2">{c.month}</td>
                <td className="p-2">${c.income.toFixed(2)}</td>
                <td className="p-2">${c.expenses.toFixed(2)}</td>
                <td className="p-2">${c.net.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
