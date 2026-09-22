"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/layout/Navbar";
import {
  apiFetcher,
  getStoredToken,
  getStoredUser,
  clearAuthSession,
  resolveMemberAvatar,
} from "../../../lib/api/client";

export default function MemberProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await apiFetcher("/api/auth/profile");
      if (res?.status) setProfile(res.data);
    } catch (err) {
      console.error("Gagal memuat profil:", err);
      // Fallback from localStorage
      setProfile(getStoredUser());
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    clearAuthSession();
    router.replace("/auth/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
                Akun Terdaftar
              </span>
              <h1 className="text-2xl font-black text-slate-900">Profil Pelanggan</h1>
              <p className="text-xs text-slate-400">Informasi akun member RuanginAja</p>
            </div>
            <Link
              href="/member/reservations"
              className="text-xs font-bold text-[#087EA4] hover:underline"
            >
              ← Reservasi Saya
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400 font-bold">Memuat data profil...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Avatar Header */}
              <div className="bg-linear-to-r from-sky-50 to-slate-50 p-6 rounded-2xl border border-sky-100 flex items-center gap-4">
                <img
                  src={resolveMemberAvatar(profile?.member || profile)}
                  alt={profile?.member?.nama_member || profile?.username || "Avatar"}
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md"
                />
                <div className="space-y-1">
                  <h2 className="font-black text-lg text-slate-900 leading-tight">
                    {profile?.member?.nama_member || profile?.nama || profile?.username}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    @{profile?.username} · Role:{" "}
                    <span className="font-bold text-[#087EA4] uppercase">
                      {profile?.role || "Member"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Data Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Nomor WhatsApp / Telepon
                  </span>
                  <span className="font-bold text-slate-800">
                    {profile?.member?.telp || profile?.telp || "-"}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Asal Instansi / Perusahaan
                  </span>
                  <span className="font-bold text-slate-800">
                    {profile?.member?.instansi || profile?.instansi || "-"}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 sm:col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Alamat Domisili
                  </span>
                  <span className="font-bold text-slate-800 leading-relaxed">
                    {profile?.member?.alamat || profile?.alamat || "-"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
                <Link
                  href="/member/history"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all"
                >
                   Lihat Histori & Rekapitulasi
                </Link>

                <button
                  onClick={handleLogout}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border border-rose-200"
                >
                   Keluar dari Akun
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}