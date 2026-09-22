"use client";

import { useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Camera,
  X,
  Upload,
} from "lucide-react";
import { apiFetcher, uploadMedia } from "../../lib/api/client";

interface RegisterViewProps {
  initialRole?: "member" | "admin";
}

function RegisterContent({ initialRole = "member" }: RegisterViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role resolution: prefer explicit user tab selection, fallback to search param or initial prop
  const roleParam = searchParams.get("role");
  const defaultRole: "member" | "admin" =
    roleParam === "admin" ? "admin" : roleParam === "member" ? "member" : initialRole;
  const [selectedRole, setSelectedRole] = useState<"member" | "admin" | null>(null);
  const role = selectedRole ?? defaultRole;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Avatar upload state for member
  const [memberAvatarFile, setMemberAvatarFile] = useState<File | null>(null);
  const [memberAvatarPreview, setMemberAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Member form state
  const [memberForm, setMemberForm] = useState({
    nama_member: "",
    username: "",
    password: "",
    instansi: "",
    alamat: "",
    telp: "",
  });

  // Admin form state
  const [adminForm, setAdminForm] = useState({
    nama_coworking: "",
    nama_pemilik: "",
    telp: "",
    username: "",
    password: "",
  });

  const handleRoleChange = (newRole: "member" | "admin") => {
    setSelectedRole(newRole);
    setError("");
    setSuccess("");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (JPG, PNG, atau WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5MB");
      return;
    }

    setMemberAvatarFile(file);
    setMemberAvatarPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleRemoveAvatar = () => {
    setMemberAvatarFile(null);
    setMemberAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let uploadedFilename = "";
      if (memberAvatarFile) {
        setUploadingAvatar(true);
        try {
          uploadedFilename = await uploadMedia(memberAvatarFile, "members");
        } catch (uploadErr: any) {
          console.warn("Upload foto profil gagal, melanjutkan pendaftaran:", uploadErr);
        } finally {
          setUploadingAvatar(false);
        }
      }

      const payload: any = {
        ...memberForm,
      };
      if (uploadedFilename) {
        payload.foto = uploadedFilename;
      }

      const res: any = await apiFetcher("/api/auth/register/member", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.status || res?.data || res?.message || res) {
        // Cache user info and avatar locally so top-right navbar profile & profile page has it immediately
        if (uploadedFilename) {
          localStorage.setItem(`avatar_${memberForm.username}`, uploadedFilename);
        }
        localStorage.setItem(
          `registered_profile_${memberForm.username}`,
          JSON.stringify({
            ...memberForm,
            foto: uploadedFilename,
            role: "member",
          })
        );

        setSuccess(
          "Akun Member berhasil didaftarkan! Mengarahkan ke halaman login..."
        );
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      }
    } catch (err: any) {
      setError(
        err.message || "Pendaftaran Member gagal. Silakan coba username lain!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res: any = await apiFetcher("/api/auth/register/admin-space", {
        method: "POST",
        body: JSON.stringify(adminForm),
      });

      if (res?.status || res?.data || res?.message || res) {
        setSuccess(
          "Admin Coworking Space berhasil didaftarkan! Mengarahkan ke halaman login..."
        );
        setTimeout(() => {
          router.push("/auth/admin/login");
        }, 1500);
      }
    } catch (err: any) {
      setError(
        err.message ||
          "Pendaftaran Admin Space gagal. Periksa kembali username dan data space!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans antialiased text-slate-900 bg-white">
      {/* Left Side: Clean Professional Showcase (Desktop Full-Screen) */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen bg-slate-50 border-r border-slate-200/80 p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
        {/* Brand */}
        <Link href="/" className="inline-flex items-center">
          <img
            src="/logo.png"
            alt="RuanginAja"
            className="h-11 w-auto object-contain hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Minimal Hero Copy */}
        <div className="space-y-4 max-w-md">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#087EA4] bg-sky-50 border border-sky-200/80 px-3.5 py-1.5 rounded-full inline-block">
            {role === "member" ? "Pendaftaran Member" : "Pendaftaran Admin Space"}
          </span>
          <h1 className="text-3xl xl:text-4xl font-black text-slate-900 leading-tight">
            {role === "member"
              ? "Ruang Kerja Nyaman untuk Produktivitas Anda."
              : "Kembangkan & Kelola Coworking Space Anda."}
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            {role === "member"
              ? "Reservasi meja kerja, private office, dan meeting room dengan proses verifikasi cepat."
              : "Buka reservasi dan kelola ketersediaan ruangan secara real-time."}
          </p>
        </div>

        {/* Minimal Footer */}
        <p className="text-xs text-slate-400">
          © 2026 RuanginAja. Hak cipta dilindungi.
        </p>

        {/* Subtle Ambient Glow */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-100/60 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Right Side: Clean Form Viewport (Full-Screen) */}
      <div className="w-full lg:w-1/2 min-h-screen bg-white flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-6">
          {/* Mobile Brand */}
          <div className="lg:hidden text-center pb-2">
            <Link href="/" className="inline-flex items-center justify-center">
              <img
                src="/logo.png"
                alt="RuanginAja"
                className="h-10 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Pendaftaran Akun Baru
            </h2>
            <p className="text-xs text-slate-500">
              Pilih tipe akun dan lengkapi data pendaftaran Anda
            </p>
          </div>

          {/* Segmented Role Switcher */}
          <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 gap-1.5 border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleRoleChange("member")}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs transition-all ${
                role === "member"
                  ? "bg-white text-[#087EA4] shadow-md shadow-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <User
                className={`w-4 h-4 ${
                  role === "member" ? "text-[#087EA4]" : "text-slate-400"
                }`}
              />
              <div className="text-left">
                <div className="leading-tight">Member / Pengunjung</div>
                <div className="text-[10px] font-normal text-slate-400 hidden sm:block">
                  Untuk Booking Ruangan
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("admin")}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs transition-all ${
                role === "admin"
                  ? "bg-white text-[#087EA4] shadow-md shadow-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Building2
                className={`w-4 h-4 ${
                  role === "admin" ? "text-[#087EA4]" : "text-slate-400"
                }`}
              />
              <div className="text-left">
                <div className="leading-tight">Admin Coworking</div>
                <div className="text-[10px] font-normal text-slate-400 hidden sm:block">
                  Untuk Pengelola Space
                </div>
              </div>
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3.5 bg-rose-50 text-rose-700 text-xs rounded-2xl font-medium border border-rose-200 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 text-emerald-700 text-xs rounded-2xl font-medium border border-emerald-200 flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Form: Member Registration */}
          {role === "member" ? (
            <form onSubmit={handleMemberSubmit} className="space-y-3.5">
              {/* Foto Profil Member (Input & Preview) */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-sky-200 ring-2 ring-[#087EA4]/20 shadow-xs flex items-center justify-center">
                    {memberAvatarPreview ? (
                      <img
                        src={memberAvatarPreview}
                        alt="Preview Foto Profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-7 h-7 text-[#087EA4]" />
                    )}
                  </div>
                  {memberAvatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-xs shadow-sm transition-all"
                      title="Hapus Foto"
                    >
                      <X className="w-3 h-3 stroke-[3]" />
                    </button>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Foto Profil
                    </span>
                    <span className="text-[10px] font-semibold text-[#087EA4] bg-sky-100/80 px-2 py-0.5 rounded-full">
                      Opsional
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {memberAvatarFile
                      ? memberAvatarFile.name
                      : "Unggah foto profil untuk akun Anda"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="member-avatar-input"
                    />
                    <label
                      htmlFor="member-avatar-input"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-sky-200 hover:border-[#087EA4] hover:bg-sky-50 text-[#087EA4] text-xs font-bold cursor-pointer transition-all shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{memberAvatarPreview ? "Ganti Foto" : "Pilih Foto"}</span>
                    </label>
                    {memberAvatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={memberForm.nama_member}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, nama_member: e.target.value })
                    }
                    placeholder="Mochamad Deksa"
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Instansi / Sekolah / Kantor
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={memberForm.instansi}
                      onChange={(e) =>
                        setMemberForm({ ...memberForm, instansi: e.target.value })
                      }
                      placeholder="SMK Telkom Malang / Freelancer"
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    No. WhatsApp / Telepon
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={memberForm.telp}
                      onChange={(e) =>
                        setMemberForm({ ...memberForm, telp: e.target.value })
                      }
                      placeholder="08123456789"
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={memberForm.username}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, username: e.target.value })
                    }
                    placeholder="deksa123"
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={memberForm.password}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, password: e.target.value })
                    }
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 pr-10 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Alamat Domisili
                </label>
                <textarea
                  required
                  rows={2}
                  value={memberForm.alamat}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, alamat: e.target.value })
                  }
                  placeholder="Jl. Danau Ranau, Sawojajar, Kota Malang"
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#087EA4] hover:bg-[#075985] text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  "Mendaftarkan Akun Member..."
                ) : (
                  <>
                    <span>Daftar Sebagai Member</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Form: Admin Space Registration */
            <form onSubmit={handleAdminSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nama Coworking Space / Brand Lokasi
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.nama_coworking}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, nama_coworking: e.target.value })
                  }
                  placeholder="Contoh: Moklet Hub Coworking"
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nama Pemilik / Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    required
                    value={adminForm.nama_pemilik}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, nama_pemilik: e.target.value })
                    }
                    placeholder="Ahmad Bidin"
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    No. WhatsApp / Telepon Usaha
                  </label>
                  <input
                    type="tel"
                    required
                    value={adminForm.telp}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, telp: e.target.value })
                    }
                    placeholder="081298765432"
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Username Admin Space
                  </label>
                  <input
                    type="text"
                    required
                    value={adminForm.username}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, username: e.target.value })
                    }
                    placeholder="admin_space1"
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Password Admin
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={adminForm.password}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, password: e.target.value })
                      }
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 pr-10 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#087EA4] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#087EA4] hover:bg-[#075985] text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  "Mendaftarkan Admin Space..."
                ) : (
                  <>
                    <span>Daftar Sebagai Admin Space</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom Switcher & Login Links */}
          <div className="text-center text-xs text-slate-500 space-y-1.5 pt-4 border-t border-slate-100">
            <p>
              Sudah memiliki akun?{" "}
              <Link
                href="/auth/login"
                className="text-[#087EA4] font-bold hover:underline"
              >
                Masuk ke Akun
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterView(props: RegisterViewProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <RegisterContent {...props} />
    </Suspense>
  );
}
