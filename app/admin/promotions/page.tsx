"use client";

import { useState, useEffect } from "react";
import {
  apiFetcher,
  getActiveMakerId,
} from "../../../lib/api/client";

interface DiskonItem {
  id: number;
  nama_diskon: string;
  persentase_diskon: number;
  tanggal_awal: string;
  tanggal_akhir: string;
  is_active?: boolean;
  maker_id?: number | null;
}

const emptyForm = {
  nama_diskon: "",
  persentase_diskon: 20,
  tanggal_awal: "",
  tanggal_akhir: "",
};

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<DiskonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMakerId, setActiveMakerId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<DiskonItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadPromotions();
  }, []);

  async function loadPromotions() {
    setLoading(true);
    try {
      const targetMakerId = await getActiveMakerId();
      setActiveMakerId(targetMakerId);

      const res: any = await apiFetcher("/api/admin/diskon");
      let list: DiskonItem[] = [];
      if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res?.data?.items)) list = res.data.items;
      else if (Array.isArray(res)) list = res;

      // ISOLASI DATA: Hanya tampilkan promo milik APP_KEY aktif
      const filtered = list.filter((p: any) => p.maker_id === targetMakerId);
      setPromos(filtered);
    } catch (err) {
      console.error("Gagal memuat promo:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAdd = () => {
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    setEditingPromo(null);
    setForm({
      nama_diskon: "",
      persentase_diskon: 20,
      tanggal_awal: today.toISOString().split("T")[0] + "T00:00:00Z",
      tanggal_akhir: nextMonth.toISOString().split("T")[0] + "T23:59:59Z",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo: DiskonItem) => {
    setEditingPromo(promo);
    setForm({
      nama_diskon: promo.nama_diskon || "",
      persentase_diskon: promo.persentase_diskon || 10,
      tanggal_awal: promo.tanggal_awal || "",
      tanggal_akhir: promo.tanggal_akhir || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nama_diskon: form.nama_diskon.trim().toUpperCase(),
        persentase_diskon: Number(form.persentase_diskon),
        tanggal_awal: form.tanggal_awal,
        tanggal_akhir: form.tanggal_akhir,
      };

      if (editingPromo) {
        await apiFetcher(`/api/admin/diskon/${editingPromo.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        alert("Kode promo berhasil diperbarui!");
      } else {
        await apiFetcher("/api/admin/diskon", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        alert("Kode promo baru berhasil dibuat!");
      }

      setIsModalOpen(false);
      loadPromotions();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan kode promo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Hapus kode promo "${code}"?`)) return;
    try {
      await apiFetcher(`/api/admin/diskon/${id}`, { method: "DELETE" });
      alert("Kode promo berhasil dihapus.");
      loadPromotions();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus kode promo.");
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "-";
    try {
      return new Date(isoStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
            Program Diskon & Promo RuanginAja
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Kelola Kode Promo & Event Diskon
          </h1>
          <p className="text-xs text-slate-500 pt-1">
            Buat voucher potongan harga untuk meningkatkan pemesanan coworking space Anda.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#087EA4] hover:bg-[#0284C7] text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <span>+</span> Buat Promo Baru
        </button>
      </div>

      {/* Promo Cards List (Wireframe B-5) */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-bold">Memuat daftar promo...</p>
        </div>
      ) : promos.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-3">
          <div className="text-4xl">🏷️</div>
          <h3 className="font-bold text-slate-800 text-sm">Belum Ada Promo Aktif</h3>
          <p className="text-xs text-slate-400">
            Buat kode diskon pertama Anda untuk memikat pengunjung coworking space.
          </p>
          <button
            onClick={handleOpenAdd}
            className="bg-[#087EA4] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
          >
            Buat Kode Promo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-sky-50 text-[#087EA4] border border-sky-200 rounded-full text-[10px] font-black uppercase">
                    Diskon {p.persentase_diskon}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: #{p.id}</span>
                </div>

                <div>
                  <code className="text-xl font-mono font-black text-slate-900 tracking-wider block">
                    {p.nama_diskon}
                  </code>
                  <p className="text-xs text-slate-400 mt-1">
                    Potongan harga {p.persentase_diskon}% otomatis di checkout reservasi.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-500 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Periode Awal:</span>
                  <span className="font-bold text-slate-700">{formatDate(p.tanggal_awal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batas Akhir:</span>
                  <span className="font-bold text-slate-700">{formatDate(p.tanggal_akhir)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                >
                  ✏️ Ubah
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.nama_diskon)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-200"
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Promo (Wireframe B-5) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
                  Formulir Voucher
                </span>
                <h3 className="font-black text-xl text-slate-900">
                  {editingPromo ? "Ubah Kode Promo" : "Buat Kode Promo Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Kode Promo Unik (Huruf Kapital & Angka)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PROMOAGUSTUS2026"
                  value={form.nama_diskon}
                  onChange={(e) =>
                    setForm({ ...form, nama_diskon: e.target.value.toUpperCase() })
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold outline-none focus:border-[#087EA4]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Persentase Potongan (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  placeholder="20"
                  value={form.persentase_diskon}
                  onChange={(e) =>
                    setForm({ ...form, persentase_diskon: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#087EA4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={form.tanggal_awal.split("T")[0]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tanggal_awal: e.target.value ? `${e.target.value}T00:00:00Z` : "",
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#087EA4]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="date"
                    required
                    value={form.tanggal_akhir.split("T")[0]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tanggal_akhir: e.target.value ? `${e.target.value}T23:59:59Z` : "",
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#087EA4]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#087EA4] hover:bg-[#075985] text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  {saving ? "Menyimpan..." : "Simpan Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}