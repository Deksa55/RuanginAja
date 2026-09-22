"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/layout/Navbar";
import {
  apiFetcher,
  formatRupiah,
  resolveSpaceImage,
  getStoredUser,
} from "../../../lib/api/client";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Tag,
  Wifi,
  Zap,
  Wind,
  Coffee,
  ShieldCheck,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const spaceId = resolvedParams.id;
  const router = useRouter();

  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form State
  const [tanggal, setTanggal] = useState("");
  const [jamMulai, setJamMulai] = useState("09:00");
  const [durasi, setDurasi] = useState(2);
  const [kodePromoInput, setKodePromoInput] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    id?: number;
    nama_diskon: string;
    persentase_diskon: number;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [availablePromos, setAvailablePromos] = useState<any[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [showManualPromo, setShowManualPromo] = useState(false);

  // Availability checking state
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availStatus, setAvailStatus] = useState<{
    checked: boolean;
    available: boolean;
    message?: string;
  }>({ checked: false, available: true });

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
    // Set default tanggal to tomorrow or today
    const now = new Date();
    const formatted = now.toISOString().split("T")[0];
    setTanggal(formatted);
    loadSpaceDetail();
    loadPromos();
  }, [spaceId]);

  async function loadPromos() {
    setLoadingPromos(true);
    try {
      const res: any = await apiFetcher("/api/diskon/active");
      if (res?.status && Array.isArray(res.data)) {
        setAvailablePromos(res.data);
      }
    } catch (err) {
      console.warn("Gagal memuat promo aktif:", err);
    } finally {
      setLoadingPromos(false);
    }
  }

  const handleSelectPromo = (promo: any) => {
    // If currently selected, clicking again toggles it off
    if (
      appliedPromo?.id === promo.id ||
      appliedPromo?.nama_diskon?.toUpperCase() === promo.nama_diskon?.toUpperCase()
    ) {
      setAppliedPromo(null);
      setKodePromoInput("");
      setPromoError("");
      return;
    }

    const pct = Number(promo.persentase_diskon ?? promo.diskon ?? 0);
    setAppliedPromo({
      id: promo.id,
      nama_diskon: promo.nama_diskon,
      persentase_diskon: isNaN(pct) ? 0 : pct,
    });
    setKodePromoInput(promo.nama_diskon);
    setPromoError("");
  };

  // When date, time, or duration changes, check availability
  useEffect(() => {
    if (tanggal && jamMulai && durasi > 0 && space) {
      checkAvailability();
    }
  }, [tanggal, jamMulai, durasi, space]);

  async function loadSpaceDetail() {
    setLoading(true);
    try {
      const res: any = await apiFetcher(`/api/spaces/${spaceId}`);
      if (res?.data) setSpace(res.data);
      else if (res) setSpace(res);
    } catch (err) {
      console.error("Gagal memuat detail space:", err);
    } finally {
      setLoading(false);
    }
  }

  async function checkAvailability() {
    if (!tanggal || !jamMulai || durasi <= 0 || !spaceId) return;
    setCheckingAvail(true);
    try {
      const res: any = await apiFetcher(
        `/api/spaces/availability?id_space=${spaceId}&tanggal=${tanggal}&jam_mulai=${jamMulai}&durasi_jam=${durasi}`
      );

      let isAvailable = true;
      let feedbackMessage = "Jadwal tersedia untuk dipesan!";

      if (Array.isArray(res?.data)) {
        if (res.data.length > 0) {
          const item =
            res.data.find((s: any) => String(s.id) === String(spaceId)) || res.data[0];
          if (item) {
            if (typeof item.is_available === "boolean") {
              isAvailable = item.is_available;
            } else if (typeof item.available === "boolean") {
              isAvailable = item.available;
            } else if (Array.isArray(item.conflicts)) {
              isAvailable = item.conflicts.length === 0;
            }
          }
        } else {
          // Array kosong menandakan tidak ada konflik jadwal reservasi
          isAvailable = true;
        }
      } else if (res?.data && typeof res.data === "object") {
        if (typeof res.data.is_available === "boolean") {
          isAvailable = res.data.is_available;
        } else if (typeof res.data.available === "boolean") {
          isAvailable = res.data.available;
        } else if (Array.isArray(res.data.conflicts)) {
          isAvailable = res.data.conflicts.length === 0;
        }
      } else if (res?.status) {
        isAvailable = true;
      }

      if (!isAvailable) {
        feedbackMessage = "Jadwal sudah terisi atau bentrok dengan reservasi lain.";
      }

      setAvailStatus({
        checked: true,
        available: isAvailable,
        message: feedbackMessage,
      });
    } catch (err: any) {
      const errMsg = err?.message || "";
      const isConflict =
        errMsg.toLowerCase().includes("terisi") ||
        errMsg.toLowerCase().includes("penuh") ||
        errMsg.toLowerCase().includes("bentrok") ||
        errMsg.toLowerCase().includes("conflict");

      setAvailStatus({
        checked: true,
        available: !isConflict,
        message: isConflict
          ? errMsg
          : "Jadwal dapat dipesan (ketersediaan akan divalidasi saat konfirmasi).",
      });
    } finally {
      setCheckingAvail(false);
    }
  }

  const handleCheckPromo = async () => {
    if (!kodePromoInput.trim()) return;
    setCheckingPromo(true);
    setPromoError("");
    try {
      const res: any = await apiFetcher("/api/diskon/check", {
        method: "POST",
        body: JSON.stringify({ nama_diskon: kodePromoInput.trim().toUpperCase() }),
      });

      // Backend returns: { status: true, data: { valid: true, diskon: { id, nama_diskon, persentase_diskon } } }
      const diskonData = res?.data?.diskon || res?.data || res?.diskon;
      if (res?.status && diskonData && res?.data?.valid !== false) {
        const pct = Number(diskonData.persentase_diskon ?? diskonData.diskon ?? 0);
        setAppliedPromo({
          id: diskonData.id,
          nama_diskon: diskonData.nama_diskon || kodePromoInput.trim().toUpperCase(),
          persentase_diskon: isNaN(pct) ? 0 : pct,
        });
        setPromoError("");
      } else {
        setPromoError(res?.data?.message || res?.message || "Kode promo tidak valid atau kedaluwarsa.");
        setAppliedPromo(null);
      }
    } catch (err: any) {
      setPromoError(err.message || "Kode promo tidak ditemukan.");
      setAppliedPromo(null);
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = getStoredUser();
    if (!user) {
      alert("Silakan login sebagai Member terlebih dahulu untuk melakukan reservasi.");
      router.push("/auth/login");
      return;
    }

    if (user.role === "admin_space") {
      alert("Akun Admin Space tidak dapat membuat reservasi member. Silakan gunakan akun Member.");
      return;
    }

    const durasiJam = Number(durasi);
    if (!Number.isFinite(durasiJam) || durasiJam < 1) {
      alert("Durasi sewa minimal 1 jam.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        id_space: Number(spaceId),
        tanggal_reservasi: tanggal,
        jam_mulai: jamMulai,
        durasi_jam: durasiJam,
      };
      if (appliedPromo?.id) {
        payload.id_diskon = Number(appliedPromo.id);
      }
      if (appliedPromo?.nama_diskon) {
        payload.kode_promo = appliedPromo.nama_diskon;
      }

      const res: any = await apiFetcher("/api/reservasi", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.status || res?.data) {
        alert("Reservasi Berhasil Dibuat! Menunggu persetujuan Admin.");
        router.push("/member/reservations");
      }
    } catch (err: any) {
      alert(err.message || "Gagal membuat reservasi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-bold">Memuat rincian ruangan...</p>
          </div>
        </div>
      </div>
    );
  }

  const hargaPerJam = Number(space?.harga_per_jam || space?.harga || 0);
  const subtotal = Math.max(0, hargaPerJam * Number(durasi || 1));
  const diskonPersen = Number(appliedPromo?.persentase_diskon || 0);
  const potonganDiskon = appliedPromo && diskonPersen > 0
    ? Math.round((subtotal * diskonPersen) / 100)
    : 0;
  const totalBayar = Math.max(0, subtotal - potonganDiskon);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link href="/spaces" className="hover:text-[#087EA4]">
            ← Kembali ke Katalog
          </Link>
          <span>/</span>
          <span className="text-slate-900">{space?.nama_space || "Detail Space"}</span>
        </div>

        {/* Main Grid: Detail on Left, Booking Form on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sisi Kiri: Foto & Detail Spesifikasi Space */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="h-80 sm:h-96 relative bg-slate-100 overflow-hidden">
                <img
                  src={resolveSpaceImage(space)}
                  alt={space?.nama_space || "Space"}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-[#087EA4] px-4 py-1.5 rounded-full text-xs font-bold uppercase shadow-sm">
                  {space?.tipe === "meeting_room"
                    ? "Meeting Room"
                    : space?.tipe === "private_office"
                    ? "Private Office"
                    : "Personal Desk"}
                </span>
                <span className="absolute top-4 right-4 bg-slate-900/85 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Kapasitas: {space?.kapasitas || 1} Orang</span>
                </span>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {space?.nama_space || space?.nama}
                  </h1>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    Lokasi: {space?.owner?.nama_coworking || "Moklet Hub Coworking Space"} · Pengelola: {space?.owner?.nama_pemilik || "Ahmad Bidin"}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Deskripsi & Fasilitas Ruangan
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {space?.deskripsi ||
                      "Ruang kerja nyaman dengan fasilitas penunjang produktivitas lengkap: Wi-Fi dedicated berkecepatan tinggi, colokan listrik per meja, AC dingin, dan akses minuman gratis."}
                  </p>
                </div>

                {/* Amenities Badges */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Fasilitas Termasuk
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-semibold text-slate-700">
                    <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100/80 flex items-center gap-2">
                      <Wifi className="w-3.5 h-3.5 text-[#087EA4]" />
                      <span>Wi-Fi 100Mbps</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100/80 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#087EA4]" />
                      <span>Stopkontak Meja</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100/80 flex items-center gap-2">
                      <Wind className="w-3.5 h-3.5 text-[#087EA4]" />
                      <span>Ruangan Ber-AC</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100/80 flex items-center gap-2">
                      <Coffee className="w-3.5 h-3.5 text-[#087EA4]" />
                      <span>Free Coffee & Water</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100/80 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#087EA4]" />
                      <span>Kursi Ergonomis</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100/80 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#087EA4]" />
                      <span>QR Fast Check-In</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Form Reservasi & Kalkulasi Biaya Interaktif */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6 sticky top-24">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Form Reservasi</h2>
                  <p className="text-[11px] text-slate-400">Pilih tanggal, jam, dan masukkan kode promo</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tarif</span>
                  <span className="text-base font-black text-[#087EA4]">
                    {formatRupiah(hargaPerJam)} <span className="text-[10px] font-normal text-slate-500">/jam</span>
                  </span>
                </div>
              </div>

              <form onSubmit={handleBooking} className="space-y-4">
                {/* Tanggal */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Tanggal Reservasi
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-bold outline-none focus:border-[#087EA4]"
                  />
                </div>

                {/* Jam Mulai & Durasi */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Jam Mulai (24-jam)
                    </label>
                    <input
                      type="time"
                      required
                      value={jamMulai}
                      onChange={(e) => setJamMulai(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-bold outline-none focus:border-[#087EA4]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Durasi Sewa (Jam)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={durasi}
                      onChange={(e) => setDurasi(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-bold outline-none focus:border-[#087EA4]"
                    />
                  </div>
                </div>

                {/* Availability Status Indicator */}
                {availStatus.checked && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      availStatus.available
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {availStatus.available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold text-[11px]">
                      {checkingAvail ? "Memeriksa ketersediaan..." : availStatus.message}
                    </span>
                  </div>
                )}

                {/* Pilihan Promo / Diskon */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pilihan Promo Diskon
                    </label>
                    {availablePromos.length > 0 && (
                      <span className="text-[10px] font-semibold text-[#087EA4] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                        {availablePromos.length} Promo Tersedia
                      </span>
                    )}
                  </div>

                  {/* List Promo Aktif yang Bisa Langsung Diklik */}
                  {loadingPromos ? (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                      Memuat daftar promo aktif...
                    </div>
                  ) : availablePromos.length > 0 ? (
                    <div className="space-y-2">
                      {availablePromos.map((promo: any) => {
                        const isSelected =
                          appliedPromo?.id === promo.id ||
                          appliedPromo?.nama_diskon?.toUpperCase() ===
                            promo.nama_diskon?.toUpperCase();
                        const diskonAngka = Number(
                          promo.persentase_diskon ?? promo.diskon ?? 0
                        );

                        return (
                          <div
                            key={promo.id || promo.nama_diskon}
                            onClick={() => handleSelectPromo(promo)}
                            role="button"
                            tabIndex={0}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                              isSelected
                                ? "bg-sky-50/90 border-[#087EA4] ring-2 ring-[#087EA4]/25 shadow-xs"
                                : "bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-sky-300"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-[#087EA4] text-white"
                                    : "bg-sky-50 text-[#087EA4] border border-sky-100"
                                }`}
                              >
                                <Tag className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-black text-xs text-slate-900 tracking-wide uppercase truncate">
                                    {promo.nama_diskon}
                                  </span>
                                  <span className="bg-sky-100 text-[#087EA4] font-black text-[10px] px-2 py-0.5 rounded-full shrink-0">
                                    Diskon {diskonAngka}%
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                  Klik untuk {isSelected ? "melepas" : "menerapkan"} promo
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#087EA4] text-white text-[10px] font-bold shadow-xs">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Terpakai</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200/80">
                                  Pakai
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Toggle Manual Input jika user punya kode khusus atau tidak ada promo API */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowManualPromo(!showManualPromo)}
                      className="text-[11px] font-bold text-slate-500 hover:text-[#087EA4] inline-flex items-center gap-1 transition-colors"
                    >
                      <span>
                        {showManualPromo
                          ? "Tutup input manual"
                          : "Punya kode voucher lain? Masukkan manual"}
                      </span>
                      {showManualPromo ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {(showManualPromo || availablePromos.length === 0) && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          placeholder="Contoh: DISKONHEMAT20"
                          value={kodePromoInput}
                          onChange={(e) => setKodePromoInput(e.target.value.toUpperCase())}
                          className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold outline-none focus:border-[#087EA4]"
                        />
                        <button
                          type="button"
                          onClick={handleCheckPromo}
                          disabled={checkingPromo || !kodePromoInput.trim()}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {checkingPromo ? "Cek..." : "Gunakan"}
                        </button>
                      </div>
                    )}
                  </div>

                  {appliedPromo && (
                    <div className="mt-2 p-2.5 bg-sky-50 text-[#087EA4] border border-sky-100/90 rounded-xl text-[11px] font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#087EA4]" />
                        <span>Promo {appliedPromo.nama_diskon} Aktif! (-{diskonPersen}%)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedPromo(null);
                          setKodePromoInput("");
                        }}
                        className="text-[#087EA4] hover:underline cursor-pointer font-semibold"
                      >
                        Batal
                      </button>
                    </div>
                  )}

                  {promoError && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">
                      {promoError}
                    </p>
                  )}
                </div>

                {/* Rincian Perhitungan Biaya */}
                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Tarif per Jam</span>
                    <span>{formatRupiah(hargaPerJam)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Durasi Penggunaan</span>
                    <span>{durasi} Jam</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Subtotal Biaya</span>
                    <span>{formatRupiah(subtotal)}</span>
                  </div>
                  {appliedPromo && diskonPersen > 0 && (
                    <div className="flex justify-between text-[#087EA4] font-bold">
                      <span>Potongan Diskon ({diskonPersen}%)</span>
                      <span>- {formatRupiah(potonganDiskon)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">Total Pembayaran</span>
                    <span className="font-black text-xl text-[#087EA4]">
                      {formatRupiah(totalBayar)}
                    </span>
                  </div>
                </div>

                {/* Tombol Submit */}
                <button
                  type="submit"
                  disabled={submitting || (availStatus.checked && !availStatus.available)}
                  className="w-full bg-[#087EA4] hover:bg-[#075985] text-white font-bold py-4 rounded-2xl text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
                >
                  {submitting
                    ? "Memproses Pemesanan..."
                    : !currentUser
                    ? "Masuk & Buat Reservasi"
                    : "Konfirmasi & Buat Reservasi"}
                </button>

                {!currentUser && (
                  <p className="text-[11px] text-slate-400 text-center font-medium">
                     Anda belum masuk. Anda akan diarahkan untuk login terlebih dahulu.
                  </p>
                )}

                {currentUser?.role === "admin_space" && (
                  <p className="text-[11px] text-amber-600 text-center font-medium">
                     Anda sedang masuk sebagai Admin Space. Reservasi hanya untuk akun Member.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
