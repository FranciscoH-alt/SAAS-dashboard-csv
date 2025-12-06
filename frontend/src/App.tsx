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
import UploadPage from "./pages/UploadPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardProvider } from "./state/dashboard";
import { NavigationProvider, useNavigation } from "./navigation";
        </div>
        <nav className="flex items-center gap-2 text-sm font-medium">
          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => navigate(link.href)}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                path === link.href
                  ? "bg-white/10 text-white shadow-inner shadow-purple-400/30"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function PageRouter() {
  const { path, navigate } = useNavigation();

  useEffect(() => {
    if (path === "/") {
      navigate("/upload");
    }
  }, [path, navigate]);

  if (path === "/login") {
    return <LoginPage onLoggedIn={() => navigate("/dashboard")} />;
  }

  if (path === "/dashboard") {
    return <DashboardPage />;
  }

  return <UploadPage />;
}

export default function App() {
  return (
    <NavigationProvider>
    </NavigationProvider>
  );
}
