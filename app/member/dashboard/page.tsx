"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  apiFetcher,
  formatRupiah,
  resolveReservationTotal,
  resolveReservationSpaceName,
  formatTanggal,
} from "../../../lib/api/client";
import ETicketCard from "../../../components/reservation/ETicketCard";

export default function MemberDashboard() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    try {
      const res = await apiFetcher("/reservasi/my");
      if (res.status && Array.isArray(res.data)) {
        setReservations(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = async (id: number) => {
    if (!confirm("Yakin batalkan reservasi ini?")) return;
    try {
      const res = await apiFetcher(`/reservasi/${id}/cancel`, { method: "PATCH" });
      if (res.status) {
        alert("Pemesanan berhasil dibatalkan!");
        loadReservations();
      }
    } catch (err: any) {
      alert(err.message || "Gagal batalkan pesanan");
    }
  };

  const showETicket = async (id: number) => {
    try {
      const res = await apiFetcher(`/reservasi/${id}/e-ticket`);
      if (res.status) setSelectedTicket(res.data);
    } catch (err) {
      alert("Gagal memuat E-Ticket");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Dashboard Member</h1>
            <p className="text-xs text-slate-500">Kelola reservasi & E-Ticket digital</p>
          </div>
          <Link href="/" className="bg-[#087EA4] text-white text-xs font-bold px-4 py-2.5 rounded-xl">
            + Pesan Space Baru
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 border space-y-4">
          <h2 className="text-lg font-bold">Status Pemesanan Saya</h2>

          {loading ? (
            <p className="text-xs text-slate-400">Memuat data...</p>
          ) : reservations.length === 0 ? (
            <p className="text-xs text-slate-500">Belum ada pemesanan.</p>
          ) : (
            <div className="space-y-3">
              {reservations.map((r) => (
                <div key={r.id} className="p-4 border rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-50">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-[#087EA4]">#{r.kode_booking}</span>
                    <p className="text-sm font-bold">{resolveReservationSpaceName(r)}</p>
                    <p className="text-xs text-slate-500">Tanggal: {formatTanggal(r.tanggal_reservasi)} ({r.jam_mulai})</p>
                  </div>

                  <div className="flex items-center gap-3 justify-between md:justify-end">
                    <p className="text-sm font-black text-[#087EA4]">{formatRupiah(resolveReservationTotal(r))}</p>
                    <div className="flex gap-2">
                      <button onClick={() => showETicket(r.id)} className="bg-slate-800 text-white text-xs px-3 py-2 rounded-xl font-bold">
                        E-Ticket QR
                      </button>
                      {r.status === "belum_dikonfirm" && (
                        <button onClick={() => handleCancel(r.id)} className="bg-red-600 text-white text-xs px-3 py-2 rounded-xl font-bold">
                          Batal
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ETicketCard ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}