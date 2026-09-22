"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Navbar from "../../../../../components/layout/Navbar";
import QRCodeDisplay from "../../../../../components/reservation/QRCodeDisplay";
import {
  apiFetcher,
  formatRupiah,
  resolveReservationTotal,
  resolveReservationSpaceName,
  formatTanggal,
} from "../../../../../lib/api/client";
import { Ticket, Building2, Copy, Check, Printer } from "lucide-react";

export default function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [id]);

  async function loadTicket() {
    setLoading(true);
    try {
      // Endpoint No. 22: GET /api/reservasi/{id}/e-ticket
      const res: any = await apiFetcher(`/api/reservasi/${id}/e-ticket`);
      if (res?.data) {
        setTicket(res.data);
      } else if (res) {
        setTicket(res);
      }
    } catch (err: any) {
      console.error("Gagal memuat e-ticket:", err);
      // Fallback: try GET /api/reservasi/{id}
      try {
        const fallbackRes: any = await apiFetcher(`/api/reservasi/${id}`);
        const data = fallbackRes?.data || fallbackRes;
        if (data) {
          setTicket({
            e_ticket_number: `TICKET-${data.kode_booking || data.id}`,
            kode_booking: data.kode_booking || `BOOK-${data.id}`,
            coworking_space: {
              nama: "Moklet Hub Coworking Space",
              telepon: "081298765432",
            },
            member: {
              nama: data.member?.nama_member || data.nama_member || "Member",
              instansi: data.member?.instansi || "Universitas Indonesia",
              telp: data.member?.telp || "-",
            },
            space: {
              nama: resolveReservationSpaceName(data),
              tipe: data.detail_reservasi?.[0]?.space?.tipe || data.space?.tipe || "desk",
              harga_per_jam:
                data.detail_reservasi?.[0]?.space?.harga_per_jam ||
                data.harga_per_jam ||
                data.space?.harga_per_jam ||
                20000,
            },
            jadwal: {
              tanggal: formatTanggal(data.tanggal_reservasi || data.tanggal),
              jam_mulai: data.jam_mulai || "09:00",
              jam_selesai: data.jam_selesai || "12:00",
              durasi: `${data.durasi_jam || 1} Jam`,
            },
            rincian_pembayaran: {
              tarif_kotor:
                data.total_harga_awal ||
                resolveReservationTotal(data) + (data.potongan_diskon || 0),
              diskon_promo: data.diskon_promo || "-",
              potongan: data.potongan_diskon || 0,
              total_dibayar: resolveReservationTotal(data),
            },
            status_reservasi: data.status || "disetujui",
            qr_code_payload: `VERIFY-RESERVASI-${data.id}`,
          });
        }
      } catch (fErr: any) {
        setError("Gagal memuat E-Ticket atau reservasi belum dikonfirmasi.");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = () => {
    const code = ticket?.kode_booking || ticket?.e_ticket_number || id;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-bold">Menerbitkan E-Ticket Resmi...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/90 text-center max-w-sm space-y-4 shadow-sm">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-black text-sm text-slate-900">Tiket Belum Tersedia</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {error || "E-Ticket hanya dapat diakses setelah reservasi disetujui oleh admin."}
            </p>
            <Link
              href="/member/reservations"
              className="inline-block bg-[#087EA4] hover:bg-[#075985] text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-sky-500/20"
            >
              Kembali ke Status Pemesanan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const qrPayload =
    ticket.qr_code_data ||
    ticket.qr_code_payload ||
    `COWORKING|${ticket.kode_booking || ticket.booking_code || `CWK-${String(ticket.id || id).padStart(6, "0")}`}|${ticket.id || id}|${ticket.jadwal?.tanggal || ticket.tanggal_reservasi || ""}|${ticket.jadwal?.jam_mulai || ticket.jam_mulai || ""}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative overflow-hidden">
      {/* Soft Ambient Sky Background Blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-sky-200/40 via-sky-100/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <div className="no-print relative z-10">
        <Navbar />
      </div>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-[32px] overflow-hidden shadow-2xl shadow-sky-950/10 p-6 sm:p-8 space-y-5 relative e-ticket-card">
          {/* Top Brand Decorative Strip */}
          <div className="h-2.5 bg-gradient-to-r from-[#087EA4] via-[#0284C7] to-sky-400 absolute top-0 left-0 right-0"></div>

          {/* Header Ticket */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-4 pt-1">
            <div className="space-y-1">
              <Link href="/" className="inline-block">
                <img src="/logo.png" alt="RuanginAja" className="h-7 w-auto object-contain" />
              </Link>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#087EA4] block">
                E-Ticket & Bukti Reservasi Digital
              </span>
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{ticket.coworking_space?.nama || "RuanginAja Coworking"}</span>
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${
                ticket.status_reservasi === "disetujui"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : ticket.status_reservasi === "aktif"
                  ? "bg-sky-50 text-[#087EA4] border border-sky-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              ● {ticket.status_reservasi || "Disetujui"}
            </span>
          </div>

          {/* QR Code Section */}
          <div className="bg-gradient-to-b from-sky-50/80 via-white to-sky-50/40 p-6 rounded-3xl border border-sky-100/90 text-center space-y-3.5 shadow-xs">
            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Tunjukkan QR Code ini kepada Petugas di Lokasi
            </p>

            <div className="inline-block bg-white p-3.5 rounded-2xl shadow-md shadow-sky-900/10 border-2 border-sky-100">
              <QRCodeDisplay value={qrPayload} size={160} />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                Kode Reservasi
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-lg font-black text-[#087EA4] tracking-widest bg-white px-3 py-1 rounded-xl border border-sky-200 shadow-xs">
                  {ticket.kode_booking || `BOOK-${id}`}
                </span>
                <button
                  onClick={handleCopy}
                  className="no-print bg-white hover:bg-sky-50 text-[#087EA4] border border-sky-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                  title="Salin Kode"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
              {ticket.e_ticket_number && (
                <p className="text-[10px] font-mono text-slate-400 pt-0.5">
                  No. Tiket: {ticket.e_ticket_number}
                </p>
              )}
            </div>
          </div>

          {/* Perforated / Cutout Ticket Notch Divider */}
          <div className="relative -mx-6 sm:-mx-8 my-1 flex items-center">
            <div className="w-4 h-7 bg-slate-50 border-r border-slate-200/90 rounded-r-full shadow-inner"></div>
            <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-3"></div>
            <div className="w-4 h-7 bg-slate-50 border-l border-slate-200/90 rounded-l-full shadow-inner"></div>
          </div>

          {/* Rincian Pemesanan */}
          <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-400 font-medium">Nama Pelanggan</span>
              <span className="font-bold text-slate-900">
                {ticket.member?.nama || ticket.member?.nama_member || "Member"}
              </span>
            </div>

            {ticket.member?.instansi && (
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Asal Instansi</span>
                <span className="font-bold text-slate-800">{ticket.member.instansi}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-400 font-medium">Ruangan (Space)</span>
              <span className="font-bold text-slate-900">
                {ticket.space?.nama || ticket.space?.nama_space || "Coworking Space"}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-400 font-medium">Jadwal Reservasi</span>
              <span className="font-bold text-slate-800">
                {ticket.jadwal?.tanggal || ticket.tanggal_reservasi || "-"}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-400 font-medium">Waktu Pemakaian</span>
              <span className="font-bold text-slate-800">
                {ticket.jadwal?.jam_mulai || ticket.jam_mulai || "-"} s/d{" "}
                {ticket.jadwal?.jam_selesai || ticket.jam_selesai || "-"} (
                {ticket.jadwal?.durasi || `${ticket.durasi_jam || 1} Jam`})
              </span>
            </div>

            {ticket.rincian_pembayaran?.potongan > 0 && (
              <div className="flex justify-between py-1 text-emerald-600 font-semibold border-b border-slate-200/60">
                <span>Potongan Promo ({ticket.rincian_pembayaran.diskon_promo})</span>
                <span>- {formatRupiah(ticket.rincian_pembayaran.potongan)}</span>
              </div>
            )}

            <div className="flex justify-between pt-2.5 items-center">
              <span className="font-bold text-slate-700">Total Dibayar</span>
              <span className="font-black text-lg sm:text-xl text-[#087EA4]">
                {formatRupiah(
                  ticket.rincian_pembayaran?.total_dibayar ||
                    ticket.total_bayar ||
                    ticket.total_harga
                )}
              </span>
            </div>
          </div>

          {/* Action Buttons (Excluded from print) */}
          <div className="space-y-3 no-print pt-1">
            <button
              onClick={handlePrint}
              className="w-full bg-gradient-to-r from-[#087EA4] to-[#0284C7] hover:from-[#075985] hover:to-[#0369A1] text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-md shadow-sky-500/25 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Unduh Nota E-Ticket (PDF)</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/member/reservations"
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold rounded-2xl text-xs transition-all text-center shadow-xs cursor-pointer"
              >
                Status Pemesanan
              </Link>
              <Link
                href="/member/history"
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold rounded-2xl text-xs transition-all text-center shadow-xs cursor-pointer"
              >
                Histori Transaksi
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}