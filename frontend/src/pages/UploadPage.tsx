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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">📊</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ecommerce Analytics</h1>
              <p className="text-sm text-gray-600">Upload your data to get started</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your CSV Files</h2>
            <p className="text-gray-600 mb-8">
              Upload one or more CSV files to analyze your ecommerce data
            </p>

            {/* Drag & Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400 bg-gray-50'
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
                <svg className="mx-auto h-16 w-16 text-indigo-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Drag and drop your CSV files here
                </p>
                <p className="text-sm text-gray-600 mb-4">or</p>
                
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
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Selected Files ({files.length})</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 p-2"
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
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || loading}
              className={`mt-8 w-full py-4 rounded-xl font-semibold text-white transition-all ${
                files.length === 0 || loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
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
          <div className="bg-gray-50 px-8 py-6 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Supported File Formats:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <div>
                  <span className="font-medium">ecommerce_sales.csv</span>
                  <p className="text-xs text-gray-500">Order_ID, Order_Date, Platform, Product...</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <div>
                  <span className="font-medium">train_df_Orders</span>
                  <p className="text-xs text-gray-500">order_id, customer_id, order_status...</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <div>
                  <span className="font-medium">train_df_Products</span>
                  <p className="text-xs text-gray-500">product_id, product_category_name...</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <div>
                  <span className="font-medium">Shopify Products</span>
                  <p className="text-xs text-gray-500">Handle, Title, Variant SKU...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;