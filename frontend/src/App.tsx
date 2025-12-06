import { useEffect } from "react";
import UploadPage from "./pages/UploadPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardProvider } from "./state/dashboard";
import { NavigationProvider, useNavigation } from "./navigation";

function Header() {
  const { path, navigate } = useNavigation();
  const links = [
    { label: "Upload", href: "/upload" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Login", href: "/login" },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 bg-slate-950/70">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/40 flex items-center justify-center">
            <span className="text-white text-xl font-semibold">SAAS</span>
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Commerce Insights Studio</p>
            <p className="text-slate-400 text-xs">Unified analytics for every CSV format</p>
          </div>
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
      <DashboardProvider>
        <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
          <Header />
          <main className="max-w-6xl mx-auto px-6 py-10">
            <PageRouter />
          </main>
        </div>
      </DashboardProvider>
    </NavigationProvider>
  );
}
