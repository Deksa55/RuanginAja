"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthSession, getStoredUser, apiFetcher } from "../../lib/api/client";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [spacesCount, setSpacesCount] = useState<number | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    loadBadgeCounts();
  }, [pathname]);

  async function loadBadgeCounts() {
    try {
      const [rsvRes, spcRes]: any = await Promise.allSettled([
        apiFetcher("/api/admin/reservasi"),
        apiFetcher("/api/admin/spaces"),
      ]);

      if (rsvRes.status === "fulfilled" && rsvRes.value) {
        let list: any[] = [];
        const val = rsvRes.value;
        if (Array.isArray(val?.data?.items)) list = val.data.items;
        else if (Array.isArray(val?.data)) list = val.data;
        else if (Array.isArray(val)) list = val;

        const pending = list.filter((r) => {
          const st = (r.status || "").toLowerCase();
          return st === "belum_dikonfirmasi" || st === "belum_dikonfirm";
        }).length;
        setPendingCount(pending);
      }

      if (spcRes.status === "fulfilled" && spcRes.value) {
        let spcList: any[] = [];
        const val = spcRes.value;
        if (Array.isArray(val?.data)) spcList = val.data;
        else if (Array.isArray(val?.data?.items)) spcList = val.data.items;
        else if (Array.isArray(val)) spcList = val;
        setSpacesCount(spcList.length);
      }
    } catch {
      // ignore badge fetch error
    }
  }

  const handleLogout = () => {
    clearAuthSession();
    router.replace("/auth/login");
  };

  const navItems = [
    {
      label: "Dashboard & Reservasi",
      icon: "📊",
      href: "/admin/reservations",
      badge: pendingCount > 0 ? `${pendingCount} Baru` : null,
      badgeColor: "bg-amber-500 text-white animate-pulse",
    },
    {
      label: "Kelola Ruangan (Spaces)",
      icon: "🏢",
      href: "/admin/spaces",
      badge: spacesCount !== null ? `${spacesCount} Ruang` : null,
      badgeColor: spacesCount === 0 ? "bg-slate-200 text-slate-600" : "bg-sky-100 text-[#087EA4]",
    },
    {
      label: "Data Member / Tamu",
      icon: "👥",
      href: "/admin/members",
    },
    {
      label: "Kode Promo & Diskon",
      icon: "🏷️",
      href: "/admin/promotions",
    },
    {
      label: "Laporan Pendapatan",
      icon: "📈",
      href: "/admin/report",
    },
    {
      label: "Profil Lokasi Coworking",
      icon: "⚙️",
      href: "/admin/profile",
    },
  ];

  return (
    <aside className="w-72 h-screen bg-white text-slate-700 flex flex-col justify-between border-r border-slate-200/80 shrink-0 overflow-y-auto">
      {/* Brand & Space Info */}
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Link href="/" className="block">
            <img
              src="/logo.png"
              alt="RuanginAja"
              className="h-10 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>
          <div className="flex items-center gap-1.5 pl-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#087EA4] animate-pulse"></span>
            <span className="text-[10px] font-bold text-[#087EA4] uppercase tracking-wider">
              Admin Pengelola Space
            </span>
          </div>
        </div>

        {/* Space Owner Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Pengelola Aktif</p>
          <p className="text-sm font-bold text-slate-900 truncate">
            {user?.nama_coworking || user?.nama_pemilik || user?.username || "Admin Space"}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {user?.nama_pemilik ? `Pemilik: ${user.nama_pemilik}` : "Coworking Management"}
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                  isActive
                    ? "bg-[#087EA4] text-white shadow-md shadow-[#087EA4]/25"
                    : "text-slate-600 hover:text-[#087EA4] hover:bg-sky-50/70"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.badgeColor || "bg-sky-100 text-[#087EA4]"}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-6 border-t border-slate-200/80 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all"
        >
          <span>🌐</span> Kembali ke Web Utama
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all text-left"
        >
          <span>🚪</span> Keluar / Logout
        </button>
      </div>
    </aside>
  );
}
