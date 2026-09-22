"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetcher } from "../../../lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Endpoint No. 10: POST /api/auth/login
      const res: any = await apiFetcher("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const token =
        res?.data?.access_token ||
        res?.data?.token ||
        res?.access_token ||
        res?.token;

      const user = res?.data?.user || res?.user || res?.data;
      const role = (user?.role || res?.role || "member").toLowerCase();

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("access_token", token);
        if (user) {
          localStorage.setItem("user", JSON.stringify({ ...user, role }));
        }

        if (role === "admin_space") {
          router.push("/admin/reservations");
        } else {
          router.push("/spaces");
        }
      } else {
        throw new Error(res?.message || "Token autentikasi tidak ditemukan.");
      }
    } catch (err: any) {
      setError(err.message || "Username atau kata sandi tidak valid!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans antialiased text-slate-900 bg-white">
      {/* Left Side: Clean Professional Showcase (Desktop Full-Screen) */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen bg-slate-50 border-r border-slate-200/80 p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
        {/* Brand */}
        <Link href="/" className="inline-flex items-center">
          <img
            src="/logo.png"
            alt="RuanginAja"
            className="h-11 w-auto object-contain hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Minimal Hero Copy */}
        <div className="space-y-4 max-w-md">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#087EA4] bg-sky-50 border border-sky-200/80 px-3.5 py-1.5 rounded-full inline-block">
            Coworking Space Management
          </span>
          <h1 className="text-3xl xl:text-4xl font-black text-slate-900 leading-tight">
            Ruang Kerja Fleksibel untuk Produktivitas Anda.
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Sistem reservasi ruang kerja, meeting room, dan validasi tiket digital secara real-time.
          </p>
        </div>

        {/* Minimal Footer */}
        <p className="text-xs text-slate-400">
          © 2026 RuanginAja. Hak cipta dilindungi.
        </p>

        {/* Subtle Ambient Glow */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-100/60 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Right Side: Clean Form Viewport (Full-Screen) */}
      <div className="w-full lg:w-1/2 min-h-screen bg-white flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand */}
          <div className="lg:hidden text-center pb-2">
            <Link href="/" className="inline-flex items-center justify-center">
              <img
                src="/logo.png"
                alt="RuanginAja"
                className="h-10 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Selamat Datang Kembali!
            </h2>
            <p className="text-xs text-slate-500">
              Silakan masukkan username dan password akun Anda
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 text-rose-600 text-xs rounded-2xl font-semibold border border-rose-200 animate-fadeIn">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Username akun Anda"
                className="w-full bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#087EA4] hover:bg-[#0284C7] text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
            </button>
          </form>

          {/* Registration Links */}
          <div className="text-center text-xs text-slate-500 space-y-1.5 pt-4 border-t border-slate-100">
            <p>
              Belum punya akun?{" "}
              <Link
                href="/auth/register?role=member"
                className="text-[#087EA4] font-bold hover:underline"
              >
                Daftar Member
              </Link>
            </p>
            <p className="text-[11px] text-slate-400">
              Pengelola coworking?{" "}
              <Link
                href="/auth/register?role=admin"
                className="text-slate-700 font-bold hover:underline"
              >
                Daftar Admin Space
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
