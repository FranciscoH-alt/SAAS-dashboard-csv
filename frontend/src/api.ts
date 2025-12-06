const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

async function request(path: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  listUploads: () => request("/uploads"),
  getDashboardSummary: () => request("/dashboard/summary"),
  uploadProfile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).then((res) => {
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    });
  },
  analyzeEcommerce: (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    return fetch(`${API_URL}/analyze-ecommerce`, { method: "POST", body: formData }).then((res) => {
      if (!res.ok) throw new Error("Analysis failed");
      return res.json();
    });
  },
};
