"use client";

import { useState, useEffect, useRef } from "react";
import {
  apiFetcher,
  formatRupiah,
  resolveSpaceImage,
  uploadMedia,
  getStoredUser,
} from "../../../lib/api/client";

interface SpaceItem {
  id: number;
  nama_space: string;
  harga_per_jam: number;
  tipe: string;
  kapasitas: number;
  deskripsi: string;
  foto?: string | null;
  foto_url?: string | null;
}

const emptyForm = {
  nama_space: "",
  harga_per_jam: 25000,
  tipe: "desk",
  kapasitas: 1,
  deskripsi: "",
  foto: "",
};

export default function AdminSpacesPage() {
  const [user, setUser] = useState<any>(null);
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<SpaceItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    loadSpaces();
  }, []);

  async function loadSpaces() {
    setLoading(true);
    try {
      const res: any = await apiFetcher("/api/admin/spaces");
      let list: SpaceItem[] = [];
      if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res?.data?.items)) list = res.data.items;
      else if (Array.isArray(res)) list = res;
      setSpaces(list);
    } catch (err) {
      console.error("Gagal memuat spaces admin:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAdd = () => {
    setEditingSpace(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const handleOpenEdit = (space: SpaceItem) => {
    setEditingSpace(space);
    setForm({
      nama_space: space.nama_space || "",
      harga_per_jam: space.harga_per_jam || 25000,
      tipe: space.tipe || "desk",
      kapasitas: space.kapasitas || 1,
      deskripsi: space.deskripsi || "",
      foto: space.foto || "",
    });
    setSelectedFile(null);
    setImagePreview(resolveSpaceImage(space));
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedFile) {
        // Use FormData with field 'foto' directly so the backend FileInterceptor captures and saves the image
        const formData = new FormData();
        formData.append("nama_space", form.nama_space);
        formData.append("harga_per_jam", String(form.harga_per_jam));
        formData.append("tipe", form.tipe);
        formData.append("kapasitas", String(form.kapasitas));
        formData.append("deskripsi", form.deskripsi);
        formData.append("foto", selectedFile);

        if (editingSpace) {
          await apiFetcher(`/api/admin/spaces/${editingSpace.id}`, {
            method: "PUT",
            body: formData,
          });
          alert("Foto dan data ruangan berhasil diperbarui!");
        } else {
          await apiFetcher("/api/admin/spaces", {
            method: "POST",
            body: formData,
          });
          alert("Ruangan baru dengan foto berhasil ditambahkan!");
        }
      } else {
        // No new file chosen: send JSON text updates (preserves existing photo in backend)
        const payload = {
          nama_space: form.nama_space,
          harga_per_jam: Number(form.harga_per_jam),
          tipe: form.tipe,
          kapasitas: Number(form.kapasitas),
          deskripsi: form.deskripsi,
        };

        if (editingSpace) {
          await apiFetcher(`/api/admin/spaces/${editingSpace.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          alert("Data ruangan berhasil diperbarui!");
        } else {
          await apiFetcher("/api/admin/spaces", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          alert("Ruangan baru berhasil ditambahkan!");
        }
      }

      setIsModalOpen(false);
      loadSpaces();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan data ruangan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus ruangan "${name}" secara permanen?`)) return;
    try {
      await apiFetcher(`/api/admin/spaces/${id}`, { method: "DELETE" });
      alert("Ruangan berhasil dihapus.");
      loadSpaces();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus ruangan.");
    }
  };

  const filteredSpaces = spaces.filter((s) => {
    const nameMatch = (s.nama_space || "").toLowerCase().includes(search.toLowerCase());
    const descMatch = (s.deskripsi || "").toLowerCase().includes(search.toLowerCase());
    const typeMatch = !selectedType || s.tipe === selectedType;
    return (nameMatch || descMatch) && typeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
            Fasilitas & Ruangan
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Kelola Ruangan & Meja Kerja (CRUD)
          </h1>
          <p className="text-xs text-slate-500 pt-1">
            Atur ketersediaan tipe space, tarif per jam, kapasitas, dan foto representasi.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#087EA4] hover:bg-[#0284C7] text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5"
        >
          <span>+</span> Tambah Ruangan Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            placeholder="Cari nama atau fasilitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4]"
          />
          <span className="absolute left-3.5 top-3 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { label: "Semua Tipe", value: "" },
            { label: "Personal Desk", value: "desk" },
            { label: "Meeting Room", value: "meeting_room" },
            { label: "Private Office", value: "private_office" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedType(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedType === tab.value
                  ? "bg-[#087EA4] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Spaces (Wireframe B-6) */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 border-4 border-[#087EA4] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-bold">Memuat data space...</p>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 rounded-3xl text-center border border-slate-200/90 space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#087EA4] flex items-center justify-center mx-auto text-3xl">
            🏢
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-slate-900 text-base">
              Belum Ada Ruangan Terdaftar
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              Halaman ini adalah inventaris khusus milik <strong className="text-slate-800 font-bold">{user?.nama_coworking || user?.nama_pemilik || "Coworking Anda"}</strong>.
              Katalog di halaman beranda menampilkan seluruh ruangan dari semua coworking space di sistem, sedangkan di sini khusus untuk mengelola ruangan milik Anda sendiri.
            </p>
            <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-3.5 max-w-md mx-auto text-left space-y-1 text-xs text-slate-700">
              <div className="flex items-center gap-1.5 font-bold text-[#087EA4]">
                <span>💡</span> Cara Agar Reservasi Masuk:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                <li>Klik tombol <strong>&ldquo;Tambah Ruangan Baru&rdquo;</strong> di bawah.</li>
                <li>Setelah ruangan berhasil disimpan, buka katalog member dan pesan ruangan milik Anda.</li>
                <li>Reservasi akan otomatis masuk ke menu <strong>Dashboard & Reservasi</strong> untuk persetujuan Anda!</li>
              </ol>
            </div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-[#087EA4] hover:bg-[#075985] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>+ Tambah Ruangan Baru Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  <img
                    src={resolveSpaceImage(s)}
                    alt={s.nama_space}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-slate-800 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm">
                    {s.tipe === "meeting_room"
                      ? "Meeting Room"
                      : s.tipe === "private_office"
                      ? "Private Office"
                      : "Personal Desk"}
                  </span>
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                    👥 {s.kapasitas} Orang
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-base text-slate-900 leading-tight">
                    {s.nama_space}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {s.deskripsi || "Fasilitas lengkap Wi-Fi dan colokan listrik."}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Tarif Sewa
                  </span>
                  <span className="font-black text-sm text-[#087EA4]">
                    {formatRupiah(s.harga_per_jam)}
                    <span className="text-[10px] font-normal text-slate-400"> /jam</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    ✏️ Ubah
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.nama_space)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Space (Wireframe B-6) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#087EA4]">
                  Formulir Space
                </span>
                <h3 className="font-black text-xl text-slate-900">
                  {editingSpace ? "Ubah Data Ruangan" : "Tambah Ruangan Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Nama Ruangan / Space
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Personal Desk Alpha 01"
                  value={form.nama_space}
                  onChange={(e) => setForm({ ...form, nama_space: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#087EA4]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Tipe Ruangan
                  </label>
                  <select
                    value={form.tipe}
                    onChange={(e) => setForm({ ...form, tipe: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#087EA4]"
                  >
                    <option value="desk">Personal Desk</option>
                    <option value="meeting_room">Meeting Room</option>
                    <option value="private_office">Private Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Tarif Sewa (IDR/Jam)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={form.harga_per_jam}
                    onChange={(e) =>
                      setForm({ ...form, harga_per_jam: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#087EA4]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Kapasitas (Orang)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={form.kapasitas}
                    onChange={(e) =>
                      setForm({ ...form, kapasitas: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#087EA4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Deskripsi & Rincian Fasilitas
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Dilengkapi stopkontak, Wi-Fi 100Mbps, monitor 27 inch 4K, dan free refill kopi/teh."
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs outline-none focus:border-[#087EA4]"
                />
              </div>

              {/* Upload Foto Ruangan */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Foto Representasi Ruangan
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-sky-50 hover:bg-sky-100 text-[#087EA4] border border-sky-200/80 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <span>📁</span>
                    <span>{editingSpace && form.foto ? "Ganti Foto Ruangan" : "Pilih Berkas Foto"}</span>
                  </button>
                  <span className="text-xs text-slate-500 truncate max-w-[220px]">
                    {selectedFile ? `File baru: ${selectedFile.name}` : form.foto ? `Foto tersimpan: ${form.foto}` : "Belum ada file dipilih"}
                  </span>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview(editingSpace ? resolveSpaceImage(editingSpace) : null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                    >
                      Batal Ganti
                    </button>
                  )}
                </div>

                {imagePreview && (
                  <div className="mt-3 relative w-40 h-24 rounded-2xl overflow-hidden border-2 border-sky-200 shadow-xs bg-slate-100">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                      {selectedFile ? "Pratinjau Baru" : "Foto Aktif"}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#087EA4] hover:bg-[#075985] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Ruangan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}