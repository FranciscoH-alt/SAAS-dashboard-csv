import { useState } from "react";
import "./App.css";
import { UploadPage } from "./pages/UploadPage";
import { EcommercePage } from "./pages/EcommercePage";

function App() {
  const [page, setPage] = useState<"ecommerce" | "upload">("ecommerce");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="text-lg font-semibold">Ecommerce KPI Studio</div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage("ecommerce")}
            className={`px-3 py-1 rounded ${page === "ecommerce" ? "bg-indigo-500" : "bg-slate-700"}`}
          >
            Ecommerce Analytics
          </button>
          <button
            onClick={() => setPage("upload")}
            className={`px-3 py-1 rounded ${page === "upload" ? "bg-indigo-500" : "bg-slate-700"}`}
          >
            Upload Debugger
          </button>
        </div>
      </header>

      {page === "ecommerce" ? <EcommercePage /> : <UploadPage />}
    </div>
  );
}

export default App;
