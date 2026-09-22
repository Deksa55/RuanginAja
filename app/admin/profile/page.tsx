"use client";

import { useState, useEffect } from "react";
import { apiFetcher } from "../../../lib/api/client";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState({
    nama_coworking: "",
    nama_pemilik: "",
    telp: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadAdminProfile();
  }, []);

  async function loadAdminProfile() {
    setLoading(true);
    try {
      const res = await apiFetcher("/api/admin/profile");
      if (res?.status && res.data) {
        setProfile({
          nama_coworking: res.data.nama_coworking || "",
          nama_pemilik: res.data.nama_pemilik || "",
          telp: res.data.telp || "",
        });
      }
    } catch (err) {
      console.error("Gagal memuat profil admin:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await apiFetcher("/api/admin/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      if (res?.status) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui profil coworking space.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
          Konfigurasi Operasional
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Profil Lokasi Coworking Space
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Perbarui identitas lokasi, nama penanggung jawab operasional, dan kontak resmi.
        </p>
      </div>

      {/* Form Card (Wireframe B-3) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-2xl space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-black text-slate-900">
            Informasi Tempat & Pengelola
          </h2>
          <p className="text-xs text-slate-400">
            Data ini akan tercantum pada bukti tiket pemesanan (E-Ticket) member.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
            <span>✅</span>
            <span>Profil Coworking Space berhasil diperbarui di server!</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-8 h-8 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-bold">Memuat data profil...</p>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Nama Coworking Space / Branding
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Moklet Hub Coworking Space"
                value={profile.nama_coworking}
                onChange={(e) =>
                  setProfile({ ...profile, nama_coworking: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-semibold outline-none focus:border-[#087EA4] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Nama Lengkap Pemilik / Penanggung Jawab
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Ahmad Bidin, S.Kom"
                value={profile.nama_pemilik}
                onChange={(e) =>
                  setProfile({ ...profile, nama_pemilik: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-semibold outline-none focus:border-[#087EA4] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Nomor Telepon / Call Center Resmi
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 081298765432"
                value={profile.telp}
                onChange={(e) => setProfile({ ...profile, telp: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-semibold outline-none focus:border-[#087EA4] focus:bg-white transition-all"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#087EA4] hover:bg-[#075985] text-white px-8 py-3 rounded-2xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}