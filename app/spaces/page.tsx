"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/layout/Navbar";
import { apiFetcher, formatRupiah, resolveSpaceImage } from "../../lib/api/client";
import {
  Users,
  Building2,
  Monitor,
  Wifi,
  Coffee,
  Search,
  Star,
  ArrowRight,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Zap,
  Clock,
} from "lucide-react";

function SpacesContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("tipe") || "";
  const initialSearch = searchParams.get("search") || "";

  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [selectedType, setSelectedType] = useState(initialType);
  const [sortBy, setSortBy] = useState<"recommended" | "newest" | "cheapest" | "priciest" | "capacity">("recommended");
  const [visibleCount, setVisibleCount] = useState<number>(12);

  useEffect(() => {
    loadSpaces();
  }, [selectedType]);

  async function loadSpaces() {
    setLoading(true);
    try {
      let url = "/api/spaces";
      if (selectedType) {
        url += `?tipe=${encodeURIComponent(selectedType)}`;
      }
      const res: any = await apiFetcher(url);

      let dataList: any[] = [];
      if (Array.isArray(res?.data?.items)) dataList = res.data.items;
      else if (Array.isArray(res?.data)) dataList = res.data;
      else if (Array.isArray(res)) dataList = res;

      setSpaces(dataList);
    } catch (err) {
      console.error("Gagal memuat katalog space:", err);
    } finally {
      setLoading(false);
    }
  }

  // Client filtering & sorting
  const filteredSpaces = useMemo(() => {
    return spaces
      .filter((s: any) => {
        const name = (s.nama_space || s.nama || "").toLowerCase();
        const desc = (s.deskripsi || "").toLowerCase();
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return name.includes(q) || desc.includes(q);
      })
      .sort((a: any, b: any) => {
        const priceA = Number(a.harga_per_jam || a.harga || 0);
        const priceB = Number(b.harga_per_jam || b.harga || 0);
        const capA = Number(a.kapasitas || 1);
        const capB = Number(b.kapasitas || 1);
        const idA = Number(a.id || 0);
        const idB = Number(b.id || 0);

        if (sortBy === "recommended") {
          // Prioritize legitimate spaces with valid name and realistic price > 0
          const isValidA = a.nama_space && a.nama_space.length > 2 && a.nama_space !== "1" && priceA > 0;
          const isValidB = b.nama_space && b.nama_space.length > 2 && b.nama_space !== "1" && priceB > 0;
          if (isValidA && !isValidB) return -1;
          if (!isValidA && isValidB) return 1;
          return idB - idA; // Newest first among valid spaces
        }

        if (sortBy === "newest") return idB - idA;
        if (sortBy === "cheapest") return priceA - priceB;
        if (sortBy === "priciest") return priceB - priceA;
        if (sortBy === "capacity") return capB - capA;
        return 0;
      });
  }, [spaces, search, sortBy]);

  const displayedSpaces = filteredSpaces.slice(0, visibleCount);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 flex-1 w-full">
      {/* Top Hero & Filter Header */}
      <div className="bg-gradient-to-br from-white via-sky-50/40 to-white p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100/90 pb-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-[#087EA4] text-[11px] font-bold uppercase tracking-wider">
              <span> KATALOG RUANG KERJA RESMI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Eksplorasi Ruang Kerja & Meja
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Pilih workstation personal yang tenang, ruang rapat berfasilitas lengkap, hingga kantor tim privat dengan verifikasi QR code instan.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-3 rounded-2xl border border-sky-100 shadow-xs text-center min-w-[100px]">
              <div className="text-lg sm:text-xl font-black text-[#087EA4]">{spaces.length}+</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilihan Ruang</div>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl border border-sky-100 shadow-xs text-center min-w-[100px]">
              <div className="text-lg sm:text-xl font-black text-amber-500">4.9/5</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kepuasan Member</div>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Semua Ruangan", value: "", icon: Layers },
              { label: "Personal Desk", value: "desk", icon: Monitor },
              { label: "Meeting Room", value: "meeting_room", icon: Users },
              { label: "Private Office", value: "private_office", icon: Building2 },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = selectedType === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setSelectedType(tab.value);
                    setVisibleCount(12);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? "bg-[#087EA4] text-white shadow-md shadow-sky-500/25 scale-[1.02]"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-sky-300 hover:text-[#087EA4] hover:bg-sky-50/50"
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[#087EA4]"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Menampilkan <strong className="text-slate-900">{filteredSpaces.length}</strong> ruangan tersedia
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-8 relative">
            <input
              type="text"
              placeholder="Cari nama ruangan, fasilitas, atau spesifikasi..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(12);
              }}
              className="w-full bg-white border border-slate-200/90 pl-11 pr-4 py-3 rounded-2xl text-xs sm:text-sm font-medium outline-none focus:border-[#087EA4] focus:ring-2 focus:ring-sky-100 transition-all shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          </div>

          <div className="sm:col-span-4 relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-white border border-slate-200/90 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 outline-none focus:border-[#087EA4] focus:ring-2 focus:ring-sky-100 cursor-pointer shadow-xs"
            >
              <option value="recommended"> Rekomendasi Populer</option>
              <option value="newest"> Ruangan Terbaru</option>
              <option value="cheapest"> Tarif Termurah</option>
              <option value="priciest"> Tarif Tertinggi</option>
              <option value="capacity"> Kapasitas Terbesar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Space Cards Grid Display */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
              <div className="h-52 bg-slate-200 rounded-2xl"></div>
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-6 bg-slate-200 rounded w-2/3"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-200/90 space-y-4 max-w-md mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-sky-50 text-[#087EA4] flex items-center justify-center mx-auto text-2xl">
            
          </div>
          <h3 className="font-black text-slate-900 text-base">Belum Ada Ruangan Terdaftar</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Katalog ruangan RuanginAja saat ini masih kosong. Admin dapat menambahkan ruangan kerja baru melalui menu <b>Kelola Ruangan</b> di Panel Admin.
          </p>
          <Link
            href="/auth/admin/login"
            className="inline-block bg-[#087EA4] hover:bg-[#075985] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Login Admin Space
          </Link>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-200/90 space-y-4 max-w-md mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-sky-50 text-[#087EA4] flex items-center justify-center mx-auto text-2xl">
            
          </div>
          <h3 className="font-black text-slate-900 text-base">Tidak Ada Ruangan Ditemukan</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tidak menemukan hasil yang cocok dengan kata kunci &ldquo;{search}&rdquo;. Coba sesuaikan kata kunci atau ubah filter tipe ruangan.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedType("");
            }}
            className="bg-[#087EA4] hover:bg-[#075985] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Tampilkan Semua Ruang
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedSpaces.map((s: any) => {
              const isMeeting = s.tipe === "meeting_room";
              const isOffice = s.tipe === "private_office";

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-sky-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Thumbnail with Overlay Badges */}
                    <div className="h-48 sm:h-52 bg-slate-100 relative overflow-hidden">
                      <img
                        src={resolveSpaceImage(s)}
                        alt={s.nama_space || "Space"}
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

                      {/* Top Left: Category Badge with Icon */}
                      <span
                        className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm backdrop-blur-md flex items-center gap-1.5 ${
                          isMeeting
                            ? "bg-indigo-600/90 text-white"
                            : isOffice
                            ? "bg-emerald-600/90 text-white"
                            : "bg-[#087EA4]/90 text-white"
                        }`}
                      >
                        {isMeeting ? (
                          <>
                            <Users className="w-3 h-3 text-indigo-200" />
                            <span>Meeting Room</span>
                          </>
                        ) : isOffice ? (
                          <>
                            <Building2 className="w-3 h-3 text-emerald-200" />
                            <span>Private Office</span>
                          </>
                        ) : (
                          <>
                            <Monitor className="w-3 h-3 text-sky-200" />
                            <span>Personal Desk</span>
                          </>
                        )}
                      </span>

                      {/* Top Right: Rating & Capacity */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span className="bg-white/95 backdrop-blur-md text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>4.9</span>
                        </span>
                        <span className="bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" />
                          <span>{s.kapasitas || 1} Org</span>
                        </span>
                      </div>

                      {/* Bottom Floating Bar Over Image */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <span className="bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold shadow-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Siap Digunakan</span>
                        </span>
                        <span className="bg-white/95 backdrop-blur-md text-slate-700 px-2.5 py-0.5 rounded-full text-[9px] font-bold shadow-xs flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-[#087EA4]" />
                          <span>Lt. {(s.id % 6) + 1} Tower Utama</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Space Name */}
                      <h3 className="font-black text-base sm:text-lg text-slate-900 group-hover:text-[#087EA4] transition-colors leading-snug line-clamp-1">
                        {s.nama_space || s.nama || `Ruang Kerja #${s.id}`}
                      </h3>

                      {/* Space Description */}
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[32px]">
                        {s.deskripsi || "Fasilitas lengkap dengan Wi-Fi super cepat, stopkontak personal, dan suasana nyaman untuk produktivitas optimal."}
                      </p>

                      {/* Facility Chips in Clean Ocean Blue */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#087EA4] bg-sky-50 border border-sky-100/90 px-2.5 py-0.5 rounded-lg">
                          <Wifi className="w-3 h-3 text-[#087EA4]" />
                          <span>Wi-Fi</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#087EA4] bg-sky-50 border border-sky-100/90 px-2.5 py-0.5 rounded-lg">
                          <Coffee className="w-3 h-3 text-[#087EA4]" />
                          <span>Free Coffee</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#087EA4] bg-sky-50 border border-sky-100/90 px-2.5 py-0.5 rounded-lg">
                          <ShieldCheck className="w-3 h-3 text-[#087EA4]" />
                          <span>QR Access</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer with Price and Detail & Pesan Button */}
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-1">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        TARIF SEWA
                      </span>
                      <span className="font-black text-base sm:text-lg text-[#087EA4]">
                        {formatRupiah(s.harga_per_jam || s.harga)}
                        <span className="text-xs font-normal text-slate-400"> /jam</span>
                      </span>
                    </div>

                    <Link
                      href={`/spaces/${s.id}`}
                      className="group/btn bg-gradient-to-r from-[#087EA4] to-[#0284C7] hover:from-[#075985] hover:to-[#0369A1] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 hover:scale-[1.02] active:scale-95 flex items-center gap-1.5"
                    >
                      <span>Detail & Pesan</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {visibleCount < filteredSpaces.length && (
            <div className="text-center pt-4 pb-6">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="bg-white hover:bg-sky-50 text-[#087EA4] border border-sky-200 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-xs hover:border-[#087EA4] transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Muat Lebih Banyak Ruangan ({filteredSpaces.length - visibleCount} tersisa)</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function SpacesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Navbar />
      <Suspense
        fallback={
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-400 font-bold">Memuat katalog ruangan...</p>
          </div>
        }
      >
        <SpacesContent />
      </Suspense>
    </div>
  );
}
