"use client";

import { useState, useEffect, useRef } from "react";
import {
  apiFetcher,
  resolveMemberAvatar,
  uploadMedia,
  getActiveMakerId,
} from "../../../lib/api/client";

interface MemberItem {
  id: number;
  username: string;
  nama_member: string;
  instansi?: string;
  alamat?: string;
  telp?: string;
  foto?: string | null;
  maker_id?: number | null;
}

const emptyForm = {
  username: "",
  password: "",
  nama_member: "",
  instansi: "",
  alamat: "",
  telp: "",
  foto: "",
};

export default function AdminMembersPage() {
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeMakerId, setActiveMakerId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, [search]);

  async function loadMembers() {
    setLoading(true);
    try {
      // 1. Dapatkan Maker ID resmi yang terikat ke APP_KEY di .env
      const targetMakerId = await getActiveMakerId();
      setActiveMakerId(targetMakerId);

      let url = "/api/admin/members";
      if (search.trim()) {
        url += `?search=${encodeURIComponent(search.trim())}`;
      }
      const res: any = await apiFetcher(url);
      let list: MemberItem[] = [];
      if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res?.data?.items)) list = res.data.items;
      else if (Array.isArray(res)) list = res;

      // 2. ISOLASI DATA: Hanya tampilkan member yang memiliki maker_id milik APP_KEY aktif
      const filtered = list.filter((m: any) => m.maker_id === targetMakerId);
      setMembers(filtered);
    } catch (err) {
      console.error("Gagal memuat member:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAdd = () => {
    setEditingMember(null);
    setForm(emptyForm);
    setAvatarPreview(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: MemberItem) => {
    setEditingMember(member);
    setForm({
      username: member.username || "",
      password: "",
      nama_member: member.nama_member || "",
      instansi: member.instansi || "",
      alamat: member.alamat || "",
      telp: member.telp || "",
      foto: member.foto || "",
    });
    setAvatarPreview(resolveMemberAvatar(member));
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    setUploadingImage(true);
    try {
      const uploadedFilename = await uploadMedia(file, "members");
      setForm((prev) => ({ ...prev, foto: uploadedFilename }));
    } catch (err: any) {
      alert("Gagal mengupload foto profil: " + (err.message || "Error"));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingMember) {
        // Skema UpdateMemberAdminDto: [nama_member, instansi, alamat, telp, password, foto]
        const payload: any = {
          nama_member: form.nama_member,
          instansi: form.instansi,
          alamat: form.alamat,
          telp: form.telp,
        };
        if (form.password && form.password.trim()) {
          payload.password = form.password.trim();
        }
        if (form.foto) {
          payload.foto = form.foto;
        }

        await apiFetcher(`/api/admin/members/${editingMember.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        alert("Data pelanggan berhasil diperbarui!");
      } else {
        await apiFetcher("/api/admin/members", {
          method: "POST",
          body: JSON.stringify(form),
        });
        alert("Member baru berhasil ditambahkan!");
      }

      setIsModalOpen(false);
      loadMembers();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan data member.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus pelanggan "${name}" dari sistem?`)) return;
    try {
      await apiFetcher(`/api/admin/members/${id}`, { method: "DELETE" });
      alert("Pelanggan berhasil dihapus.");
      loadMembers();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus pelanggan.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
            Database Pelanggan RuanginAja
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Kelola Member & Pelanggan (CRUD)
          </h1>
          <p className="text-xs text-slate-500 pt-1">
            Daftar member aktif yang terdaftar dan terisolasi untuk APP_KEY sistem ini.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#087EA4] hover:bg-[#0284C7] text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <span>+</span> Tambah Member Baru
        </button>
      </div>

      {/* Search Bar & App Key Status Pill */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Cari nama / instansi / no. telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4]"
          />
          <span className="absolute left-3.5 top-3 text-slate-400 text-xs">🔍</span>
        </div>

        <span className="text-xs font-bold text-slate-600">
          Total Pelanggan: <b>{members.length}</b> Orang
        </span>
      </div>

      {/* Member Cards / Table Display */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-bold">Memuat data member...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-3">
          <div className="text-4xl">👥</div>
          <h3 className="font-bold text-slate-800 text-sm">Belum Ada Member di RuanginAja</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Hanya member yang terdaftar dengan APP_KEY ini yang ditampilkan di panel Anda. Klik tombol <b>&ldquo;+ Tambah Member Baru&rdquo;</b> di atas untuk menambahkan pelanggan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <div
              key={m.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={resolveMemberAvatar(m)}
                  alt={m.nama_member}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                />
                <div className="space-y-0.5 overflow-hidden">
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    {m.nama_member}
                  </h3>
                  <p className="text-xs text-[#087EA4] font-semibold">@{m.username}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    🏢 {m.instansi || "Umum / Freelancer"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="truncate">
                  📞 <b>{m.telp || "-"}</b>
                </p>
                <p className="truncate text-[11px]">
                  📍 {m.alamat || "Alamat belum diatur"}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(m)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                >
                  ✏️ Ubah
                </button>
                <button
                  onClick={() => handleDelete(m.id, m.nama_member)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-200"
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah & Edit Member (Wireframe B-4) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
                  Formulir Pelanggan
                </span>
                <h3 className="font-black text-xl text-slate-900">
                  {editingMember ? "Ubah Data Pelanggan" : "Tambah Member Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingMember)}
                    placeholder="johndoe"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {editingMember ? "Password Baru (Opsional)" : "Password"}
                  </label>
                  <input
                    type="password"
                    required={!editingMember}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe, S.Kom"
                  value={form.nama_member}
                  onChange={(e) => setForm({ ...form, nama_member: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Instansi / Universitas
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SMK Telkom Malang / PT Maju"
                    value={form.instansi}
                    onChange={(e) => setForm({ ...form, instansi: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="081234567890"
                    value={form.telp}
                    onChange={(e) => setForm({ ...form, telp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Jl. Danau Ranau No. 1, Malang"
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs outline-none focus:border-[#087EA4]"
                />
              </div>

              {/* Upload Foto Member */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Foto Profil (Opsional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    {uploadingImage ? "Mengunggah..." : "📁 Pilih Foto Profil"}
                  </button>
                  <span className="text-xs text-slate-400 truncate">
                    {form.foto ? `Foto: ${form.foto}` : "Belum ada foto"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="bg-[#087EA4] hover:bg-[#075985] text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  {saving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
