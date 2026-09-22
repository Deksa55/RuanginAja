"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  apiFetcher,
  formatRupiah,
  resolveReservationTotal,
  resolveReservationSpaceName,
  formatTanggal,
  getStoredUser,
} from "../../../lib/api/client";
import { Html5Qrcode } from "html5-qrcode";
import QRCodeDisplay from "../../../components/reservation/QRCodeDisplay";

// Comprehensive QR Payload Parser (supports COWORKING|..., VERIFY-RESERVASI-..., CWK-..., BOOK-..., JSON, raw IDs)
export function parseReservationQR(rawText: string): { id?: number; code?: string } | null {
  if (!rawText || typeof rawText !== "string") return null;
  const text = rawText.trim();

  // 1. Backend standard: COWORKING|CWK-000606|606|...
  if (text.toUpperCase().startsWith("COWORKING|")) {
    const parts = text.split("|");
    const code = parts[1]?.trim();
    const idNum = Number(parts[2]?.trim());
    return {
      id: !isNaN(idNum) && idNum > 0 ? idNum : undefined,
      code: code || undefined,
    };
  }

  // 2. Legacy/fallback: VERIFY-RESERVASI-<id>-...
  const verifyMatch = text.match(/VERIFY-RESERVASI-(\d+)(?:-([A-Za-z0-9_-]+))?/i);
  if (verifyMatch) {
    return {
      id: Number(verifyMatch[1]),
      code: verifyMatch[2] || undefined,
    };
  }

  // 3. JSON format
  if (text.startsWith("{") && text.endsWith("}")) {
    try {
      const parsed = JSON.parse(text);
      const id = parsed.id || parsed.reservasi_id || parsed.reservation_id;
      const code = parsed.booking_code || parsed.kode_booking;
      if (id || code) {
        return {
          id: id ? Number(id) : undefined,
          code: code ? String(code) : undefined,
        };
      }
    } catch {}
  }

  // 4. Booking Code regex: CWK-XXXXXX, BOOK-XXXXXX, RSV-XXXXXX
  const codeMatch = text.match(/\b(CWK-[0-9A-Za-z]+|BOOK-[0-9A-Za-z]+|RSV-[0-9A-Za-z]+)\b/i);
  if (codeMatch) {
    return { code: codeMatch[1].toUpperCase() };
  }

  // 5. URL containing ticket: .../reservations/:id/ticket
  const urlMatch = text.match(/\/reservations\/(\d+)/i);
  if (urlMatch) {
    return { id: Number(urlMatch[1]) };
  }

  // 6. Raw number: "606"
  if (/^\d+$/.test(text)) {
    return { id: Number(text) };
  }

  return null;
}

// Subtle audio feedback on successful QR scan
const playSuccessSound = () => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {}
};

