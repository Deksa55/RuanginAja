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

export default function MemberHistoryPage() {
  const router = useRouter();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<{
    month?: number;
    year?: number;
    total_reservasi: number;
    total_pengeluaran: number;
    items: any[];
  }>({
    total_reservasi: 0,
    total_pengeluaran: 0,
    items: [],
  });

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || user?.role !== "member") {
      router.replace("/auth/login");
      return;
    }
    loadHistory();
  }, [selectedMonth, selectedYear]);

  async function loadHistory() {
    setLoading(true);
    try {
      // Endpoint No. 21 in UKK: GET /api/reservasi/my/history?month=...&year=...
      const res: any = await apiFetcher(
        `/api/reservasi/my/history?month=${selectedMonth}&year=${selectedYear}`
      );

      if (res?.status && res?.data) {
        setHistoryData({
          month: res.data.month ?? selectedMonth,
          year: res.data.year ?? selectedYear,
          total_reservasi: res.data.total_reservasi ?? (res.data.items?.length || 0),
          total_pengeluaran: res.data.total_pengeluaran ?? 0,
          items: Array.isArray(res.data.items) ? res.data.items : [],
        });
      } else {
        // Fallback: load all my reservations and filter locally
        const fallbackRes: any = await apiFetcher("/api/reservasi/my");
        const list: any[] = Array.isArray(fallbackRes?.data) ? fallbackRes.data : [];
        const filtered = list.filter((item) => {
          const itemDate = new Date(item.tanggal_reservasi || item.tanggal);
          return (
            itemDate.getMonth() + 1 === Number(selectedMonth) &&
            itemDate.getFullYear() === Number(selectedYear)
          );
        });
        const sum = filtered.reduce(
          (acc, cur) => acc + resolveReservationTotal(cur),
          0
        );
        setHistoryData({
          month: selectedMonth,
          year: selectedYear,
          total_reservasi: filtered.length,
          total_pengeluaran: sum,
          items: filtered,
        });
      }
    } catch (err) {
      console.error("Gagal memuat histori:", err);
    } finally {
      setLoading(false);
    }
  }

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-6">
        {/* Header & Filter Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
                Rekapitulasi Pemakaian
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Histori Pemesanan
              </h1>
              <p className="text-xs text-slate-400 pt-1">
                Laporan riwayat reservasi coworking space bulanan.
              </p>
            </div>

            {/* Filter Bulan & Tahun */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 px-3 py-1.5 outline-none cursor-pointer"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 px-3 py-1.5 outline-none border-l border-slate-200 cursor-pointer"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="pt-2">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-sky-100 text-slate-800 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Reservasi Selesai / Terdaftar
                </span>
                <p className="text-2xl sm:text-3xl font-black text-[#087EA4]">
                  {historyData.total_reservasi} <span className="text-base font-normal text-slate-400">Transaksi</span>
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                Periode: {monthNames[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-10 h-10 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-bold">Memuat histori pemesanan...</p>
          </div>
        ) : historyData.items.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Transaksi</h3>
            <p className="text-xs text-slate-400">
              Belum ada riwayat reservasi pada {monthNames[selectedMonth - 1]} {selectedYear}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {historyData.items.map((item) => (
              <div
                key={item.id}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-[#087EA4]">
                      #{item.kode_booking || `BOOK-${item.id}`}
                    </span>
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === "disetujui" || item.status === "selesai"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : item.status === "aktif"
                          ? "bg-sky-50 text-sky-600 border border-sky-200"
                          : item.status === "dibatalkan"
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : "bg-amber-50 text-amber-600 border border-amber-200"
                      }`}
                    >
                      {item.status || "selesai"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {resolveReservationSpaceName(item)}
                  </h3>

                  <p className="text-xs text-slate-500">
                    Jadwal: <b>{formatTanggal(item.tanggal_reservasi || item.tanggal)}</b> ({item.jam_mulai || "-"} s/d {item.jam_selesai || "-"}) · Durasi: {item.durasi_jam || item.durasi || 1} Jam
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-5 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Total Bayar
                    </span>
                    <span className="font-black text-base text-[#087EA4]">
                      {formatRupiah(resolveReservationTotal(item))}
                    </span>
                  </div>

                  <Link
                    href={`/member/reservations/${item.id}/ticket`}
                    className="px-5 py-2.5 bg-[#087EA4] hover:bg-[#075985] text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-sky-500/20 hover:scale-[1.02]"
                  >
                     E-Ticket
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
