import { useState } from "react";
import { api, setToken } from "../api";

interface Props {
  onLoggedIn: () => void;
}

export function LoginPage({ onLoggedIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "register") {
        await api.register(email, password);
      }
      const res = await api.login(email, password);
      setToken(res.access_token);
      onLoggedIn();
    } catch (err: any) {
      setError(err.message || "Error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="w-full max-w-md bg-slate-800 p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-semibold mb-4">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full p-2 rounded bg-slate-700 outline-none"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full p-2 rounded bg-slate-700 outline-none"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button className="w-full py-2 rounded bg-indigo-500 hover:bg-indigo-600">
            {mode === "login" ? "Login" : "Register + Login"}
          </button>
        </form>
        <button
          className="mt-4 text-sm text-slate-300"
          onClick={() =>
            setMode((m) => (m === "login" ? "register" : "login"))
          }
        >
          {mode === "login"
            ? "Need an account? Register"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}
