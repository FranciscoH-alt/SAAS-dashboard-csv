import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface NavigationContextValue {
  path: string;
  navigate: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname || "/upload");

  const navigate = useCallback(
    (newPath: string) => {
      if (newPath === path) return;
      window.history.pushState({}, "", newPath);
      setPath(newPath);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [path]
  );

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || "/upload");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);

  return (
    <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return ctx;
}
