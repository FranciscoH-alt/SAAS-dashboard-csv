import React, { useEffect, useState } from "react";
import { api } from "../api";

interface Upload {
  id: number;
  filename: string;
  status: string;
  rows_processed: number;
  created_at: string;
}

export function UploadPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [file, setFile] = useState<File | null>(null);
import React, { useState } from 'react';
import { useDashboardData } from "../state/dashboard";
import { useNavigation } from "../navigation";

const UploadPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { setData } = useDashboardData();
  const { navigate } = useNavigation();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.csv')
    );
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one CSV file');
      return;
    }

    setLoading(true);
    setError(null);

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
      
      // Store data and navigate to dashboard
      sessionStorage.setItem('dashboardData', JSON.stringify(result));
      setData(result);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
          <span className="text-white text-2xl font-bold">📊</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Ecommerce Analytics Ingest</h1>
          <p className="text-slate-300 text-sm">Upload your CSVs to unlock the dashboard instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Upload Your CSV Files</h2>
            <p className="text-slate-300 mb-8">
              Drag in ecommerce_sales.csv, train_df exports, or Shopify products. We detect formats automatically.
            </p>

            {/* Drag & Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
                dragActive
                  ? 'border-indigo-400/80 bg-indigo-500/10'
                  : 'border-white/20 hover:border-indigo-300 bg-white/5'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
              />

              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-indigo-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>

                <p className="text-lg font-semibold text-white mb-2">
                  Drag and drop your CSV files here
                </p>
                <p className="text-sm text-slate-300 mb-4">or</p>

                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Browse Files
                </label>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Selected Files ({files.length})</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-white">{file.name}</p>
                          <p className="text-sm text-slate-300">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-300 hover:text-red-100 p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-400/40 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 99 0 0118 0z" />
                  </svg>
                  <p className="text-red-50 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || loading}
              className={`mt-8 w-full py-4 rounded-xl font-semibold text-white transition-all ${
                files.length === 0 || loading
                  ? 'bg-white/10 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </div>
              ) : (
                'Analyze Data'
              )}
            </button>
          </div>

          {/* Supported Files Info */}
          <div className="bg-white/5 px-8 py-6 border-t border-white/10">
            <h3 className="text-sm font-semibold text-white mb-3">Supported File Formats:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-200">
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <div>
                  <span className="font-medium">ecommerce_sales.csv</span>
                  <p className="text-xs text-slate-400">Order_ID, Order_Date, Platform, Product...</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <div>
                  <span className="font-medium">train_df_Orders</span>
                  <p className="text-xs text-slate-400">order_id, customer_id, order_status...</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <div>
                  <span className="font-medium">train_df_Products</span>
                  <p className="text-xs text-slate-400">product_id, product_category_name...</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <div>
                  <span className="font-medium">Shopify Products</span>
                  <p className="text-xs text-slate-400">Handle, Title, Variant SKU...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-sm text-slate-300">Live ingestion checklist</p>
          <ul className="space-y-3 text-sm text-slate-200">
            <li className="flex gap-3 items-start">
              <span className="text-green-400">✓</span>
              <span>Drag & drop multiple CSV files or browse to select them.</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-green-400">✓</span>
              <span>See selected file names and sizes before you upload.</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-green-400">✓</span>
              <span>Automatic format detection for ecommerce_sales, train_df Orders/Items/Products/Payments, and Shopify exports.</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-green-400">✓</span>
              <span>After upload, you are sent straight to the dashboard with parsed insights.</span>
            </li>
          </ul>
          <div className="pt-2 text-xs text-slate-400">
            Tip: keep the backend running at http://localhost:8000 so the Analyze action returns live data.
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
