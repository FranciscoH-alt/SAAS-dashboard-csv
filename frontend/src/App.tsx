import React, { useState } from 'react';

const Upload = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

// Simple Bar Chart Component
const BarChart = ({ data, valueKey, labelKey, color = "#8B5CF6", formatValue }) => {
  const maxValue = Math.max(...data.map(d => d[valueKey]));
  
  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const percentage = (item[valueKey] / maxValue) * 100;
        return (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-32 text-sm text-gray-700 truncate font-medium">{item[labelKey]}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: color
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700">
                {formatValue ? formatValue(item[valueKey]) : item[valueKey]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Simple Pie Chart Component
const PieChart = ({ data, colors }) => {
  const total = data.reduce((sum, item) => sum + item.revenue, 0);
  let currentAngle = 0;
  
  const slices = data.map((item, idx) => {
    const percentage = (item.revenue / total) * 100;
    const angle = (item.revenue / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    const x1 = 50 + 45 * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = 50 + 45 * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = 50 + 45 * Math.cos((startAngle + angle - 90) * Math.PI / 180);
    const y2 = 50 + 45 * Math.sin((startAngle + angle - 90) * Math.PI / 180);
    const largeArc = angle > 180 ? 1 : 0;
    
    return {
      path: `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: colors[idx % colors.length],
      platform: item.platform,
      revenue: item.revenue,
      percentage: percentage.toFixed(1)
    };
  });
  
  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-48 h-48">
        {slices.map((slice, idx) => (
          <path
            key={idx}
            d={slice.path}
            fill={slice.color}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        ))}
      </svg>
      <div className="space-y-2">
        {slices.map((slice, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: slice.color }} />
            <div className="text-sm">
              <span className="font-semibold text-gray-900">{slice.platform}</span>
              <span className="text-gray-600 ml-2">({slice.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// DIOH Bar Chart
const DIOHChart = ({ data, maxBars = 10 }) => {
  const validData = data.filter(i => i.dioh && i.dioh < 200).slice(0, maxBars);
  const maxDIOH = Math.max(...validData.map(d => d.dioh));
  
  return (
    <div className="flex items-end justify-around h-64 gap-2">
      {validData.map((item, idx) => {
        const height = (item.dioh / maxDIOH) * 100;
        const color = item.dioh < 30 ? '#EF4444' : item.dioh < 60 ? '#F59E0B' : '#10B981';
        
        return (
          <div key={idx} className="flex flex-col items-center flex-1 max-w-20">
            <div className="text-xs font-semibold mb-1 text-gray-700">{Math.round(item.dioh)}d</div>
            <div 
              className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
              style={{ 
                height: `${height}%`,
                backgroundColor: color,
                minHeight: '20px'
              }}
            />
            <div className="text-xs text-gray-600 mt-2 truncate w-full text-center" title={item.sku}>
              {item.sku}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function EcommerceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    setData(null);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Ecommerce Analytics
          </h1>
          <p className="text-gray-600">
            Upload your CSV files to unlock powerful insights
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Section */}
        {!data && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-all">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <div className="text-indigo-600 mb-6">
                  <Upload />
                </div>
                <span className="text-xl font-semibold text-gray-900 mb-2">
                  Upload CSV Files
                </span>
                <span className="text-sm text-gray-500 text-center mb-6">
                  Drop your files here or click to browse
                </span>
                <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Choose Files
                </div>
                <input
                  type="file"
                  multiple
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
              <p className="text-gray-700 text-xl font-medium">Analyzing your data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <span className="text-2xl mr-3">❌</span>
              <div>
                <p className="text-red-800 font-semibold">Error</p>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {data && (
          <div className="space-y-8">
            {/* Financial Dashboard */}
            {data.financial && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-gray-900">💰 Financial Performance</h2>
                  <button
                    onClick={() => setData(null)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Upload New Files
                  </button>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium mb-1">Gross Sales</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.financial.gross_sales)}</p>
                    <p className="text-xs text-green-600 mt-2">Before discounts</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium mb-1">Net Revenue</p>
                    <p className="text-3xl font-bold text-indigo-600">{formatCurrency(data.financial.net_revenue)}</p>
                    <p className="text-xs text-gray-500 mt-2">After discounts</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium mb-1">Net Profit</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(data.financial.net_profit)}</p>
                    <p className="text-xs text-gray-500 mt-2">Est. after COGS</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium mb-1">Avg Order Value</p>
                    <p className="text-3xl font-bold text-purple-600">{formatCurrency(data.financial.aov)}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatNumber(data.financial.num_orders)} orders</p>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Platform Revenue Pie Chart */}
                  {data.financial.platform_breakdown && data.financial.platform_breakdown.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue by Platform</h3>
                      <PieChart data={data.financial.platform_breakdown} colors={COLORS} />
                    </div>
                  )}

                  {/* Top Products Bar Chart */}
                  {data.financial.top_products && data.financial.top_products.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 Products</h3>
                      <BarChart 
                        data={data.financial.top_products.slice(0, 5)} 
                        valueKey="revenue" 
                        labelKey="name"
                        color="#8B5CF6"
                        formatValue={formatCurrency}
                      />
                    </div>
                  )}
                </div>

                {/* Full Top Products Table */}
                {data.financial.top_products && data.financial.top_products.length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Top Products by Revenue</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left text-gray-700 py-3 px-4 font-semibold">#</th>
                            <th className="text-left text-gray-700 py-3 px-4 font-semibold">Product</th>
                            <th className="text-right text-gray-700 py-3 px-4 font-semibold">Revenue</th>
                            <th className="text-right text-gray-700 py-3 px-4 font-semibold">Orders</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.financial.top_products.map((product, idx) => (
                            <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="text-gray-600 py-3 px-4">{idx + 1}</td>
                              <td className="text-gray-900 py-3 px-4 font-medium">{product.name}</td>
                              <td className="text-green-600 font-bold py-3 px-4 text-right">
                                {formatCurrency(product.revenue)}
                              </td>
                              <td className="text-gray-600 py-3 px-4 text-right">{product.orders}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Inventory Dashboard */}
            {data.inventory && (
              <div className="space-y-6 mt-12">
                <h2 className="text-3xl font-bold text-gray-900">📦 Inventory Analysis</h2>

                {/* Inventory Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Inventory Units</p>
                    <p className="text-3xl font-bold text-blue-600">{formatNumber(data.inventory.total_inventory_units)}</p>
                    <p className="text-xs text-gray-500 mt-2">Items in stock</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium mb-1">Inventory Value</p>
                    <p className="text-3xl font-bold text-teal-600">{formatCurrency(data.inventory.total_inventory_value)}</p>
                    <p className="text-xs text-gray-500 mt-2">Total stock value</p>
                  </div>
                </div>

                {/* DIOH Chart */}
                {data.inventory.dioh_by_sku && data.inventory.dioh_by_sku.filter(i => i.dioh && i.dioh < 200).length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Days of Inventory on Hand (DIOH)</h3>
                    <p className="text-sm text-gray-600 mb-4">Lower values indicate faster-moving inventory. Red: {'<'}30 days, Yellow: 30-60 days, Green: {'>'}60 days</p>
                    <DIOHChart data={data.inventory.dioh_by_sku} />
                  </div>
                )}

                {/* Stockout Warnings */}
                {data.inventory.stockout_predictions && data.inventory.stockout_predictions.length > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6 shadow-md">
                    <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                      ⚠️ Stockout Warnings ({data.inventory.stockout_predictions.length} items)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full bg-white rounded-lg overflow-hidden">
                        <thead className="bg-red-100">
                          <tr>
                            <th className="text-left text-red-900 py-3 px-4 font-semibold">SKU</th>
                            <th className="text-left text-red-900 py-3 px-4 font-semibold">Product</th>
                            <th className="text-right text-red-900 py-3 px-4 font-semibold">Stock</th>
                            <th className="text-right text-red-900 py-3 px-4 font-semibold">DIOH</th>
                            <th className="text-right text-red-900 py-3 px-4 font-semibold">Est. Stockout</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.inventory.stockout_predictions.map((item, idx) => (
                            <tr key={idx} className="border-t border-red-100">
                              <td className="text-gray-900 py-3 px-4 font-mono text-sm">{item.sku}</td>
                              <td className="text-gray-900 py-3 px-4">{item.title}</td>
                              <td className="text-orange-600 font-bold py-3 px-4 text-right">{item.inventory_qty}</td>
                              <td className="text-red-600 font-bold py-3 px-4 text-right">{Math.round(item.dioh)} days</td>
                              <td className="text-red-700 py-3 px-4 text-right">
                                {new Date(item.predicted_stockout_date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Top Inventory Items */}
                {data.inventory.top_inventory && data.inventory.top_inventory.length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📦 Top Inventory Items</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left text-gray-700 py-3 px-4 font-semibold">SKU</th>
                            <th className="text-left text-gray-700 py-3 px-4 font-semibold">Product</th>
                            <th className="text-right text-gray-700 py-3 px-4 font-semibold">Quantity</th>
                            <th className="text-right text-gray-700 py-3 px-4 font-semibold">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.inventory.top_inventory.slice(0, 10).map((item, idx) => (
                            <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="text-gray-900 py-3 px-4 font-mono text-sm">{item.sku}</td>
                              <td className="text-gray-900 py-3 px-4">{item.title}</td>
                              <td className="text-blue-600 font-bold py-3 px-4 text-right">{formatNumber(item.inventory_qty)}</td>
                              <td className="text-green-600 py-3 px-4 text-right">{formatCurrency(item.value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 text-center">
              <p className="text-gray-700 text-sm">
                📊 Analyzed <span className="font-bold">{formatNumber(data.meta.num_sales_rows)}</span> sales records
                {data.meta.num_products_rows > 0 && (
                  <> and <span className="font-bold">{formatNumber(data.meta.num_products_rows)}</span> products</>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}