"use client";

import Link from "next/link";
import QRCodeDisplay from "./QRCodeDisplay";
import {
  formatRupiah,
  resolveReservationTotal,
  resolveReservationSpaceName,
  formatTanggal,
} from "../../lib/api/client";

interface ETicketCardProps {
  ticket: any | null;
  onClose: () => void;
}

export default function ETicketCard({ ticket, onClose }: ETicketCardProps) {
  if (!ticket) return null;

  const qrPayload =
    ticket.qr_code_data ||
    ticket.qr_code_payload ||
    `COWORKING|${ticket.kode_booking || `CWK-${String(ticket.id).padStart(6, "0")}`}|${ticket.id}|${ticket.tanggal_reservasi || ticket.tanggal || ""}|${ticket.jam_mulai || ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-white space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <div className="text-center space-y-1">
          <div className="flex justify-center items-center gap-2 mb-1">
            <img src="/logo-icon.png" alt="RuanginAja" className="h-6 w-auto object-contain" />
            <h3 className="text-lg font-black text-white">
              RuanginAja<span className="text-[#087EA4]">.</span>
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400 block">
            E-Ticket Digital Resmi
          </span>
          <p className="text-xs text-slate-400">
            {resolveReservationSpaceName(ticket)}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-3">
          <div className="inline-block bg-white p-2 rounded-xl shadow-md">
            <QRCodeDisplay value={qrPayload} size={140} />
          </div>
          <p className="font-mono text-xs font-black text-sky-400">
            #{ticket.kode_booking || `BOOK-${ticket.id}`}
          </p>
        </div>

        <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Jadwal</span>
            <span className="font-bold text-slate-200">
              {formatTanggal(ticket.tanggal_reservasi || ticket.tanggal)} ({ticket.jam_mulai || "-"})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Tagihan</span>
            <span className="font-black text-sky-400">
              {formatRupiah(resolveReservationTotal(ticket))}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Link
            href={`/member/reservations/${ticket.id}/ticket`}
            className="flex-1 bg-[#087EA4] hover:bg-[#075985] text-white py-2.5 rounded-xl text-xs font-bold text-center shadow-md"
          >
            Halaman Cetak Penuh 🖨️
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}