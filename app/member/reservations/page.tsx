"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/layout/Navbar";
import {
  apiFetcher,
  formatRupiah,
  getStoredToken,
  getStoredUser,
  resolveReservationTotal,
  resolveReservationSpaceName,
  formatTanggal,
} from "../../../lib/api/client";

export default function MemberReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || user?.role !== "member") {
      router.replace("/auth/login");
      return;
    }
    loadReservations();
  }, []);

  async function loadReservations() {
    setLoading(true);
    try {
      const res: any = await apiFetcher("/api/reservasi/my");
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : res?.data?.items || [];
      setReservations(list);
    } catch (err) {
      console.error("Gagal memuat reservasi:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCancelReservation = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan pemesanan ini?")) return;
    setCancellingId(id);
    try {
      await apiFetcher(`/api/reservasi/${id}/cancel`, { method: "PATCH" });
      alert("Pemesanan berhasil dibatalkan.");
      loadReservations();
    } catch (err: any) {
      alert(err.message || "Gagal membatalkan pemesanan.");
    } finally {
      setCancellingId(null);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (statusFilter === "all") return true;
    const status = (r.status || "").toLowerCase();
    if (statusFilter === "belum_dikonfirmasi") {
      return status === "belum_dikonfirmasi" || status === "belum_dikonfirm";
    }
    return status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "disetujui") {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
          Disetujui
        </span>
      );
    }
    if (s === "aktif") {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-50 text-sky-600 border border-sky-200">
          Sedang Digunakan (Aktif)
        </span>
      );
    }
    if (s === "selesai") {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
          Selesai
        </span>
      );
    }
    if (s === "dibatalkan") {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-600 border border-rose-200">
          Dibatalkan
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-200">
        Belum Dikonfirmasi
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-6">
        {/* Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
                Manajemen Reservasi
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Status Pemesanan Saya
              </h1>
              <p className="text-xs text-slate-400 pt-1">
                Pantau proses verifikasi admin dan ambil QR E-Ticket untuk check-in.
              </p>
            </div>
            <Link
              href="/spaces"
              className="bg-[#087EA4] hover:bg-[#075985] text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              + Pesan Space Baru
            </Link>
          </div>

          {/* Filter Status Tabs (Wireframe A-5) */}
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {[
              { label: "Semua", value: "all" },
              { label: "⏳ Belum Dikonfirmasi", value: "belum_dikonfirmasi" },
              { label: "✅ Disetujui", value: "disetujui" },
              { label: "⚡ Aktif Digunakan", value: "aktif" },
              { label: "🏁 Selesai", value: "selesai" },
              { label: "❌ Dibatalkan", value: "dibatalkan" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.value
                    ? "bg-[#087EA4] text-white shadow-md shadow-sky-500/20 scale-[1.02]"
                    : "bg-white text-slate-600 hover:text-[#087EA4] hover:bg-sky-50/50 border border-slate-200/90"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reservations List */}
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-10 h-10 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-bold">Memuat status pesanan Anda...</p>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-3">
            <div className="text-4xl">📋</div>
            <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Pemesanan</h3>
            <p className="text-xs text-slate-400">
              {statusFilter === "all"
                ? "Anda belum pernah memesan ruangan kerja."
                : `Tidak ada pemesanan dengan status "${statusFilter}".`}
            </p>
            <Link
              href="/spaces"
              className="inline-block bg-[#087EA4] text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-sm"
            >
              Lihat Ruangan Tersedia
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((item) => {
              const status = (item.status || "").toLowerCase();
              const isPending =
                status === "belum_dikonfirmasi" || status === "belum_dikonfirm";
              const canViewTicket =
                status === "disetujui" || status === "aktif" || status === "selesai";

              return (
                <div
                  key={item.id}
                  className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#087EA4]">
                        #{item.kode_booking || `RSV-${item.id}`}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {resolveReservationSpaceName(item)}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>
                        📅 <b>{formatTanggal(item.tanggal_reservasi || item.tanggal)}</b>
                      </span>
                      <span>
                        ⏰ <b>{item.jam_mulai || "-"}</b> ({item.durasi_jam || item.durasi || 1} Jam)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-5 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Total Tagihan
                      </span>
                      <span className="font-black text-base text-[#087EA4]">
                        {formatRupiah(resolveReservationTotal(item))}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          onClick={() => handleCancelReservation(item.id)}
                          disabled={cancellingId === item.id}
                          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl text-xs transition-all border border-rose-200"
                        >
                          {cancellingId === item.id ? "Membatalkan..." : "Batalkan"}
                        </button>
                      )}

                      {canViewTicket && (
                        <Link
                          href={`/member/reservations/${item.id}/ticket`}
                          className="px-5 py-2.5 bg-[#087EA4] hover:bg-[#075985] text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-sky-500/20"
                        >
                          🎟️ Buka E-Ticket
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
