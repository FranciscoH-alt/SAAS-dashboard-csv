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
