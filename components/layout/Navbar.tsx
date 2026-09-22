"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  getStoredUser,
  clearAuthSession,
  resolveMemberAvatar,
  apiFetcher,
} from "../../lib/api/client";
import {
  ChevronDown,
  User,
  Building2,
  X,
  Phone,
  Briefcase,
  MapPin,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Ticket,
} from "lucide-react";

interface NavbarProps {
  theme?: "light" | "dark";
}

export default function Navbar({ theme = "light" }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    if (stored) {
      loadProfileData();
    }
  }, [pathname]);

  async function loadProfileData() {
    try {
      const res: any = await apiFetcher("/api/auth/profile");
      if (res?.status && res?.data) {
        setFullProfile(res.data);
      }
    } catch {
      // Keep stored user fallback
    }
  }

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setFullProfile(null);
    setProfileModalOpen(false);
    router.push("/");
    router.refresh();
  };

  const isMember = user?.role === "member";
  const isAdmin = user?.role === "admin_space";

  // Check cached registration data in localStorage
  let cachedReg: any = null;
  const username = user?.username || fullProfile?.username || "";
  if (typeof window !== "undefined" && username) {
    try {
      const saved = localStorage.getItem(`registered_profile_${username}`);
      if (saved) cachedReg = JSON.parse(saved);
    } catch {}
  }

  const profileDisplay = {
    nama:
      fullProfile?.member?.nama_member ||
      cachedReg?.nama_member ||
      fullProfile?.space_owner?.nama_coworking ||
      user?.nama_coworking ||
      user?.nama_member ||
      user?.nama ||
      user?.username ||
      "Pengguna",
    username: username || "user",
    roleLabel: isAdmin ? "Admin Space" : "Member Terdaftar",
    telp:
      fullProfile?.member?.telp ||
      cachedReg?.telp ||
      fullProfile?.space_owner?.telp ||
      user?.telp ||
      "-",
    instansi:
      fullProfile?.member?.instansi ||
      cachedReg?.instansi ||
      (isAdmin
        ? fullProfile?.space_owner?.nama_pemilik
          ? `Pemilik: ${fullProfile.space_owner.nama_pemilik}`
          : user?.nama_pemilik
          ? `Pemilik: ${user.nama_pemilik}`
          : "Pengelola Coworking"
        : "-"),
    alamat:
      fullProfile?.member?.alamat ||
      cachedReg?.alamat ||
      fullProfile?.space_owner?.alamat ||
      user?.alamat ||
      "-",
  };

  const avatarUrl = resolveMemberAvatar(
    fullProfile?.member || fullProfile || user
  );

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
                  Panel Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right Section: User Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(true)}
                  className="flex items-center gap-2.5 p-1 pr-2 sm:pr-3 rounded-full hover:bg-sky-50 transition-all border border-slate-200/70 hover:border-sky-200 group cursor-pointer"
                  title="Klik untuk melihat detail profil lengkap"
                >
                  <img
                    src={avatarUrl}
                    alt={profileDisplay.nama}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#087EA4]/40 group-hover:ring-[#087EA4] transition-all"
                  />
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-bold leading-tight text-slate-900 group-hover:text-[#087EA4] transition-colors max-w-[120px] truncate">
                      {profileDisplay.nama}
                    </p>
                    <span className="text-[10px] font-medium text-slate-400 uppercase">
                      {profileDisplay.roleLabel}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#087EA4] transition-transform group-hover:translate-y-0.5" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl transition-colors text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
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

            {user && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-sky-50/80 border border-sky-100 text-left text-xs hover:bg-sky-100/60 transition-colors"
                >
                  <img
                    src={avatarUrl}
                    alt={profileDisplay.nama}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#087EA4]/40 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {profileDisplay.nama}
                    </p>
                    <p className="text-[10px] text-[#087EA4] font-semibold">
                      Lihat Info Profil Lengkap →
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  Keluar dari Akun
                </button>
              </div>
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

      {/* Interactive Profile Information Modal */}
      {profileModalOpen && user && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden transition-all text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 pb-4 bg-gradient-to-r from-sky-50 via-white to-sky-50/50 border-b border-sky-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#087EA4]">
                  Informasi Akun
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Profil Pengguna
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Avatar & Identitas Utama */}
              <div className="text-center space-y-2">
                <div className="relative inline-block">
                  <img
                    src={avatarUrl}
                    alt={profileDisplay.nama}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-[#087EA4]/30 shadow-md mx-auto"
                  />
                  <div
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                    title="Akun Terverifikasi"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 leading-tight">
                    {profileDisplay.nama}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    @{profileDisplay.username}
                  </p>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-[#087EA4] border border-sky-200/80">
                    {profileDisplay.roleLabel}
                  </span>
                </div>
              </div>

              {/* Data Detail Pendaftaran */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Data Registrasi Pengguna
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
                      <Phone className="w-3 h-3 text-[#087EA4]" />
                      <span>No. WhatsApp / Telp</span>
                    </div>
                    <p className="font-bold text-slate-800 break-all">
                      {profileDisplay.telp}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
                      <Briefcase className="w-3 h-3 text-[#087EA4]" />
                      <span>Instansi / Kantor</span>
                    </div>
                    <p
                      className="font-bold text-slate-800 truncate"
                      title={profileDisplay.instansi}
                    >
                      {profileDisplay.instansi}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
                      <MapPin className="w-3 h-3 text-[#087EA4]" />
                      <span>Alamat Domisili</span>
                    </div>
                    <p className="font-medium text-slate-700 text-[11px] leading-relaxed">
                      {profileDisplay.alamat}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  href={isAdmin ? "/admin/reservations" : "/member/profile"}
                  onClick={() => setProfileModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#087EA4] border border-sky-200/80 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>
                    {isAdmin ? "Buka Panel Pengelola" : "Halaman Profil Lengkap"}
                  </span>
                </Link>

                {isMember && (
                  <Link
                    href="/member/history"
                    onClick={() => setProfileModalOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Ticket className="w-3.5 h-3.5 text-slate-500" />
                    <span>Riwayat Pemesanan & E-Ticket</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setProfileModalOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-rose-100 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


