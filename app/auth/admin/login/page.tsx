"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetcher } from "../../../../lib/api/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiFetcher("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const loginData = res?.data ?? res;
      const token = loginData?.access_token ?? loginData?.token;
      const user = loginData?.user
        ? { ...loginData.user, role: loginData.user.role ?? loginData.role }
        : loginData;

      const role = (user?.role || loginData?.role || "").toLowerCase();

      if (!token || role !== "admin_space") {
        throw new Error("Akun ini bukan terdaftar sebagai Admin Space.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify({ ...user, role: "admin_space" }));
      router.replace("/admin/reservations");
    } catch (err: any) {
      setError(err.message || "Username atau password Admin salah!");
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
            Portal Khusus Pengelola
          </span>
          <h1 className="text-3xl xl:text-4xl font-black text-slate-900 leading-tight">
            Kelola Coworking Space Anda dengan Mudah.
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Pantau transaksi pemesanan, ketersediaan meja & ruangan, serta check-in tamu secara real-time.
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
              Login Admin Space ⚙️
            </h2>
            <p className="text-xs text-slate-500">
              Masuk ke dashboard pengelolaan coworking space
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
                Username Admin
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
                placeholder="Username akun admin"
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
                className="w-full bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#087EA4] hover:bg-[#0284C7] text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Panel Pengelola"}
            </button>
          </form>

          {/* Registration Links */}
          <div className="text-center text-xs text-slate-500 space-y-1.5 pt-4 border-t border-slate-100">
            <p>
              Belum punya akun pengelola?{" "}
              <Link
                href="/auth/register?role=admin"
                className="text-[#087EA4] font-bold hover:underline"
              >
                Daftar Admin Space
              </Link>
            </p>
            <p className="text-[11px] text-slate-400">
              Ingin memesan space?{" "}
              <Link href="/auth/login" className="text-slate-700 font-bold hover:underline">
                Login Member
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