export default function AdminReservationsPage() {
  const [user, setUser] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters (Wireframe B-8)
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Selected reservation for detail modal
  const [selectedRsv, setSelectedRsv] = useState<any | null>(null);

  // QR Scanner Modal State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "upload" | "manual">("camera");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanSuccess, setScanSuccess] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [scannedRsv, setScannedRsv] = useState<any | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    loadReservations();
  }, [filterStatus, filterDate, filterMonth]);

  // Helper to find reservation from parsed QR in memory or via API
  const findReservation = async (parsed: { id?: number; code?: string }) => {
    // 1. Search in currently loaded reservations
    let match = reservations.find((r) => {
      if (parsed.id && Number(r.id) === parsed.id) return true;
      if (parsed.code) {
        const bCode = (r.kode_booking || `RSV-${r.id}`).toUpperCase();
        if (bCode === parsed.code.toUpperCase() || bCode.includes(parsed.code.toUpperCase())) {
          return true;
        }
      }
      return false;
    });

    if (match) return match;

    // 2. Fetch specific reservation by ID
    if (parsed.id) {
      try {
        const res: any = await apiFetcher(`/api/reservasi/${parsed.id}`);
        const data = res?.data ?? res;
        if (data && (data.id || data.kode_booking)) return data;
      } catch {}
    }

    // 3. Fallback: Search all admin reservations without filter
    try {
      const res: any = await apiFetcher(`/api/admin/reservasi`);
      const allList: any[] = Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      if (allList.length > 0) {
        match = allList.find((r) => {
          if (parsed.id && Number(r.id) === parsed.id) return true;
          if (parsed.code) {
            const bCode = (r.kode_booking || `RSV-${r.id}`).toUpperCase();
            return bCode === parsed.code.toUpperCase() || bCode.includes(parsed.code.toUpperCase());
          }
          return false;
        });
        if (match) return match;
      }
    } catch {}

    return null;
  };

  // Process decoded QR or manual text input
  const handleProcessPayload = async (text: string) => {
    const parsed = parseReservationQR(text);
    if (!parsed || (!parsed.id && !parsed.code)) {
      setScanError(`Kode "${text}" bukan merupakan QR / Kode Reservasi RuanginAja yang valid.`);
      setScanSuccess("");
      return;
    }

    setScanLoading(true);
    setScanError("");
    setScanSuccess("");

    try {
      const matched = await findReservation(parsed);
      if (!matched) {
        setScanError(
          `Reservasi ${parsed.code ? `"${parsed.code}"` : `#${parsed.id}`} tidak ditemukan di sistem.`
        );
        return;
      }

      playSuccessSound();
      setScannedRsv(matched);
      setScanSuccess(`Reservasi #${matched.kode_booking || matched.id} berhasil ditemukan!`);
    } catch (err: any) {
      setScanError(err.message || "Gagal memproses data reservasi.");
    } finally {
      setScanLoading(false);
    }
  };

  // File Scan Handler
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanLoading(true);
    setScanError("");
    setScanSuccess("");

    try {
      const fileScanner = new Html5Qrcode("admin-qr-file-scratch", { verbose: false });
      const decodedText = await fileScanner.scanFile(file, false);
      try {
        fileScanner.clear();
      } catch {}
      await handleProcessPayload(decodedText);
    } catch {
      setScanError("QR Code tidak terdeteksi pada gambar. Pastikan gambar jelas dan tidak terpotong.");
    } finally {
      setScanLoading(false);
      e.target.value = "";
    }
  };

  // Manual Search Handler
  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualInput.trim()) {
      setScanError("Masukkan kode booking atau ID reservasi.");
      return;
    }
    await handleProcessPayload(manualInput.trim());
  };

  // Live Camera Scanner Lifecycle
  useEffect(() => {
    if (!scannerOpen || scanMode !== "camera" || scannedRsv) return;

    let scanner: Html5Qrcode | null = null;
    let isDisposed = false;

    const timer = setTimeout(async () => {
      try {
        const el = document.getElementById("admin-qr-reader");
        if (!el || isDisposed) return;
        scanner = new Html5Qrcode("admin-qr-reader");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            if (isDisposed) return;
            await handleProcessPayload(decodedText);
          },
          () => {}
        );
      } catch {
        if (!isDisposed) {
          setScanError("Kamera tidak dapat diakses. Silakan berikan izin kamera atau gunakan tab 'Unggah Foto QR' / 'Input Kode'.");
        }
      }
    }, 200);

    return () => {
      isDisposed = true;
      clearTimeout(timer);
      if (scanner) {
        scanner.stop().then(() => scanner?.clear()).catch(() => {});
      }
    };
  }, [scannerOpen, scanMode, scannedRsv]);

  async function loadReservations() {
    setLoading(true);
    try {
      let url = "/api/admin/reservasi";
      const params = new URLSearchParams();

      if (filterStatus) params.append("status", filterStatus);
      if (filterDate) params.append("tanggal", filterDate);
      if (filterMonth) {
        const [year, month] = filterMonth.split("-");
        params.append("month", String(Number(month)));
        params.append("year", year);
      }

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res: any = await apiFetcher(url);
      let dataList: any[] = [];
      if (Array.isArray(res?.data?.items)) dataList = res.data.items;
      else if (Array.isArray(res?.data)) dataList = res.data;
      else if (Array.isArray(res)) dataList = res;

      setReservations(dataList);
    } catch (err) {
      console.error("Gagal memuat reservasi admin:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (id: number | string, status: string) => {
    setActionLoading(true);
    try {
      await apiFetcher(`/api/admin/reservasi/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      alert(`Status reservasi #${id} berhasil diubah menjadi: ${status}`);
      if (selectedRsv && selectedRsv.id === id) {
        setSelectedRsv({ ...selectedRsv, status });
      }
      loadReservations();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status reservasi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async (id: number | string) => {
    setActionLoading(true);
    try {
      await apiFetcher(`/api/admin/reservasi/${id}/check-in`, { method: "POST" });
      alert(`Check-In Berhasil! Status reservasi #${id} kini aktif.`);
      if (selectedRsv && selectedRsv.id === id) {
        setSelectedRsv({ ...selectedRsv, status: "aktif" });
      }
      loadReservations();
    } catch (err: any) {
      alert(err.message || "Gagal melakukan Check-In.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (id: number | string) => {
    setActionLoading(true);
    try {
      await apiFetcher(`/api/admin/reservasi/${id}/check-out`, { method: "POST" });
      alert(`Check-Out Berhasil! Reservasi #${id} telah selesai.`);
      if (selectedRsv && selectedRsv.id === id) {
        setSelectedRsv({ ...selectedRsv, status: "selesai" });
      }
      loadReservations();
    } catch (err: any) {
      alert(err.message || "Gagal melakukan Check-Out.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    const memberName = (r.user?.nama_member || r.member?.nama_member || r.nama_member || "").toLowerCase();
    const spaceName = (r.space?.nama_space || r.space_name || "").toLowerCase();
    const bookingCode = (r.kode_booking || `RSV-${r.id}`).toLowerCase();
    const q = searchTerm.toLowerCase();
    return memberName.includes(q) || spaceName.includes(q) || bookingCode.includes(q);
  });

  const pendingCount = reservations.filter((r) => {
    const st = (r.status || "").toLowerCase();
    return st === "belum_dikonfirmasi" || st === "belum_dikonfirm";
  }).length;
  const approvedCount = reservations.filter((r) => (r.status || "").toLowerCase() === "disetujui").length;
  const activeCount = reservations.filter((r) => (r.status || "").toLowerCase() === "aktif").length;
  const completedCount = reservations.filter((r) => (r.status || "").toLowerCase() === "selesai").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
            RuanginAja · Admin Space
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Kelola Transaksi Reservasi
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Konfirmasi pesanan masuk, lakukan check-in dan check-out tamu secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadReservations()}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            🔄 Segarkan Data
          </button>
        </div>
      </div>

      {/* High Priority Alert Banner for Pending Reservations */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-black">
              ⚡
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                Ada {pendingCount} Reservasi Menunggu Persetujuan Anda!
              </h3>
              <p className="text-xs text-amber-100">
                Segera periksa dan setujui pesanan agar member dapat melakukan check-in di ruangan Anda.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus("belum_dikonfirm")}
            className="bg-white text-amber-800 hover:bg-amber-50 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs shrink-0 cursor-pointer"
          >
            Tinjau Pesanan ({pendingCount}) →
          </button>
        </div>
      )}

      {/* Quick KPI Stat Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Menunggu</span>
            <span className="text-base">⏳</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingCount}</div>
          <p className="text-[11px] text-slate-400">Butuh persetujuan</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Disetujui</span>
            <span className="text-base">✅</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{approvedCount}</div>
          <p className="text-[11px] text-slate-400">Siap untuk check-in</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Aktif</span>
            <span className="text-base">💻</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{activeCount}</div>
          <p className="text-[11px] text-slate-400">Sedang menggunakan space</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selesai</span>
            <span className="text-base">🏁</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{completedCount}</div>
          <p className="text-[11px] text-slate-400">Telah check-out</p>
        </div>
      </div>

      {/* Filter Controls (Wireframe B-8) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#087EA4]">
              Check-In Langsung di Lokasi
            </span>
            <h3 className="font-bold text-sm text-slate-900">Validasi Tamu via QR E-Ticket</h3>
            <p className="text-xs text-slate-400">
              Scan QR code e-ticket member via kamera, upload gambar tiket, atau input kode booking langsung.
            </p>
          </div>
          <button
            onClick={() => {
              setScanError("");
              setScanSuccess("");
              setScannedRsv(null);
              setScannerOpen(true);
            }}
            className="bg-[#087EA4] hover:bg-[#075985] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>📷</span>
            <span>Scan QR & Check-In Tamu</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Term */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Pencarian
            </label>
            <input
              type="text"
              placeholder="Cari kode / nama / space..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Filter Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#087EA4]"
            >
              <option value="">Semua Status</option>
              <option value="belum_dikonfirm">Belum Dikonfirmasi</option>
              <option value="disetujui">Disetujui</option>
              <option value="aktif">Aktif (Sedang Digunakan)</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Filter Bulan
            </label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#087EA4]"
            />
          </div>

          {/* Specific Date Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Filter Tanggal Spesifik
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#087EA4]"
            />
          </div>
        </div>
      </div>

      {/* Table Data Transaksi */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Daftar Reservasi ({filteredReservations.length})
            </h3>
            <p className="text-xs text-slate-400">Data reservasi terisolasi untuk space ini</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-8 h-8 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-bold">Memuat daftar reservasi...</p>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#087EA4] flex items-center justify-center mx-auto text-2xl">
              📋
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                {filterStatus || searchTerm || filterDate || filterMonth
                  ? "Tidak Ada Reservasi yang Cocok"
                  : "Belum Ada Reservasi Masuk"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {filterStatus || searchTerm || filterDate || filterMonth
                  ? "Coba sesuaikan kata kunci pencarian atau ubah filter status Anda."
                  : `Reservasi member untuk ${user?.nama_coworking || "Coworking Anda"} akan otomatis muncul di sini. Pastikan Anda sudah membuat ruangan di menu "Kelola Ruangan (Spaces)" dan member memesan ruangan milik Anda.`}
              </p>
            </div>
            {!filterStatus && !searchTerm && !filterDate && !filterMonth && (
              <Link
                href="/admin/spaces"
                className="inline-block bg-[#087EA4] hover:bg-[#075985] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                + Buat Ruangan di Kelola Spaces →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4">Kode Booking</th>
                  <th className="p-4">Pelanggan / Member</th>
                  <th className="p-4">Ruangan</th>
                  <th className="p-4">Jadwal Sewa</th>
                  <th className="p-4">Total Tagihan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map((r) => {
                  const status = (r.status || "").toLowerCase();
                  const isPending =
                    status === "belum_dikonfirmasi" || status === "belum_dikonfirm";

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedRsv(r)}
                          className="font-mono font-bold text-[#087EA4] hover:underline"
                        >
                          #{r.kode_booking || `RSV-${r.id}`}
                        </button>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">
                          {r.user?.nama_member || r.member?.nama_member || r.nama_member || "Member"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {r.member?.telp || r.telp || "-"}
                        </p>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">
                        {resolveReservationSpaceName(r)}
                      </td>
                      <td className="p-4 text-slate-500">
                        <p className="font-medium text-slate-700">
                          {formatTanggal(r.tanggal_reservasi || r.tanggal)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {r.jam_mulai || "-"} ({r.durasi_jam || r.durasi || 1} Jam)
                        </p>
                      </td>
                      <td className="p-4 font-black text-[#087EA4]">
                        {formatRupiah(resolveReservationTotal(r))}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            status === "disetujui"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : status === "aktif"
                              ? "bg-sky-50 text-sky-600 border border-sky-200"
                              : status === "selesai"
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : status === "dibatalkan"
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}
                        >
                          {r.status || "belum_dikonfirm"}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Aksi Konfirmasi (Setujui / Tolak / Check-In Langsung) */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(r.id, "disetujui")}
                              disabled={actionLoading}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-xs"
                            >
                              ✓ Setujui
                            </button>
                            <button
                              onClick={() => handleCheckIn(r.id)}
                              disabled={actionLoading}
                              className="bg-[#087EA4] hover:bg-[#075985] text-white px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-xs"
                              title="Setujui dan langsung aktifkan check-in tamu"
                            >
                              ⚡ Check-In
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(r.id, "dibatalkan")}
                              disabled={actionLoading}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-xs"
                            >
                              ✕ Tolak
                            </button>
                          </>
                        )}

                        {/* Aksi Check-In */}
                        {status === "disetujui" && (
                          <button
                            onClick={() => handleCheckIn(r.id)}
                            disabled={actionLoading}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-xs"
                          >
                            ⚡ Check-In
                          </button>
                        )}

                        {/* Aksi Check-Out */}
                        {status === "aktif" && (
                          <button
                            onClick={() => handleCheckOut(r.id)}
                            disabled={actionLoading}
                            className="bg-[#087EA4] hover:bg-[#0284C7] text-white px-3.5 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-xs"
                          >
                            ➔ Check-Out
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedRsv(r)}
                          className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-bold text-[10px]"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dedicated QR Scanner & Check-In Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 border border-slate-200 space-y-5">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#087EA4] flex items-center justify-center text-lg font-bold">
                  📷
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Scan QR E-Ticket & Check-In
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Validasi kehadiran member & aktifkan ruangan secara real-time
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setScannerOpen(false);
                  setScannedRsv(null);
                  setScanError("");
                  setScanSuccess("");
                }}
                className="text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-lg font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {/* If a reservation was scanned/found, display Verification Card */}
            {scannedRsv ? (
              <div className="bg-gradient-to-b from-sky-50/60 to-white rounded-2xl p-5 border-2 border-sky-200 space-y-4 animate-fadeIn shadow-xs">
                <div className="flex items-start justify-between gap-2 border-b border-sky-100/80 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4] block">
                      Reservasi Terverifikasi
                    </span>
                    <h4 className="text-xl font-black text-slate-900">
                      #{scannedRsv.kode_booking || `RSV-${scannedRsv.id}`}
                    </h4>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      scannedRsv.status === "disetujui"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : scannedRsv.status === "aktif"
                        ? "bg-sky-100 text-[#087EA4] border border-sky-200"
                        : scannedRsv.status === "selesai"
                        ? "bg-slate-100 text-slate-700 border border-slate-200"
                        : scannedRsv.status === "dibatalkan"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    ● {scannedRsv.status || "belum_dikonfirm"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                      Nama Tamu
                    </span>
                    <span className="font-bold text-slate-800 text-sm block">
                      {scannedRsv.user?.nama_member || scannedRsv.member?.nama_member || scannedRsv.nama_member || "Member"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {scannedRsv.member?.telp || scannedRsv.telp || "-"}
                    </span>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                      Ruangan
                    </span>
                    <span className="font-bold text-slate-800 text-sm block">
                      {resolveReservationSpaceName(scannedRsv)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {scannedRsv.space?.tipe || "Desk / Space"}
                    </span>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                      Jadwal
                    </span>
                    <span className="font-bold text-slate-800 block">
                      {formatTanggal(scannedRsv.tanggal_reservasi || scannedRsv.tanggal)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {scannedRsv.jam_mulai || "-"} ({scannedRsv.durasi_jam || scannedRsv.durasi || 1} Jam)
                    </span>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                      Total Tagihan
                    </span>
                    <span className="font-black text-[#087EA4] text-base block">
                      {formatRupiah(resolveReservationTotal(scannedRsv))}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">Lunas / Terverifikasi</span>
                  </div>
                </div>

                {/* Actions on scanned card */}
                <div className="pt-2 border-t border-sky-100 flex flex-wrap gap-2 justify-end">
                  {(scannedRsv.status === "belum_dikonfirm" || scannedRsv.status === "belum_dikonfirmasi") && (
                    <>
                      <button
                        onClick={async () => {
                          await handleCheckIn(scannedRsv.id);
                          setScannedRsv((prev: any) => prev ? { ...prev, status: "aktif" } : null);
                        }}
                        disabled={actionLoading}
                        className="bg-[#087EA4] hover:bg-[#075985] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5"
                      >
                        ⚡ Setujui & Langsung Check-In
                      </button>
                      <button
                        onClick={async () => {
                          await handleUpdateStatus(scannedRsv.id, "disetujui");
                          setScannedRsv((prev: any) => prev ? { ...prev, status: "disetujui" } : null);
                        }}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        ✓ Setujui Saja
                      </button>
                    </>
                  )}

                  {scannedRsv.status === "disetujui" && (
                    <button
                      onClick={async () => {
                        await handleCheckIn(scannedRsv.id);
                        setScannedRsv((prev: any) => prev ? { ...prev, status: "aktif" } : null);
                      }}
                      disabled={actionLoading}
                      className="bg-[#087EA4] hover:bg-[#075985] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/25 flex items-center gap-2"
                    >
                      ⚡ Check-In Tamu Sekarang
                    </button>
                  )}

                  {scannedRsv.status === "aktif" && (
                    <button
                      onClick={async () => {
                        await handleCheckOut(scannedRsv.id);
                        setScannedRsv((prev: any) => prev ? { ...prev, status: "selesai" } : null);
                      }}
                      disabled={actionLoading}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      🚪 Check-Out Tamu
                    </button>
                  )}

                  {scannedRsv.status === "selesai" && (
                    <div className="w-full text-center py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl">
                      ✓ Tamu ini telah selesai menggunakan ruangan (Check-out)
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setScannedRsv(null);
                      setScanSuccess("");
                      setScanError("");
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    Scan QR Lain
                  </button>
                </div>
              </div>
            ) : (
              /* If no reservation scanned yet: Tabs & Scanner Options */
              <div className="space-y-4">
                {/* Method Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setScanMode("camera");
                      setScanError("");
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      scanMode === "camera"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    📷 Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScanMode("upload");
                      setScanError("");
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      scanMode === "upload"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    🖼️ Unggah Foto QR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScanMode("manual");
                      setScanError("");
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      scanMode === "manual"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ⌨️ Input Kode
                  </button>
                </div>

                {/* Tab 1: Live Camera Scanner */}
                {scanMode === "camera" && (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-2xl bg-black border border-slate-200 flex flex-col items-center justify-center min-h-[280px]">
                      <div id="admin-qr-reader" className="w-full max-w-sm" />
                      <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none">
                        ● Kamera Aktif
                      </div>
                    </div>
                    <p className="text-center text-[11px] text-slate-400">
                      Arahkan kamera ke QR Code E-Ticket member. Sistem akan otomatis mendeteksi dan menampilkan data reservasi.
                    </p>
                  </div>
                )}

                {/* Tab 2: Upload Image of QR */}
                {scanMode === "upload" && (
                  <div className="space-y-3">
                    <label className="border-2 border-dashed border-sky-200 bg-sky-50/40 hover:bg-sky-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group text-center">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-sky-100 flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
                        📁
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Klik untuk Pilih File Gambar QR Code
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Dukung screenshot atau foto tiket (PNG, JPG, JPEG, WEBP)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileScan}
                        className="hidden"
                      />
                    </label>
                    <p className="text-center text-[11px] text-slate-400">
                      Bisa menggunakan screenshot e-ticket dari WhatsApp atau galeri HP tanpa perlu kamera aktif.
                    </p>
                  </div>
                )}

                {/* Tab 3: Manual Code / ID Input */}
                {scanMode === "manual" && (
                  <form onSubmit={handleManualSearch} className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Kode Booking atau ID Reservasi
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Contoh: CWK-000606 atau 606"
                          value={manualInput}
                          onChange={(e) => setManualInput(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold outline-none focus:border-[#087EA4] uppercase"
                        />
                        <button
                          type="submit"
                          disabled={scanLoading || !manualInput.trim()}
                          className="bg-[#087EA4] hover:bg-[#075985] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
                        >
                          {scanLoading ? "Mencari..." : "Cari & Verifikasi"}
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      💡 Ketik nomor reservasi atau kode booking yang tertera di bawah QR tiket.
                    </p>
                  </form>
                )}

                {/* Messages / Loading */}
                {scanLoading && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-sky-50 text-[#087EA4] rounded-xl text-xs font-bold animate-pulse">
                    <div className="w-4 h-4 border-2 border-[#087EA4] border-t-transparent rounded-full animate-spin" />
                    <span>Memproses dan mencari data reservasi...</span>
                  </div>
                )}

                {scanError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold space-y-1">
                    <p className="flex items-center gap-1.5 font-bold">
                      <span>⚠️</span> {scanError}
                    </p>
                    <p className="text-[11px] text-rose-500">
                      Tips: Coba gunakan tab &quot;Unggah Foto QR&quot; atau masukkan kode booking di tab &quot;Input Kode&quot;.
                    </p>
                  </div>
                )}

                {scanSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
                    <span>✓</span> {scanSuccess}
                  </div>
                )}
              </div>
            )}

            {/* Hidden reader element for file scans */}
            <div id="admin-qr-file-scratch" className="hidden" />

            {/* Footer Modal */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setScannerOpen(false);
                  setScannedRsv(null);
                  setScanError("");
                  setScanSuccess("");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal (Wireframe B-7: Kelola Reservasi) */}
      {selectedRsv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
                  Detail Reservasi Pelanggan
                </span>
                <h3 className="font-black text-xl text-slate-900">
                  #{selectedRsv.kode_booking || `RSV-${selectedRsv.id}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRsv(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-center space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                QR E-Ticket Reservasi
              </p>
              <QRCodeDisplay
                value={
                  selectedRsv.qr_code_data ||
                  selectedRsv.qr_code_payload ||
                  `COWORKING|${selectedRsv.kode_booking || `CWK-${String(selectedRsv.id).padStart(6, "0")}`}|${selectedRsv.id}|${selectedRsv.tanggal_reservasi || selectedRsv.tanggal || ""}|${selectedRsv.jam_mulai || ""}`
                }
                size={180}
                className="shadow-md"
              />
              <p className="font-mono text-[10px] text-slate-500 break-all">
                {selectedRsv.qr_code_data ||
                  selectedRsv.qr_code_payload ||
                  `COWORKING|${selectedRsv.kode_booking || `CWK-${String(selectedRsv.id).padStart(6, "0")}`}|${selectedRsv.id}|${selectedRsv.tanggal_reservasi || selectedRsv.tanggal || ""}|${selectedRsv.jam_mulai || ""}`}
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Nama Pelanggan</span>
                <span className="font-bold text-slate-800">
                  {selectedRsv.user?.nama_member || selectedRsv.member?.nama_member || selectedRsv.nama_member || "Member"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Kontak Telepon</span>
                <span className="font-bold text-slate-800">{selectedRsv.member?.telp || selectedRsv.telp || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Coworking Space</span>
                <span className="font-bold text-slate-800">
                  {resolveReservationSpaceName(selectedRsv)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Jadwal Reservasi</span>
                <span className="font-bold text-slate-800">
                  {formatTanggal(selectedRsv.tanggal_reservasi || selectedRsv.tanggal)} ({selectedRsv.jam_mulai || "-"})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Durasi Sewa</span>
                <span className="font-bold text-slate-800">
                  {selectedRsv.durasi_jam || selectedRsv.durasi || 1} Jam
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Total Tagihan</span>
                <span className="font-black text-[#087EA4] text-sm">
                  {formatRupiah(resolveReservationTotal(selectedRsv))}
                </span>
              </div>
              <div className="flex justify-between py-1 items-center">
                <span className="text-slate-400">Status Saat Ini</span>
                <span className="font-bold uppercase text-slate-800">{selectedRsv.status}</span>
              </div>
            </div>

            {/* Quick Actions inside modal */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
              {(selectedRsv.status === "belum_dikonfirmasi" || selectedRsv.status === "belum_dikonfirm") && (
                <>
                  <button
                    onClick={() => handleCheckIn(selectedRsv.id)}
                    className="bg-[#087EA4] hover:bg-[#075985] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    ⚡ Setujui & Langsung Check-In
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRsv.id, "disetujui")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Setujui Reservasi
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRsv.id, "dibatalkan")}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Tolak Reservasi
                  </button>
                </>
              )}
              {selectedRsv.status === "disetujui" && (
                <button
                  onClick={() => handleCheckIn(selectedRsv.id)}
                  className="bg-[#087EA4] hover:bg-[#075985] text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  ⚡ Check-In Sekarang
                </button>
              )}
              {selectedRsv.status === "aktif" && (
                <button
                  onClick={() => handleCheckOut(selectedRsv.id)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  🚪 Check-Out Tamu
                </button>
              )}
              <button
                onClick={() => setSelectedRsv(null)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
