import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(false);

  async function loadUploads() {
    try {
      const data = await api.listUploads();
      setUploads(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadUploads();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/uploads`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(window as any).accessToken || ""}`,
          },
          body: formData,
        }
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await loadUploads();
      setFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl mb-4">Upload CSV</h2>
      <form onSubmit={handleUpload} className="flex items-center gap-4 mb-6">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm"
        />
        <button
          disabled={!file || loading}
          className="px-4 py-2 rounded bg-indigo-500 disabled:bg-slate-500"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      <h3 className="text-lg mb-2">Upload history</h3>
      <table className="w-full text-sm bg-slate-800 rounded-lg overflow-hidden">
        <thead className="bg-slate-700">
          <tr>
            <th className="p-2 text-left">File</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Rows</th>
            <th className="p-2 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          {uploads.map((u) => (
            <tr key={u.id} className="border-t border-slate-700">
              <td className="p-2">{u.filename}</td>
              <td className="p-2">{u.status}</td>
              <td className="p-2">{u.rows_processed}</td>
              <td className="p-2">
                {new Date(u.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
          {uploads.length === 0 && (
            <tr>
              <td className="p-2" colSpan={4}>
                No uploads yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
