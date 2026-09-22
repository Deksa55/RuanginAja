"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStoredUser, clearAuthSession, resolveMemberAvatar } from "../../lib/api/client";
import { ChevronDown, User, Building2 } from "lucide-react";

interface NavbarProps {
  theme?: "light" | "dark";
}

export default function Navbar({ theme = "light" }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const isMember = user?.role === "member";
  const isAdmin = user?.role === "admin_space";

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-sky-100 shadow-xs shadow-sky-950/5 text-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand (Smaller, Clean Proportional) */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group py-1">
              <img
                src="/logo.png"
                alt="RuanginAja"
                className="h-7 sm:h-7.5 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation Links (Ocean Blue Pill Bar) */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-slate-100/80 border border-slate-200/70 text-slate-600">
              <Link
                href="/"
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
                  pathname === "/"
                    ? "text-white bg-[#087EA4] shadow-xs"
                    : "hover:text-[#087EA4] hover:bg-white"
                }`}
              >
                Beranda
              </Link>
              <Link
                href="/spaces"
                className={`px-3.5 py-1.5 rounded-full transition-all ${
                  pathname.startsWith("/spaces")
                    ? "text-white bg-[#087EA4] font-bold shadow-xs"
                    : "hover:text-[#087EA4] hover:bg-white"
                }`}
              >
                Katalog Space
              </Link>
              <Link
                href="/#tipe-ruangan"
                className="px-3.5 py-1.5 rounded-full hover:text-[#087EA4] hover:bg-white transition-all"
              >
                Tipe Ruang
              </Link>
              <Link
                href="/#promo-spesial"
                className="px-3.5 py-1.5 rounded-full hover:text-[#087EA4] hover:bg-white transition-all"
              >
                Promo
              </Link>
              {isMember && (
                <>
                  <Link
                    href="/member/reservations"
                    className={`px-3.5 py-1.5 rounded-full transition-all ${
                      pathname === "/member/reservations"
                        ? "text-white bg-[#087EA4] font-bold shadow-xs"
                        : "hover:text-[#087EA4] hover:bg-white"
                    }`}
                  >
                    Status Booking
                  </Link>
                  <Link
                    href="/member/history"
                    className={`px-3.5 py-1.5 rounded-full transition-all ${
                      pathname === "/member/history"
                        ? "text-white bg-[#087EA4] font-bold shadow-xs"
                        : "hover:text-[#087EA4] hover:bg-white"
                    }`}
                  >
                    Histori & E-Ticket
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link
                  href="/admin/reservations"
                  className="px-3.5 py-1.5 rounded-full bg-sky-100 text-[#087EA4] border border-sky-200/80 font-bold hover:bg-[#087EA4] hover:text-white transition-all"
                >
                  ⚙️ Panel Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right Section: User Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={isAdmin ? "/admin/reservations" : "/member/profile"}
                  className="flex items-center gap-2.5 p-1 rounded-full hover:bg-sky-50 transition-colors"
                >
                  <img
                    src={resolveMemberAvatar(user)}
                    alt={user.nama_member || user.username}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#087EA4]/40"
                  />
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-bold leading-tight text-slate-900">
                      {user.nama_member || user.username}
                    </p>
                    <span className="text-[10px] font-medium text-slate-400 uppercase">
                      {user.role === "admin_space" ? "Admin Space" : "Member"}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl transition-colors text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Keluar / Logout"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-700 hover:text-[#087EA4] hover:bg-sky-50 transition-all"
                >
                  Masuk
                </Link>

                {/* Dropdown Daftar Berdasarkan Role */}
                <div className="relative group">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold bg-[#087EA4] hover:bg-[#075985] text-white shadow-md shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <span>Daftar</span>
                    <span className="text-[10px]">↗</span>
                    <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
                  </Link>
                  <div className="absolute right-0 top-full pt-2 w-60 hidden group-hover:block animate-fadeIn z-50">
                    <div className="rounded-2xl p-2 shadow-xl bg-white border border-sky-100 text-slate-800 space-y-1">
                      <Link
                        href="/auth/register?role=member"
                        className="flex items-center gap-2.5 p-2.5 rounded-xl transition-colors hover:bg-sky-50 text-slate-800 hover:text-[#087EA4]"
                      >
                        <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#087EA4] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">Daftar Member</div>
                          <div className="text-[10px] text-slate-400">Penyewa & Tamu Space</div>
                        </div>
                      </Link>
                      <Link
                        href="/auth/register?role=admin"
                        className="flex items-center gap-2.5 p-2.5 rounded-xl transition-colors hover:bg-slate-50 text-slate-800 hover:text-slate-900"
                      >
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">Daftar Admin Space</div>
                          <div className="text-[10px] text-slate-400">Pengelola Coworking</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b px-6 py-4 space-y-3 animate-fadeIn bg-white border-slate-200 text-slate-700 shadow-lg">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold hover:text-[#087EA4]"
            >
              Beranda
            </Link>
            <Link
              href="/spaces"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold hover:text-[#087EA4]"
            >
              Katalog Space
            </Link>
            <Link
              href="/#tipe-ruangan"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold hover:text-[#087EA4]"
            >
              Tipe Ruang
            </Link>
            <Link
              href="/#promo-spesial"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold hover:text-[#087EA4]"
            >
              Promo Spesial
            </Link>
            {isMember && (
              <>
                <Link
                  href="/member/reservations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-bold hover:text-[#087EA4]"
                >
                  Status Pemesanan
                </Link>
                <Link
                  href="/member/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-bold hover:text-[#087EA4]"
                >
                  Histori & E-Ticket
                </Link>
              </>
            )}
            {isAdmin && (
              <Link
                href="/admin/reservations"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-bold text-[#087EA4]"
              >
                Panel Pengelola Admin Space
              </Link>
            )}

            {!user && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Masuk ke Akun
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/auth/register?role=member"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 px-2 rounded-xl text-xs font-bold text-center text-white bg-[#087EA4] hover:bg-[#075985]"
                  >
                    Daftar Member
                  </Link>
                  <Link
                    href="/auth/register?role=admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 px-2 rounded-xl text-xs font-bold text-center bg-slate-100 text-slate-800 hover:bg-slate-200"
                  >
                    Daftar Admin
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}


