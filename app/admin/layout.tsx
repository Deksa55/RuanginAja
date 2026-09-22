"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "../../components/layout/AdminSidebar";
import { getStoredToken, getStoredUser } from "../../lib/api/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    const role = user?.role?.toLowerCase();

    if (!token || role !== "admin_space") {
      router.replace("/auth/login?role=admin");
      return;
    }

    setAuthorized(true);
  }, [router, pathname]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-bold">Memverifikasi Hak Akses Admin Space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col md:flex-row font-sans antialiased text-slate-800">
      {/* Admin Sidebar */}
      <div className="hidden md:block md:sticky md:top-0 md:h-screen md:self-start shrink-0">
        <AdminSidebar />
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top Navbar (Mobile only) */}
        <header className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <Link href="/admin/reservations" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="RuanginAja"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <span className="text-[10px] font-bold text-[#087EA4] bg-sky-50 border border-sky-200/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Admin Space
          </span>
        </header>

        {/* Child Page Content */}
        <div className="flex-1 min-h-0 p-4 sm:p-8 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
