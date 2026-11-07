import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Shield, Users, CheckCircle, Trash2, Coins, Loader2, AlertTriangle, 
  Gift, Plus, Pencil, Eye, EyeOff, Package, ShoppingBag, Wheat, 
  ShoppingBasket, Receipt, Wallet, X 
} from 'lucide-react';

const ICON_MAP = {
  ShoppingBag,
  Wheat,
  ShoppingBasket,
  Receipt,
  Wallet,
  Package,
  Gift,
  Coins
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'katalog'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // State Katalog Penukaran
  const [katalogList, setKatalogList] = useState([]);
  const [katalogLoading, setKatalogLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State untuk Tambah / Edit Katalog
  const [formData, setFormData] = useState({
    judul: '',
    biaya_poin: '',
    nilai_rupiah: '',
    kategori_badge: 'Sembako Satuan',
    icon_name: 'ShoppingBag',
    deskripsi: '',
    stok: 50
  });

  useEffect(() => {
    fetchAdminData();
  }, [selectedRole]);

  useEffect(() => {
    if (activeTab === 'katalog') {
      fetchKatalogData();
    }
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const statRes = await api.getStats().catch(() => ({ data: null }));
      setStats(statRes.data);

      const userRes = await api.getUsers(selectedRole ? `?role=${selectedRole}` : '');
      setUsers(userRes.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat data admin.');
    } finally {
      setLoading(false);
    }
  };

  const fetchKatalogData = async () => {
    try {
      setKatalogLoading(true);
      const res = await api.getAdminKatalog();
      setKatalogList(res.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat katalog penukaran.');
    } finally {
      setKatalogLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'frozen' : 'active';
    try {
      await api.updateUserStatus(user.id_user, nextStatus);
      fetchAdminData();
    } catch (err) {
      alert(`Gagal mengubah status: ${err.message}`);
    }
  };

  // Katalog Handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      judul: '',
      biaya_poin: '',
      nilai_rupiah: '',
      kategori_badge: 'Sembako Satuan',
      icon_name: 'ShoppingBag',
      deskripsi: '',
      stok: 50
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      judul: item.judul,
      biaya_poin: item.biaya_poin,
      nilai_rupiah: item.nilai_rupiah,
      kategori_badge: item.kategori_badge,
      icon_name: item.icon_name || 'ShoppingBag',
      deskripsi: item.deskripsi || '',
      stok: item.stok !== undefined ? item.stok : 50
    });
    setModalOpen(true);
  };

  const handleToggleKatalog = async (item) => {
    try {
      await api.toggleAdminKatalogStatus(item.id_katalog);
      fetchKatalogData();
    } catch (err) {
      alert(`Gagal mengubah status item: ${err.message}`);
    }
  };

  const handleDeleteKatalog = async (item) => {
    if (!window.confirm(`Hapus item "${item.judul}" dari katalog penukaran?`)) {
      return;
    }
    try {
      await api.deleteAdminKatalog(item.id_katalog);
      setSuccessMsg(`Item "${item.judul}" berhasil dihapus.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchKatalogData();
    } catch (err) {
      alert(`Gagal menghapus item: ${err.message}`);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.judul || !formData.biaya_poin || !formData.nilai_rupiah) {
      alert('Mohon isi nama item, biaya poin, dan estimasi nilai rupiah.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingItem) {
        await api.updateAdminKatalog(editingItem.id_katalog, formData);
        setSuccessMsg(`Item "${formData.judul}" berhasil diperbarui.`);
      } else {
        await api.createAdminKatalog(formData);
        setSuccessMsg(`Item "${formData.judul}" berhasil ditambahkan ke katalog.`);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
      setModalOpen(false);
      fetchKatalogData();
    } catch (err) {
      alert(`Gagal menyimpan item: ${err.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-civic-700" />
          Dashboard Administrator Paguyuban RW 05
        </h1>
        <p className="text-sm text-slate-600">
          Pusat pemantauan metrik kebersihan, moderasi akun warga/satgas, dan pengelolaan katalog sembako/reward bank sampah.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Aduan Masuk</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {stats.total_reports}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Selesai Dibersihkan</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
              {stats.resolved_reports}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">Sampah Terdaur Ulang</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono">
              {stats.total_waste_recycled_kg} <span className="text-sm font-semibold">Kg</span>
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-civic-600 uppercase tracking-wider block">Total Poin Beredar</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-civic-800 font-mono">
              {stats.total_points_distributed.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] ${
            activeTab === 'users'
              ? 'border-civic-700 text-civic-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Moderasi Akun Pengguna ({users.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('katalog')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] ${
            activeTab === 'katalog'
              ? 'border-civic-700 text-civic-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          Katalog Penukaran Poin & Sembako ({katalogList.length})
        </button>
      </div>

      {/* TAB 1: User Moderation Directory */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-civic-700" />
                Direktori Akun Pengguna ({users.length})
              </h2>
              <p className="text-xs text-slate-500">Moderasi hak akses dan status operasional akun warga serta petugas</p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Filter Peran:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
              >
                <option value="">Semua Peran</option>
                <option value="warga">Warga</option>
                <option value="mitra">Mitra / Satgas</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-civic-700 mx-auto" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Tidak ada data pengguna.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Nama & Email</th>
                    <th className="py-3 px-4 font-semibold">Peran</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id_user} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{u.nama}</span>
                        <span className="text-slate-400">{u.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors min-h-[36px] ${
                              u.status === 'active'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {u.status === 'active' ? 'Bekukan Akun' : 'Aktifkan'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Kelola Katalog Penukaran Poin & Sembako */}
      {activeTab === 'katalog' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-civic-700" />
                Daftar Pilihan Penukaran Sembako & Reward
              </h2>
              <p className="text-xs text-slate-500">
                Item yang berstatus aktif akan langsung tampil di halaman Setor & Tukar Poin warga.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-civic-700 hover:bg-civic-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 min-h-[44px] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Opsi Penukaran Baru
            </button>
          </div>

          {katalogLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-civic-700 mx-auto" />
            </div>
          ) : katalogList.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Belum ada item katalog.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Item & Deskripsi</th>
                    <th className="py-3 px-4 font-semibold">Kategori Badge</th>
                    <th className="py-3 px-4 font-semibold">Biaya Poin & Rupiah</th>
                    <th className="py-3 px-4 font-semibold text-center">Stok</th>
                    <th className="py-3 px-4 font-semibold text-center">Status Tayang</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {katalogList.map((item) => {
                    const IconComp = ICON_MAP[item.icon_name] || Gift;
                    const isActive = Boolean(item.is_active);

                    return (
                      <tr key={item.id_katalog} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-civic-50 text-civic-700 flex items-center justify-center shrink-0 mt-0.5">
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{item.judul}</span>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{item.deskripsi}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-md font-bold uppercase text-[10px] bg-civic-100 text-civic-800">
                            {item.kategori_badge}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-civic-700 text-sm">{item.biaya_poin} Poin</div>
                          <div className="text-[11px] text-slate-500">{item.nilai_rupiah}</div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                          {item.stok} pcs
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleKatalog(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[10px] transition-colors min-h-[30px] ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                            }`}
                            title="Klik untuk mengubah status tayang"
                          >
                            {isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {isActive ? 'Aktif Tayang' : 'Disembunyikan'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-2 text-slate-600 hover:text-civic-700 hover:bg-slate-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Edit Item"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteKatalog(item)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Hapus Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Form: Tambah / Edit Item Katalog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-civic-700" />
                {editingItem ? 'Edit Opsi Penukaran Poin' : 'Tambah Opsi Penukaran Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="block font-bold text-slate-900">
                  Nama Item / Sembako <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Beras Ramos 5 Kg atau Gula Pasir 1 Kg"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-900">
                    Biaya Poin <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.biaya_poin}
                    onChange={(e) => setFormData({ ...formData, biaya_poin: e.target.value })}
                    placeholder="Contoh: 150"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-mono min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-900">
                    Estimasi Nilai Rupiah <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nilai_rupiah}
                    onChange={(e) => setFormData({ ...formData, nilai_rupiah: e.target.value })}
                    placeholder="Contoh: Rp 30.000"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-900">Badge Kategori</label>
                  <select
                    value={formData.kategori_badge}
                    onChange={(e) => setFormData({ ...formData, kategori_badge: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white min-h-[44px]"
                  >
                    <option value="Sembako Satuan">Sembako Satuan</option>
                    <option value="Beras Warga">Beras Warga</option>
                    <option value="Paket Berkah">Paket Berkah</option>
                    <option value="Iuran Warga">Iuran Warga</option>
                    <option value="Voucher Belanja">Voucher Belanja</option>
                    <option value="Kas Tunai">Kas Tunai</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-900">Pilihan Ikon</label>
                  <select
                    value={formData.icon_name}
                    onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white min-h-[44px]"
                  >
                    <option value="ShoppingBag">ShoppingBag (Minyak/Belanja)</option>
                    <option value="Wheat">Wheat (Beras / Gandum)</option>
                    <option value="ShoppingBasket">ShoppingBasket (Paket Sembako)</option>
                    <option value="Receipt">Receipt (Iuran RT / Tagihan)</option>
                    <option value="Wallet">Wallet (Kas Tunai)</option>
                    <option value="Package">Package (Barang Kemasan)</option>
                    <option value="Gift">Gift (Hadiah / Doorprize)</option>
                    <option value="Coins">Coins (Koin Tabungan)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-900">Stok Tersedia (Unit / Pcs)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stok}
                  onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                  placeholder="50"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-mono min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-900">Deskripsi Tata Cara Pengambilan</label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Contoh: Voucher beras dapat diambil langsung di Balai RT saat penimbangan bulanan..."
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-civic-700 hover:bg-civic-800 text-white rounded-xl font-bold min-h-[44px] flex items-center gap-2 transition-colors"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? 'Simpan Perubahan' : 'Tambah ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
