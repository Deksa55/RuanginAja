"use client";

import { useState, useEffect } from "react";
import { getAppKey, setAppKey, apiFetcher, API_BASE_URL } from "../../lib/api/client";

interface MakerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: (newKey: string) => void;
}

export default function MakerConfigModal({
  isOpen,
  onClose,
  onKeyUpdated,
}: MakerConfigModalProps) {
  const [currentKey, setCurrentKeyState] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);

  // Form for registering new maker
  const [tab, setTab] = useState<"switch" | "register">("switch");
  const [regForm, setRegForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = getAppKey();
      setCurrentKeyState(active);
      checkKey(active);
    }
  }, [isOpen]);

  async function checkKey(keyToCheck: string) {
    if (!keyToCheck) return;
    setChecking(true);
    setStatusMsg("");
    try {
      // Test maker stats with this key
      const res: any = await fetch(`${API_BASE_URL}/api/maker/stats`, {
        headers: { "x-maker-key": keyToCheck },
      }).then((r) => r.json());

      if (res?.status) {
        setStats(res.data);
        setStatusMsg("App Key Aktif & Terhubung ke Server!");
        setIsSuccess(true);
      } else {
        setStats(null);
        setStatusMsg(res?.message || "Kunci tidak terdaftar, namun dapat digunakan.");
        setIsSuccess(false);
      }
    } catch (err: any) {
      setStats(null);
      setStatusMsg("Gagal menghubungi server panitia.");
      setIsSuccess(false);
    } finally {
      setChecking(false);
    }
  }

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKey.trim()) return;
    setAppKey(currentKey.trim());
    if (onKeyUpdated) onKeyUpdated(currentKey.trim());
    alert(`App Key berhasil disimpan: ${currentKey.trim()}`);
    onClose();
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleRegisterMaker = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    try {
      const res: any = await apiFetcher("/api/maker/register", {
        method: "POST",
        body: JSON.stringify(regForm),
      });

      if (res?.data?.app_key) {
        const newKey = res.data.app_key;
        setAppKey(newKey);
        setCurrentKeyState(newKey);
        alert(`Registrasi Berhasil! App Key Anda: ${newKey}`);
        if (onKeyUpdated) onKeyUpdated(newKey);
        onClose();
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } else {
        throw new Error(res?.message || "Registrasi maker gagal");
      }
    } catch (err: any) {
      alert(err.message || "Gagal membuat akun App Maker.");
    } finally {
      setRegLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header Modal */}
        <div className="bg-linear-to-r from-slate-900 to-slate-800 p-6 text-white flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
              UKK Multi-Tenancy System
            </span>
            <h2 className="text-xl font-black">App Maker Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 text-xl font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setTab("switch")}
            className={`flex-1 py-3 text-center transition-all ${
              tab === "switch"
                ? "bg-white text-[#087EA4] border-b-2 border-[#087EA4]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🔑 Kelola App Key
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 py-3 text-center transition-all ${
              tab === "register"
                ? "bg-white text-[#087EA4] border-b-2 border-[#087EA4]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            ✨ Registrasi Akun Siswa Baru
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {tab === "switch" ? (
            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Active App Key (x-maker-key)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={currentKey}
                    onChange={(e) => setCurrentKeyState(e.target.value)}
                    placeholder="Contoh: mk_xxxxxxxxxxxx"
                    className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#087EA4]"
                  />
                  <button
                    type="button"
                    onClick={() => checkKey(currentKey)}
                    disabled={checking}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all"
                  >
                    {checking ? "Cek..." : "Tes Koneksi"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Default panitia: <code className="bg-slate-100 px-1 py-0.5 rounded text-[#087EA4]">mk_default_ukk_2026</code>
                </p>
              </div>

              {/* Status Box */}
              {statusMsg && (
                <div
                  className={`p-3 rounded-2xl text-xs flex items-center gap-2.5 ${
                    isSuccess
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <span>{isSuccess ? "✅" : "⚠️"}</span>
                  <p className="font-semibold">{statusMsg}</p>
                </div>
              )}

              {/* Data Stats Preview */}
              {stats && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Statistik Data Terisolasi untuk Key Ini:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-700">
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      👥 Total Member: <b>{stats.total_members ?? 0}</b>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      🏢 Total Space: <b>{stats.total_spaces ?? 0}</b>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      🏷️ Total Diskon: <b>{stats.total_diskon ?? 0}</b>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      📅 Total Reservasi: <b>{stats.total_reservasi ?? 0}</b>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#087EA4] hover:bg-[#075985] text-white px-6 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-sky-500/20"
                >
                  Terapkan & Muat Ulang
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterMaker} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Deksa Siswa RPL"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="username_kamu"
                    value={regForm.username}
                    onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Email Siswa
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@smk.sch.id"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4]"
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full bg-[#087EA4] hover:bg-[#075985] text-white py-3 rounded-2xl text-xs font-bold transition-all shadow-md mt-2"
              >
                {regLoading ? "Mendaftarkan ke Server..." : "Daftar & Dapatkan App Key Baru"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
