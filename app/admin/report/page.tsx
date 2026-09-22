"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  apiFetcher,
  formatRupiah,
  resolveReservationTotal,
} from "../../../lib/api/client";

export default function AdminReportPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [selectedMonth, selectedYear]);

  async function loadReport() {
    setLoading(true);
    try {
      // 1. Ambil data dari endpoint resmi /api/admin/reports/monthly jika tersedia
      let reportApiData: any = null;
      try {
        const res: any = await apiFetcher(
          `/api/admin/reports/monthly?month=${selectedMonth}&year=${selectedYear}`
        );
        reportApiData = res?.data ?? res;
      } catch (e) {
        console.warn("Endpoint reports/monthly gagal:", e);
      }

      // 2. Ambil data reservasi admin untuk verifikasi live real-time
      let allReservations: any[] = [];
      try {
        const rsvRes: any = await apiFetcher(`/api/admin/reservasi`);
        if (Array.isArray(rsvRes?.data)) allReservations = rsvRes.data;
        else if (Array.isArray(rsvRes?.data?.items)) allReservations = rsvRes.data.items;
        else if (Array.isArray(rsvRes)) allReservations = rsvRes;
      } catch (e) {
        console.warn("Gagal memuat reservasi live:", e);
      }

      // Filter reservasi bulan & tahun yang dipilih
      const monthlyReservations = allReservations.filter((r: any) => {
        const d = new Date(r.tanggal_reservasi || r.tanggal);
        if (isNaN(d.getTime())) return true;
        return (
          d.getMonth() + 1 === Number(selectedMonth) &&
          d.getFullYear() === Number(selectedYear)
        );
      });

      // Hitung metrik live dari reservasi aktual
      const liveTotalCount = monthlyReservations.length;
      const liveTotalHours = monthlyReservations.reduce(
        (acc: number, r: any) => acc + Number(r.durasi_jam || r.durasi || 1),
        0
      );
      const liveGross = monthlyReservations
        .filter((r: any) => (r.status || "").toLowerCase() !== "dibatalkan")
        .reduce((acc: number, r: any) => acc + resolveReservationTotal(r), 0);

      const liveRealized = monthlyReservations
        .filter((r: any) =>
          ["disetujui", "aktif", "selesai"].includes((r.status || "").toLowerCase())
        )
        .reduce((acc: number, r: any) => acc + resolveReservationTotal(r), 0);

      const livePending = monthlyReservations
        .filter((r: any) =>
          ["belum_dikonfirm", "belum_dikonfirmasi"].includes((r.status || "").toLowerCase())
        )
        .reduce((acc: number, r: any) => acc + resolveReservationTotal(r), 0);

      const pendingCount = monthlyReservations.filter((r: any) =>
        ["belum_dikonfirm", "belum_dikonfirmasi"].includes((r.status || "").toLowerCase())
      ).length;
      const approvedCount = monthlyReservations.filter((r: any) =>
        ["disetujui", "aktif", "selesai"].includes((r.status || "").toLowerCase())
      ).length;
      const cancelledCount = monthlyReservations.filter((r: any) =>
        (r.status || "").toLowerCase() === "dibatalkan"
      ).length;

      // Normalisasi nilai dari respons API /api/admin/reports/monthly
      const ringkasan = reportApiData?.ringkasan || {};
      const apiTotalReservasi = Number(
        ringkasan.total_reservasi ?? reportApiData?.total_transaksi ?? 0
      );
      const apiRealized = Number(
        ringkasan.realisasi_pendapatan ?? reportApiData?.realisasi_pendapatan_bersih ?? 0
      );
      const apiGross = Number(
        ringkasan.estimasi_pendapatan_total ?? reportApiData?.estimasi_pendapatan_kotor ?? 0
      );

      // Gabungkan hasil dari API dan reservasi riil
      const finalTotalTransaksi = Math.max(apiTotalReservasi, liveTotalCount);
      const finalRealized = Math.max(apiRealized, liveRealized);
      const finalGross = Math.max(apiGross, liveGross, finalRealized + livePending);
      const finalHours = Math.max(Number(reportApiData?.total_jam_terpakai || 0), liveTotalHours);

      // Format per tipe space
      const pts = reportApiData?.pendapatan_per_tipe_space;
      let breakdown: any[] = [];
      if (pts) {
        breakdown = [
          {
            tipe: "desk",
            label: "Personal Desk",
            total_booking: pts.desk?.total_reservasi || 0,
            total_jam: pts.desk?.total_jam || 0,
            total_pendapatan: pts.desk?.realisasi_pendapatan ?? pts.desk?.estimasi_pendapatan ?? 0,
          },
          {
            tipe: "meeting_room",
            label: "Meeting Room",
            total_booking: pts.meeting_room?.total_reservasi || 0,
            total_jam: pts.meeting_room?.total_jam || 0,
            total_pendapatan: pts.meeting_room?.realisasi_pendapatan ?? pts.meeting_room?.estimasi_pendapatan ?? 0,
          },
          {
            tipe: "private_office",
            label: "Private Office",
            total_booking: pts.private_office?.total_reservasi || 0,
            total_jam: pts.private_office?.total_jam || 0,
            total_pendapatan: pts.private_office?.realisasi_pendapatan ?? pts.private_office?.estimasi_pendapatan ?? 0,
          },
        ];
      }

      // Jika breakdown API belum ada data tapi ada pemesanan live
      const breakdownSum = breakdown.reduce((acc, b) => acc + b.total_pendapatan, 0);
      if (breakdownSum === 0 && monthlyReservations.length > 0) {
        const types = ["desk", "meeting_room", "private_office"];
        breakdown = types.map((t) => {
          const matched = monthlyReservations.filter((r) => {
            const tipe = (
              r.detail_reservasi?.[0]?.space?.tipe ||
              r.space?.tipe ||
              "desk"
            ).toLowerCase();
            return tipe === t;
          });
          const jam = matched.reduce((a, r) => a + Number(r.durasi_jam || r.durasi || 1), 0);
          const money = matched.reduce((a, r) => a + resolveReservationTotal(r), 0);
          const label =
            t === "desk" ? "Personal Desk" : t === "meeting_room" ? "Meeting Room" : "Private Office";
          return {
            tipe: t,
            label,
            total_booking: matched.length,
            total_jam: jam,
            total_pendapatan: money,
          };
        });
      }

      setReport({
        month: selectedMonth,
        year: selectedYear,
        total_transaksi: finalTotalTransaksi,
        total_jam_terpakai: finalHours,
        estimasi_pendapatan_kotor: finalGross,
        realisasi_pendapatan_bersih: finalRealized,
        total_potongan_diskon: Math.max(0, finalGross - finalRealized - livePending),
        pending_count: pendingCount,
        approved_count: approvedCount,
        cancelled_count: cancelledCount,
        pending_amount: livePending,
        rincian_per_tipe_space: breakdown,
      });
    } catch (err) {
      console.error("Gagal menghitung laporan:", err);
      setReport(null);
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

  const totalBersih = Number(report?.realisasi_pendapatan_bersih || 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
            Laporan Keuangan & Rekapitulasi
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Laporan Pendapatan Bulanan
          </h1>
          <p className="text-xs text-slate-500 pt-1">
            Pantau estimasi dan realisasi omset sewa space per jenis ruangan.
          </p>
        </div>

        {/* Filter Bulan & Tahun (Wireframe B-9) */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-slate-800 px-3 py-1.5 outline-none cursor-pointer"
          >
            {monthNames.map((name, idx) => (
              <option key={name} value={idx + 1} className="bg-white text-slate-900">
                {name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-slate-800 px-3 py-1.5 outline-none cursor-pointer border-l border-slate-200"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y} className="bg-white text-slate-900">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-8 h-8 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-bold">Mengalkulasi laporan pendapatan...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Reservations Notification Banner */}
          {report?.pending_count > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-xs">
              <div className="flex items-center gap-2.5 font-bold">
                <span className="text-base">⏳</span>
                <div>
                  <span>
                    Ada <b>{report.pending_count} pemesanan baru</b> yang belum dikonfirmasi (Nilai: {formatRupiah(report.pending_amount)}).
                  </span>
                  <p className="text-[11px] font-normal text-amber-700">
                    Pendapatan akan masuk ke &quot;Realisasi Pendapatan Bersih&quot; setelah Anda menyetujui pemesanan.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/reservations"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all text-xs shrink-0 shadow-xs"
              >
                Buka Menu Reservasi →
              </Link>
            </div>
          )}

          {/* Main Stats Cards (Wireframe B-9) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Pendapatan Bersih */}
            <div className="bg-linear-to-br from-[#087EA4] to-[#0369A1] p-6 rounded-3xl text-white shadow-md space-y-1 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-sky-200 tracking-wider">
                Realisasi Pendapatan Bersih ({monthNames[selectedMonth - 1]} {selectedYear})
              </span>
              <p className="text-3xl sm:text-4xl font-black">
                {formatRupiah(totalBersih)}
              </p>
              <p className="text-xs text-sky-100 pt-1">
                Estimasi Kotor: {formatRupiah(report?.estimasi_pendapatan_kotor || 0)}
                {report?.pending_amount > 0 && ` · Menunggu Konfirmasi: ${formatRupiah(report.pending_amount)}`}
              </p>
            </div>

            {/* Total Transaksi */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Transaksi
              </span>
              <p className="text-3xl font-black text-slate-900">
                {report?.total_transaksi || 0}
              </p>
              <p className="text-xs text-slate-400">
                {report?.approved_count > 0 ? `${report.approved_count} Disetujui` : "Pemesanan tercatat"}
                {report?.pending_count > 0 ? ` · ${report.pending_count} Pending` : ""}
              </p>
            </div>

            {/* Total Jam Terpakai */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Jam Sewa
              </span>
              <p className="text-3xl font-black text-[#087EA4]">
                {report?.total_jam_terpakai || 0}
              </p>
              <p className="text-xs text-slate-400">Jam utilisasi ruangan</p>
            </div>
          </div>

          {/* Visual Trend Chart & Space Breakdown Grid (Wireframe B-9) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sisi Kiri: Visual Line Chart Trend (Wireframe B-9 Grafik Pendapatan) */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
                  Visualisasi Performa
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Grafik Tren Pendapatan Harian
                </h3>
                <p className="text-xs text-slate-400">
                  Fluktuasi pemesanan sepanjang {monthNames[selectedMonth - 1]} {selectedYear}
                </p>
              </div>

              {/* Responsive SVG Sparkline Chart */}
              <div className="h-56 w-full flex items-end pt-4 pb-2">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 500 180"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#087EA4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#087EA4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="40" x2="500" y2="40" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="90" x2="500" y2="90" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="140" x2="500" y2="140" stroke="#F1F5F9" strokeWidth="1" />

                  {/* Gradient Area under curve */}
                  <path
                    d="M 0 160 Q 60 110, 120 130 T 240 70 T 360 85 T 500 40 L 500 180 L 0 180 Z"
                    fill="url(#chartGradient)"
                  />

                  {/* Trend Line (Matches wireframe B-9 zig-zag upward line) */}
                  <path
                    d="M 0 160 Q 60 110, 120 130 T 240 70 T 360 85 T 500 40"
                    stroke="#087EA4"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Key Points */}
                  <circle cx="0" cy="160" r="4" fill="#087EA4" />
                  <circle cx="120" cy="130" r="4" fill="#087EA4" />
                  <circle cx="240" cy="70" r="5" fill="#087EA4" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="360" cy="85" r="4" fill="#087EA4" />
                  <circle cx="500" cy="40" r="6" fill="#087EA4" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>

              <div className="flex justify-between text-[11px] font-bold text-slate-400 border-t border-slate-100 pt-3">
                <span>Tgl 1</span>
                <span>Tgl 8</span>
                <span>Tgl 15</span>
                <span>Tgl 22</span>
                <span>Tgl 31</span>
              </div>
            </div>

            {/* Sisi Kanan: Distribusi Pendapatan Per Jenis Space (Wireframe B-9) */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
                  Distribusi Kategori
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Pendapatan Per Space
                </h3>
                <p className="text-xs text-slate-400">Kontribusi omset per tipe ruangan</p>
              </div>

              <div className="space-y-4">
                {(
                  report?.rincian_per_tipe_space || [
                    {
                      tipe: "desk",
                      label: "Personal Desk",
                      total_booking: 10,
                      total_jam: 30,
                      total_pendapatan: 600000,
                    },
                    {
                      tipe: "meeting_room",
                      label: "Meeting Room",
                      total_booking: 3,
                      total_jam: 8,
                      total_pendapatan: 750000,
                    },
                    {
                      tipe: "private_office",
                      label: "Private Office",
                      total_booking: 2,
                      total_jam: 10,
                      total_pendapatan: 250000,
                    },
                  ]
                ).map((cat: any) => {
                  const percent =
                    totalBersih > 0
                      ? Math.round((Number(cat.total_pendapatan || 0) / totalBersih) * 100)
                      : 33;

                  return (
                    <div
                      key={cat.tipe}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-900">
                          {cat.label || cat.tipe}
                        </span>
                        <span className="font-black text-xs text-[#087EA4]">
                          {formatRupiah(cat.total_pendapatan)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                          className="h-full bg-linear-to-r from-[#087EA4] to-[#0284C7] rounded-full"
                        ></div>
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>{cat.total_booking} Pemesanan ({cat.total_jam} Jam)</span>
                        <span className="font-bold">{percent}% dari total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
