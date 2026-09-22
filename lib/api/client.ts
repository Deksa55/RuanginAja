/**
 * API Client untuk RuanginAja - Coworking Space Reservation System
 * Sesuai Kontrak API UKK RPL 2026/2027 SMK Telkom Malang
 * Base URL: https://learn.smktelkom-mlg.sch.id/coworking
 */

const RAW_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://learn.smktelkom-mlg.sch.id/coworking";

export const API_BASE_URL = RAW_URL.replace(/\/+$/, "").replace(/\/api$/, "");

export function getAppKey(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("app_key") || localStorage.getItem("x_maker_key");
    if (saved && saved.trim()) return saved.trim();
  }
  return (
    process.env.NEXT_PUBLIC_MAKER_KEY ||
    process.env.NEXT_PUBLIC_APP_KEY ||
    "mk_default_ukk_2026"
  );
}

export function setAppKey(key: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("app_key", key.trim());
    localStorage.setItem("x_maker_key", key.trim());
  }
}

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || localStorage.getItem("access_token");
}

export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  }
}

/**
 * Universal API Fetcher with automatic multi-tenancy header, Bearer JWT, and error handling
 */
export async function apiFetcher<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const cleanEndpoint = endpoint.replace(/^\/+/, "").replace(/^api\//, "");
  const fullUrl = `${API_BASE_URL}/api/${cleanEndpoint}`;

  const headers = new Headers(options.headers);

  // Set Multi-Tenancy header (required by panitia backend)
  const currentKey = getAppKey();
  headers.set("x-maker-key", currentKey);
  headers.set("x-app-key", currentKey);

  // Set Authorization header if logged in
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Set JSON Content-Type only if not FormData
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const result = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      result?.message ||
      result?.error ||
      `Terjadi kesalahan pada server (Status: ${res.status})`;

    // Handle token expiration
    if ((res.status === 401 || res.status === 403) && typeof window !== "undefined") {
      if (!cleanEndpoint.startsWith("auth/login") && !cleanEndpoint.startsWith("maker/")) {
        // Only clear and redirect if we had a token that is now rejected
        if (token) {
          clearAuthSession();
        }
      }
    }

    throw new Error(message);
  }

  return result as T;
}

/**
 * Helper to upload image files to backend
 */
export async function uploadMedia(file: File, type: "spaces" | "members" | "image" = "image"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const endpoint = type === "spaces" ? "/api/upload/spaces" : type === "members" ? "/api/upload/members" : "/api/upload/image";
  const res: any = await apiFetcher(endpoint, {
    method: "POST",
    body: formData,
  });

  return res?.data?.filename || res?.data?.url || "";
}

/**
 * Curated fallback image resolver
 */
export function resolveSpaceImage(space?: any): string {
  // If space has filename in `foto`, construct correct path under /coworking/uploads/spaces/
  if (space?.foto && typeof space.foto === "string" && space.foto.trim()) {
    if (space.foto.startsWith("http")) {
      let url = space.foto.replace(/^http:\/\//i, "https://");
      if (url.includes("smktelkom-mlg.sch.id/uploads/spaces") && !url.includes("/coworking/")) {
        url = url.replace("smktelkom-mlg.sch.id/uploads/spaces", "smktelkom-mlg.sch.id/coworking/uploads/spaces");
      }
      return url;
    }
    return `${API_BASE_URL}/uploads/spaces/${space.foto}`;
  }

  // If space has `foto_url`, normalize it to https and inject /coworking/ if missing
  if (space?.foto_url && typeof space.foto_url === "string" && space.foto_url.trim()) {
    let url = space.foto_url.replace(/^http:\/\//i, "https://");
    if (url.includes("smktelkom-mlg.sch.id/uploads/spaces") && !url.includes("/coworking/")) {
      url = url.replace("smktelkom-mlg.sch.id/uploads/spaces", "smktelkom-mlg.sch.id/coworking/uploads/spaces");
    }
    return url;
  }

  const tipe = (space?.tipe || "").toLowerCase();
  if (tipe === "meeting_room") {
    return "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80";
  }
  if (tipe === "private_office") {
    return "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80";
  }
  return "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80";
}

export function resolveMemberAvatar(member?: any): string {
  if (member?.foto && typeof member.foto === "string" && member.foto.trim()) {
    if (member.foto.startsWith("http")) {
      let url = member.foto.replace(/^http:\/\//i, "https://");
      if (url.includes("smktelkom-mlg.sch.id/uploads/members") && !url.includes("/coworking/")) {
        url = url.replace("smktelkom-mlg.sch.id/uploads/members", "smktelkom-mlg.sch.id/coworking/uploads/members");
      }
      return url;
    }
    return `${API_BASE_URL}/uploads/members/${member.foto}`;
  }
  const name = member?.nama_member || member?.nama || "Member";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=087EA4&color=fff&bold=true&size=128`;
}

/**
 * Format currency to IDR
 */
export function formatRupiah(amount?: number | string | null): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!num || isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Ekstraksi total bayar / tagihan dari respons API reservasi UKK
 */
export function resolveReservationTotal(item?: any): number {
  if (!item) return 0;
  if (typeof item.total_bayar === "number" && item.total_bayar > 0) return item.total_bayar;
  if (typeof item.total_harga === "number" && item.total_harga > 0) return item.total_harga;
  if (typeof item.total === "number" && item.total > 0) return item.total;
  if (item.price_breakdown?.total_harga) return Number(item.price_breakdown.total_harga);

  // Periksa array detail_reservasi (standar controller UKK RPL)
  if (Array.isArray(item.detail_reservasi) && item.detail_reservasi.length > 0) {
    const sum = item.detail_reservasi.reduce((acc: number, d: any) => {
      const val = Number(d.total_harga || d.subtotal || d.harga || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    if (sum > 0) return sum;

    // Fallback: harga_per_jam space * durasi_jam
    const firstDetail = item.detail_reservasi[0];
    const hourly = Number(firstDetail?.space?.harga_per_jam || firstDetail?.space?.harga || 0);
    const dur = Number(item.durasi_jam || item.durasi || 1);
    if (hourly > 0) return hourly * dur;
  }

  // Fallback: harga space di root * durasi_jam
  const spaceHourly = Number(item.space?.harga_per_jam || item.space?.harga || 0);
  const dur = Number(item.durasi_jam || item.durasi || 1);
  if (spaceHourly > 0) return spaceHourly * dur;

  return 0;
}

/**
 * Ekstraksi nama coworking space dari berbagai variasi payload reservasi
 */
export function resolveReservationSpaceName(item?: any): string {
  if (!item) return "Coworking Space";
  if (item.detail_reservasi?.[0]?.space?.nama_space) {
    return item.detail_reservasi[0].space.nama_space;
  }
  if (item.space?.nama_space) return item.space.nama_space;
  if (item.space_name) return item.space_name;
  if (item.nama_space) return item.nama_space;
  if (item.owner?.nama_coworking) return item.owner.nama_coworking;
  return "Coworking Space";
}

/**
 * Format tanggal ISO (2026-09-21T00:00:00.000Z) ke format ramah (21/09/2026)
 */
export function formatTanggal(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const parts = clean.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return clean;
  } catch {
    return dateStr;
  }
}

