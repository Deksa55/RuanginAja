"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/layout/Navbar";
import { apiFetcher, formatRupiah, resolveSpaceImage } from "../lib/api/client";
import {
  Copy,
  Check,
  Search,
  ArrowUp,
  Users,
  Building2,
  Monitor,
  Wifi,
  Coffee,
  ShieldCheck,
  Star,
  ArrowRight,
  Calendar,
  Layers,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [searchParams, setSearchParams] = useState({
    tipe: "",
    tanggal: "",
    q: "",
  });

  // Fetch initial spaces and active promos
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [spacesRes, promosRes] = await Promise.allSettled([
          apiFetcher("/api/spaces"),
          apiFetcher("/api/diskon/active"),
        ]);

        if (spacesRes.status === "fulfilled" && spacesRes.value?.status) {
          const list = Array.isArray(spacesRes.value.data) ? spacesRes.value.data : [];
          setSpaces(list);
        }

        if (promosRes.status === "fulfilled" && promosRes.value?.status) {
          const promoList = Array.isArray(promosRes.value.data) ? promosRes.value.data : [];
          setPromos(promoList);
        }
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Two-way smooth scroll observer (animates smoothly on scroll down & scroll up)
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
        } else {
          const rect = entry.target.getBoundingClientRect();
          if (rect.top > window.innerHeight * 0.95 || rect.bottom < 0) {
            entry.target.classList.remove("is-revealed");
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: [0.08, 0.2],
      rootMargin: "0px 0px -30px 0px",
    });

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [spaces, promos, selectedCategory]);

  // Featured Promo Voucher
  const featuredPromo = (() => {
    if (!promos || promos.length === 0) {
      return {
        id: 1,
        nama_diskon: "DISKONHEMAT20",
        persentase_diskon: 20,
      };
    }
    const foundOfficial = promos.find(
      (p) => p.nama_diskon === "UKKPROMO50" || p.nama_diskon === "DISKONHEMAT20"
    );
    if (foundOfficial) return foundOfficial;

    return [...promos].sort((a, b) => (b.persentase_diskon || 0) - (a.persentase_diskon || 0))[0];
  })();

  const handleCopyCode = () => {
    if (featuredPromo?.nama_diskon) {
      navigator.clipboard.writeText(featuredPromo.nama_diskon);
      setCopiedPromo(true);
      setTimeout(() => setCopiedPromo(false), 2500);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchParams.tipe) query.set("tipe", searchParams.tipe);
    if (searchParams.tanggal) query.set("tanggal", searchParams.tanggal);
    if (searchParams.q) query.set("search", searchParams.q);
    router.push(`/spaces?${query.toString()}`);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (category === "all") {
      setSearchParams((prev) => ({ ...prev, tipe: "" }));
    } else {
      setSearchParams((prev) => ({ ...prev, tipe: category }));
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Filtered spaces by category
  const filteredSpaces = useMemo(() => {
    if (selectedCategory === "all") return spaces;
    return spaces.filter((s) => s.tipe === selectedCategory);
  }, [spaces, selectedCategory]);

  const spotlightSpace = filteredSpaces[0];
  const secondarySpaces = filteredSpaces.slice(1, 7);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-[#087EA4] selection:text-white">
      {/* Clean Navbar */}
      <Navbar />

      {/* Hero Section with Professional Workspace Background & Docked Search Layout */}
      <section className="relative min-h-[580px] lg:min-h-[620px] flex flex-col justify-between overflow-hidden bg-slate-50">
        {/* Full-width Professional Coworking Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
          style={{
            backgroundImage: "url('/hero-coworking-pro.jpg')",
          }}
        ></div>

        {/* Sophisticated Gradient Overlay (Left text clarity) */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/20 sm:from-white/95 sm:via-white/75 sm:to-transparent pointer-events-none"></div>

        {/* Bottom Smooth Gradient Fade: Seamlessly dissolves the photo into the background color (slate-50) */}
        <div className="absolute inset-x-0 bottom-0 h-48 sm:h-64 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pointer-events-none z-10"></div>

        {/* Main Content Area: Responsive 2-Column Grid */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headline, Description, Buttons, Social Proof */}
            <div className="lg:col-span-7 space-y-4 text-left">
              {/* Main Headline (Line 1: Bold Sans-serif, Line 2: Elegant Blue Script/Italic, Line 3: Animated 'Bersama Kami') */}
              <div className="space-y-1 sm:space-y-1.5 pt-1">
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-slate-900 tracking-tight leading-[1.1]">
                  Temukan Ruang Kerja
                </h1>
                <div className="text-3xl sm:text-4xl lg:text-[44px] font-serif italic font-semibold text-[#087EA4] tracking-normal leading-[1.2]">
                  Impian & Produktif
                </div>
                <div className="text-3xl sm:text-4xl lg:text-[44px] font-serif italic font-semibold text-[#087EA4] tracking-normal leading-[1.2] pt-0.5">
                  <span className="relative inline-block animate-float-bersama">
                    <span className="inline-flex select-none">
                      {"Bersama Kami".split("").map((char, index) => (
                        <span
                          key={index}
                          className="inline-block animate-letter-wave transition-all duration-200 hover:-translate-y-2 hover:text-[#0284C7] cursor-default"
                          style={{
                            animationDelay: `${index * 0.08}s`,
                          }}
                        >
                          {char === " " ? "\u00A0" : char}
                        </span>
                      ))}
                    </span>

                    {/* Animated Hand-drawn Curved Underline */}
                    <svg
                      className="absolute -bottom-2.5 left-0 w-full h-3.5 text-[#087EA4] overflow-visible pointer-events-none"
                      viewBox="0 0 120 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M 3,8 Q 30,2 65,6 T 117,4"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        className="animate-underline-wave"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed max-w-lg font-medium">
                Platform reservasi Coworking Space & Workstation fleksibel. Meja individual, ruang rapat kedap suara, hingga kantor tim privat dengan verifikasi QR code instan.
              </p>

              {/* CTA Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/spaces"
                  className="bg-[#087EA4] hover:bg-[#075985] text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-sky-500/25 hover:scale-[1.02] active:scale-95 transition-all text-xs sm:text-sm inline-flex items-center gap-2"
                >
                  <span>Jelajahi Sekarang</span>
                  <span className="text-base leading-none">→</span>
                </Link>
                <Link
                  href="/auth/register?role=member"
                  className="bg-white/95 hover:bg-white text-slate-800 px-5 py-3 rounded-full font-bold border border-slate-200 shadow-sm hover:border-slate-300 active:scale-95 transition-all text-xs sm:text-sm backdrop-blur-xs"
                >
                  Daftar Member
                </Link>
                <Link
                  href="/auth/register?role=admin"
                  className="text-xs font-bold text-slate-600 hover:text-[#087EA4] px-2 py-1.5 transition-colors inline-flex items-center gap-1 bg-white/70 backdrop-blur-xs rounded-lg"
                >
                  <span> Daftarkan Coworking (Admin)</span>
                </Link>
              </div>


            </div>

            {/* Right Column: Creative Interactive Digital Pass & Coworking Preview Card */}
            <div className="hidden lg:flex lg:col-span-5 justify-center lg:justify-end relative pr-4 xl:pr-8 py-2">
              {/* Soft Ambient Radial Glow */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-sky-400/25 via-[#087EA4]/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>

              {/* Floating Micro-Badge Top Left (Fast Pass QR) */}
              <div className="absolute -top-3 -left-6 z-30 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl shadow-slate-900/10 border border-sky-100 flex items-center gap-2.5 animate-float-phone-1 hover:scale-105 transition-all">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-900 leading-tight">Instant Check-in</div>
                  <div className="text-[9px] text-slate-500 font-semibold">Scan QR & Masuk Langsung</div>
                </div>
              </div>

              {/* Floating Micro-Badge Bottom Right (Member Rating & Avatars) */}
              <div className="absolute -bottom-4 -right-3 z-30 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl shadow-slate-900/10 border border-sky-100 flex items-center gap-3 animate-float-phone-2 hover:scale-105 transition-all">
                <div className="flex -space-x-1.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold">
                    AN
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold">
                    DK
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold">
                    RF
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-900 leading-tight">1.200+ Member</div>
                  <div className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5">
                    ★★★★★ <span className="text-slate-500 font-semibold">(4.9)</span>
                  </div>
                </div>
              </div>

              {/* Main Smartphone Digital Pass Card (Ocean Blue & White Clean Palette) */}
              <div className="relative z-10 w-[265px] xl:w-[285px] rounded-[38px] bg-white/95 backdrop-blur-2xl p-3.5 shadow-2xl shadow-sky-900/15 border-2 border-sky-200/80 text-slate-800 transition-all duration-500 hover:scale-[1.02] hover:-rotate-0 -rotate-2">
                {/* Phone Status / Speaker Bar */}
                <div className="flex items-center justify-between px-2 pb-2.5 text-[9px] text-slate-500 font-bold">
                  <span>09:41</span>
                  <div className="w-10 h-3 bg-slate-200 rounded-full mx-auto"></div>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <span className="w-3 h-1.5 border border-slate-400 rounded-xs inline-block relative after:absolute after:right-0 after:top-0 after:bottom-0 after:w-1.5 after:bg-slate-600"></span>
                  </div>
                </div>

                {/* RuanginAja Pass Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-sky-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#087EA4] flex items-center justify-center text-white text-[11px] font-black shadow-xs">
                      R
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900 leading-tight">RuanginAja Pass</div>
                      <div className="text-[9px] text-[#087EA4] font-semibold">Fast QR Check-in</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Ready
                  </span>
                </div>

                {/* Space Mini Preview Card */}
                <div className="mt-2.5 p-2 rounded-xl bg-slate-50/90 border border-sky-100/80 space-y-1.5">
                  <div className="relative h-24 rounded-lg overflow-hidden group">
                    <img
                      src="/hero-coworking-pro.jpg"
                      alt="Coworking space preview"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-bold">
                      Personal Hotdesk #14
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#087EA4] text-white text-[9px] font-bold shadow-xs">
                      Rp 50.000 / hari
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] px-0.5">
                    <span className="text-slate-600 font-semibold">Lantai 14 • Ocean View</span>
                    <span className="text-amber-500 font-bold flex items-center gap-0.5">
                      ★ 4.9
                    </span>
                  </div>
                </div>

                {/* QR Code Pass Box with Animated Scan Laser */}
                <div className="mt-2.5 p-2.5 rounded-xl bg-sky-50/70 border border-sky-100/90 text-center relative overflow-hidden">
                  {/* Laser Scan Line */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#087EA4] to-transparent animate-scan-line shadow-[0_0_8px_#087ea4] pointer-events-none"></div>

                  <div className="w-20 h-20 mx-auto bg-white p-1.5 rounded-lg shadow-sm border border-sky-200/70 flex items-center justify-center">
                    {/* SVG QR Code */}
                    <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                      <rect x="0" y="0" width="30" height="30" rx="4" />
                      <rect x="5" y="5" width="20" height="20" fill="white" />
                      <rect x="10" y="10" width="10" height="10" />
                      <rect x="70" y="0" width="30" height="30" rx="4" />
                      <rect x="75" y="5" width="20" height="20" fill="white" />
                      <rect x="80" y="10" width="10" height="10" />
                      <rect x="0" y="70" width="30" height="30" rx="4" />
                      <rect x="5" y="75" width="20" height="20" fill="white" />
                      <rect x="10" y="80" width="10" height="10" />
                      <rect x="36" y="10" width="8" height="8" />
                      <rect x="48" y="10" width="8" height="8" />
                      <rect x="36" y="24" width="12" height="8" />
                      <rect x="52" y="24" width="8" height="14" />
                      <rect x="10" y="38" width="8" height="10" />
                      <rect x="24" y="42" width="14" height="8" />
                      <rect x="42" y="42" width="16" height="16" rx="2" fill="#087EA4" />
                      <rect x="70" y="42" width="10" height="8" />
                      <rect x="84" y="38" width="8" height="12" />
                      <rect x="36" y="68" width="8" height="12" />
                      <rect x="48" y="74" width="12" height="8" />
                      <rect x="68" y="68" width="14" height="8" />
                      <rect x="74" y="80" width="18" height="12" />
                    </svg>
                  </div>
                  <p className="text-[9px] text-slate-600 font-semibold mt-1.5">
                    Arahkan ke scanner pintu masuk
                  </p>
                </div>

                {/* Quick Perks Footer in Phone */}
                <div className="mt-2.5 flex items-center justify-between px-1 text-[9px] text-slate-600 font-medium">
                  <span> 300 Mbps</span>
                  <span className="text-sky-300">•</span>
                  <span> Cofee Break </span>
                  <span className="text-sky-300">•</span>
                  <span> Smart Lock</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Docked Search Panel Container (Floating cleanly at the bottom edge of the hero) */}
        <div className="relative z-20 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 mt-auto reveal-on-scroll">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/15 border border-slate-200/90 p-3.5 sm:p-5">
            {/* Top Row: Category Tabs (Pills matching reference layout: Flights, Hotels, Tours...) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => handleCategorySelect("all")}
                className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === "all"
                    ? "bg-sky-100 text-[#087EA4] shadow-xs"
                    : "text-slate-600 hover:text-[#087EA4] hover:bg-slate-50"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Semua Ruangan</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategorySelect("desk")}
                className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === "desk"
                    ? "bg-sky-100 text-[#087EA4] shadow-xs"
                    : "text-slate-600 hover:text-[#087EA4] hover:bg-slate-50"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Personal Desk</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategorySelect("meeting_room")}
                className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === "meeting_room"
                    ? "bg-sky-100 text-[#087EA4] shadow-xs"
                    : "text-slate-600 hover:text-[#087EA4] hover:bg-slate-50"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Meeting Room</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategorySelect("private_office")}
                className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === "private_office"
                    ? "bg-sky-100 text-[#087EA4] shadow-xs"
                    : "text-slate-600 hover:text-[#087EA4] hover:bg-slate-50"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Private Office</span>
              </button>

              <Link
                href="/#promo-spesial"
                className="px-4 py-2 rounded-full font-bold text-slate-600 hover:text-[#087EA4] hover:bg-slate-50 transition-all whitespace-nowrap flex items-center gap-1.5 ml-auto hidden sm:flex"
              >
                <span>Promo Spesial</span>
              </Link>
            </div>

            {/* Bottom Row: Segmented Input Controls with Clean Dividers */}
            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3.5 items-center"
            >
              {/* Segment 1: Tipe Ruangan */}
              <div className="lg:col-span-3 sm:border-r border-slate-100 pr-0 sm:pr-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Tipe Ruang
                </label>
                <select
                  value={searchParams.tipe}
                  onChange={(e) => {
                    setSearchParams({ ...searchParams, tipe: e.target.value });
                    setSelectedCategory(e.target.value || "all");
                  }}
                  className="w-full py-1 text-xs sm:text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer focus:text-[#087EA4]"
                >
                  <option value="">Semua Tipe Ruang</option>
                  <option value="desk"> Personal Desk</option>
                  <option value="meeting_room"> Meeting Room</option>
                  <option value="private_office"> Private Office</option>
                </select>
              </div>

              {/* Segment 2: Tanggal Reservasi */}
              <div className="lg:col-span-3 sm:border-r border-slate-100 pr-0 sm:pr-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Tanggal Reservasi
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={searchParams.tanggal}
                    onChange={(e) => setSearchParams({ ...searchParams, tanggal: e.target.value })}
                    className="w-full py-1 text-xs sm:text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Segment 3: Kata Kunci / Fasilitas */}
              <div className="lg:col-span-4 sm:border-r border-slate-100 pr-0 sm:pr-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Kata Kunci / Fasilitas
                </label>
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Contoh: Alpha, Wi-Fi, TV, AC..."
                    value={searchParams.q}
                    onChange={(e) => setSearchParams({ ...searchParams, q: e.target.value })}
                    className="w-full py-1 text-xs sm:text-sm font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Segment 4: Search Button */}
              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-[#087EA4] hover:bg-[#075985] text-white py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-sky-500/25 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-white" />
                  <span>Cari Ruang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Featured Promo Voucher Section */}
      {featuredPromo && (
        <section id="promo-spesial" className="max-w-6xl mx-auto px-4 sm:px-6 w-full pt-10 sm:pt-12 reveal-on-scroll">
          <div className="bg-gradient-to-br from-sky-50/90 via-white to-sky-100/50 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs relative overflow-hidden border border-sky-200/90">
            <div className="space-y-1 relative z-10 text-center md:text-left">
              <span className="px-2.5 py-0.5 bg-sky-100/80 text-[#087EA4] text-[10px] font-bold rounded-full uppercase tracking-wider border border-sky-200 inline-block shadow-xs">
                <span>Promo Spesial Pilihan</span>
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Hemat Biaya Sewa Hingga <span className="text-[#087EA4]">{featuredPromo.persentase_diskon}%!</span>
              </h2>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Gunakan kode voucher di samping saat checkout pemesanan untuk mendapatkan potongan harga langsung!
              </p>
            </div>

            {/* Voucher Card */}
            <div className="relative z-10 w-full md:w-auto shrink-0">
              <div className="bg-white/95 backdrop-blur-md border-2 border-dashed border-sky-300 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-center gap-3 shadow-xs hover:border-[#087EA4] transition-colors">
                <div className="text-center sm:text-left">
                  <span className="text-[9px] text-[#087EA4] uppercase font-bold tracking-wider block">
                    VOUCHER DISKON {featuredPromo.persentase_diskon}%
                  </span>
                  <span className="font-mono text-base sm:text-lg font-black text-slate-900 tracking-wider">
                    {featuredPromo.nama_diskon}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex-1 sm:flex-initial bg-sky-50 hover:bg-sky-100 text-[#087EA4] border border-sky-200/80 font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    {copiedPromo ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span className="text-emerald-600 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#087EA4]" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                  <Link
                    href="/spaces"
                    className="flex-1 sm:flex-initial bg-[#087EA4] hover:bg-[#075985] text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-sm shadow-sky-500/20 text-center"
                  >
                    Gunakan
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Space Types Category Highlights */}
      <section id="tipe-ruangan" className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 reveal-on-scroll">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold text-[#087EA4] uppercase tracking-widest">
            — TIPE RUANGAN FLEKSIBEL —
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Disesuaikan dengan Cara Kerja Anda
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Card 1: Personal Desk */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#087EA4] flex items-center justify-center text-lg font-bold">
                💻
              </div>
              <h3 className="text-base font-bold text-slate-900">Personal Desk</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Meja kerja individual yang tenang dan nyaman. Dilengkapi colokan listrik di setiap meja, Wi-Fi kencang, lampu meja ergonomis, dan air minum gratis.
              </p>
            </div>
            <Link
              href="/spaces?tipe=desk"
              className="text-xs font-bold text-[#087EA4] hover:underline flex items-center gap-1 pt-1"
            >
              Lihat Personal Desk →
            </Link>
          </div>

          {/* Card 2: Meeting Room */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#087EA4] flex items-center justify-center text-lg font-bold">
                👥
              </div>
              <h3 className="text-base font-bold text-slate-900">Meeting Room</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ruang rapat kedap suara untuk 4–12 orang. Dilengkapi Smart TV / proyektor presentasi, soundbar conference, papan tulis kaca, dan pendingin ruangan.
              </p>
            </div>
            <Link
              href="/spaces?tipe=meeting_room"
              className="text-xs font-bold text-[#087EA4] hover:underline flex items-center gap-1 pt-1"
            >
              Lihat Meeting Room →
            </Link>
          </div>

          {/* Card 3: Private Office */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#087EA4] flex items-center justify-center text-lg font-bold">
                
              </div>
              <h3 className="text-base font-bold text-slate-900">Private Office</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kantor privat eksklusif untuk tim startup atau korporat. Keamanan 24 jam dengan smart lock, fasilitas lengkap, dan privasi penuh untuk operasional tim.
              </p>
            </div>
            <Link
              href="/spaces?tipe=private_office"
              className="text-xs font-bold text-[#087EA4] hover:underline flex items-center gap-1 pt-1"
            >
              Lihat Private Office →
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Spaces Catalog (Engaging Layout with Real-Time Spaces) */}
      <section className="pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-5 reveal-on-scroll">
        
        {/* Section Header */}
        <div className="space-y-3 border-b border-slate-200/80 pb-3.5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2.5">
            <div>
              <span className="text-xs font-bold text-[#087EA4] uppercase tracking-widest">
                — KATALOG PILIHAN —
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Pilihan Ruang Kerja Populer
              </h2>
            </div>
            <Link
              href="/spaces"
              className="text-xs font-bold text-[#087EA4] hover:text-[#075985] flex items-center gap-1"
            >
              Lihat Semua Ruangan ({spaces.length}) →
            </Link>
          </div>
        </div>

        {/* Dynamic Spaces Catalog Display */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
                <div className="h-40 bg-slate-200 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : spaces.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl text-center border border-slate-200/80 space-y-3 max-w-md mx-auto shadow-xs">
            <div className="text-3xl"></div>
            <h3 className="text-sm font-bold text-slate-800">Katalog Ruangan Belum Ditambahkan</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Admin RuanginAja belum menambahkan ruangan kerja ke sistem. Ruangan yang dibuat di panel admin akan otomatis tampil di sini.
            </p>
            <Link
              href="/auth/admin/login"
              className="inline-block bg-[#087EA4] hover:bg-[#075985] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
            >
              Kelola di Panel Admin
            </Link>
          </div>
        ) : filteredSpaces.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 space-y-2.5">
            <p className="text-xs text-slate-400">Belum ada space untuk kategori ini.</p>
            <button
              onClick={() => handleCategorySelect("all")}
              className="inline-block bg-[#087EA4] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
            >
              Tampilkan Semua Ruang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSpaces.slice(0, 6).map((space) => {
              const isMeeting = space.tipe === "meeting_room";
              const isOffice = space.tipe === "private_office";

              return (
                <div
                  key={space.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-sky-300 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      <img
                        src={resolveSpaceImage(space)}
                        alt={space.nama_space}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const fallback = isMeeting
                            ? "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80"
                            : isOffice
                            ? "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80"
                            : "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80";
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                      />
                      <span
                        className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase shadow-xs backdrop-blur-md ${
                          isMeeting
                            ? "bg-indigo-600/90 text-white"
                            : isOffice
                            ? "bg-emerald-600/90 text-white"
                            : "bg-[#087EA4]/90 text-white"
                        }`}
                      >
                        {isMeeting ? "Meeting Room" : isOffice ? "Private Office" : "Personal Desk"}
                      </span>
                      <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs">
                        👥 {space.kapasitas || 1} Orang
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 space-y-2">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#087EA4] transition-colors line-clamp-1">
                        {space.nama_space}
                      </h3>
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                        {space.deskripsi || "Fasilitas lengkap Wi-Fi kencang, stopkontak, dan pendingin ruangan."}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Wifi className="w-2.5 h-2.5 text-[#087EA4]" /> Wi-Fi
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Coffee className="w-2.5 h-2.5 text-amber-600" /> Free Coffee
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> QR Access
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-1">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
                        Tarif Sewa
                      </span>
                      <span className="text-sm sm:text-base font-black text-[#087EA4]">
                        {formatRupiah(space.harga_per_jam || space.harga)}
                        <span className="text-xs font-normal text-slate-400"> /jam</span>
                      </span>
                    </div>
                    <Link
                      href={`/spaces/${space.id}`}
                      className="bg-[#087EA4] hover:bg-[#075985] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-[1.02] flex items-center gap-1"
                    >
                      <span>Pesan</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-5 right-5 z-50 p-2.5 rounded-full bg-[#087EA4] text-white font-bold shadow-lg shadow-sky-500/25 hover:bg-[#075985] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 text-xs cursor-pointer ${
          showBackToTop ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-6 pointer-events-none"
        }`}
        title="Scroll ke Atas"
      >
        <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="hidden sm:inline text-[11px]">Ke Atas</span>
      </button>

      {/* Footer */}
      <footer className="bg-white text-slate-600 text-xs py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-200/80 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-5">
          <div className="space-y-1 text-center sm:text-left">
            <Link href="/" className="inline-block">
              <img
                src="/logo.png"
                alt="RuanginAja"
                className="h-6 sm:h-7 w-auto object-contain hover:opacity-90 transition-opacity"
              />
            </Link>
            <p className="text-[11px] text-slate-500">
              Aplikasi Reservasi Coworking Space & Workstation (Smart Space Booking)
            </p>
            <p className="text-[10px] text-slate-400">SMK Telkom Malang 2026/2027</p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 text-xs font-semibold text-slate-600">
            <Link href="/spaces" className="hover:text-[#087EA4] transition-colors">Katalog</Link>
            <Link href="/auth/register?role=member" className="hover:text-[#087EA4] transition-colors">Daftar Member</Link>
            <Link href="/auth/register?role=admin" className="hover:text-[#087EA4] transition-colors">Daftar Admin Space</Link>
            <Link href="/auth/login" className="hover:text-[#087EA4] transition-colors">Masuk Member</Link>
            <Link href="/auth/admin/login" className="hover:text-[#087EA4] transition-colors">Masuk Admin Space</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
