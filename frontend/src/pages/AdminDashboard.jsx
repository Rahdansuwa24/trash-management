import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import TicketBadge from '../components/TicketBadge';
import { calculateEcoImpact } from '../utils/ecoCalculator';
import { 
  Shield, Users, CheckCircle, Trash2, Coins, Loader2, AlertTriangle, 
  Gift, Plus, Pencil, Eye, EyeOff, Package, ShoppingBag, Wheat, 
  ShoppingBasket, Receipt, Wallet, X, CheckCircle2, Ticket, Leaf, Droplets, TreePine, Sparkles, ShieldAlert, MapPin, ExternalLink, Calendar, Search, Truck, Image as ImageIcon
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
  const [activeTab, setActiveTab] = useState('claims'); // 'claims' | 'users' | 'katalog'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // State Klaim Sembako Warga
  const [claimsList, setClaimsList] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimStatusFilter, setClaimStatusFilter] = useState('');
  const [actionClaimLoading, setActionClaimLoading] = useState(null);

  // State Katalog Penukaran
  const [katalogList, setKatalogList] = useState([]);
  const [katalogLoading, setKatalogLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State untuk Tambah / Edit Katalog
  // State Pengawasan Sampah Liar (Read-Only Supervision)
  const [reportsList, setReportsList] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('');

  const fetchReportsData = async () => {
    try {
      setReportsLoading(true);
      const query = reportStatusFilter ? `?status=${encodeURIComponent(reportStatusFilter)}` : '';
      const res = await api.getAdminReports(query);
      setReportsList(res.data || []);
    } catch (err) {
      console.warn('Gagal memuat aduan sampah liar:', err.message);
    } finally {
      setReportsLoading(false);
    }
  };
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
    fetchClaimsData();
  }, [selectedRole, claimStatusFilter]);

  useEffect(() => {
    if (activeTab === 'katalog') {
      fetchKatalogData();
    } else if (activeTab === 'claims') {
      fetchClaimsData();
    } else if (activeTab === 'reports') {
      fetchReportsData();
    }
  }, [activeTab, reportStatusFilter]);

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

  const fetchClaimsData = async () => {
    try {
      setClaimsLoading(true);
      const res = await api.getAdminClaims(claimStatusFilter);
      setClaimsList(res.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat data klaim sembako warga.');
    } finally {
      setClaimsLoading(false);
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

  // Klaim Sembako Handlers
  const handleVerifyClaim = async (claim, nextStatus) => {
    let catatanAdmin = '';

    if (nextStatus === 'DITOLAK_BATAL') {
      const input = window.prompt(`Alasan pembatalan/penolakan klaim ${claim.kode_klaim} (poin akan dikembalikan otomatis ke warga):`, 'Stok sembako di Balai RT sedang habis');
      if (input === null) return; // user cancelled prompt
      catatanAdmin = input.trim();
    } else if (nextStatus === 'DISETUJUI_SIAP_AMBIL') {
      const input = window.prompt(`Catatan petunjuk pengambilan untuk warga (opsional):`, 'Silakan ambil di Balai RT 03 pada jam kerja / jadwal timbang');
      if (input !== null) catatanAdmin = input.trim();
    } else if (nextStatus === 'SELESAI_DISERAHKAN') {
      if (!window.confirm(`Konfirmasi serah terima fisik barang "${claim.nama_item}" kepada ${claim.nama_warga}? Stok fisik di katalog akan otomatis dipotong 1 unit.`)) {
        return;
      }
      catatanAdmin = 'Barang fisik telah diserahkan di Balai RT.';
    }

    try {
      setActionClaimLoading(claim.id_klaim);
      await api.verifyAdminClaim(claim.id_klaim, {
        status: nextStatus,
        catatan_admin: catatanAdmin || undefined
      });
      setSuccessMsg(`Status klaim ${claim.kode_klaim} berhasil diperbarui.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchClaimsData();
      fetchAdminData();
    } catch (err) {
      alert(`Gagal memverifikasi klaim: ${err.message}`);
    } finally {
      setActionClaimLoading(null);
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

  // Kalkulasi Dampak Lingkungan KLHK
  const ecoMetrics = calculateEcoImpact(stats?.total_waste_recycled_kg || 0);

  const filteredAdminReports = reportsList.filter((item) => {
    if (!reportSearch.trim()) return true;
    const q = reportSearch.toLowerCase();
    return (
      item.kode_tiket?.toLowerCase().includes(q) ||
      item.alamat_lokasi?.toLowerCase().includes(q) ||
      item.nama_pelapor?.toLowerCase().includes(q) ||
      item.deskripsi_kejadian?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-civic-700" />
          Dashboard Administrator Paguyuban RW 05
        </h1>
        <p className="text-sm text-slate-600">
          Pusat validasi klaim sembako, pemantauan metrik dampak lingkungan KLHK, serta tata kelola akun warga dan mitra.
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

      {/* Primary Metrics Grid */}
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

      {/* KLHK ECOLOGICAL IMPACT METRICS PANEL */}
      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-emerald-700/50 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Leaf className="w-4 h-4" />
              Kalkulator Dampak Ekologis KLHK (Permen LHK No. 14/2021)
            </div>
            <h3 className="text-lg font-extrabold text-white tracking-tight mt-0.5">
              Capaian Reduksi Emisi & Sirkular Komunitas RW 05
            </h3>
          </div>
          <span className="text-[11px] font-mono bg-emerald-800/60 text-emerald-200 px-3 py-1 rounded-full border border-emerald-600/40">
            Kawasan Kalirungkut
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Emisi Tercegah</span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-white">
              {ecoMetrics.co2AvoidedKg} <span className="text-xs font-sans text-emerald-300">kg CO₂e</span>
            </p>
            <p className="text-[11px] text-slate-300">Setara {ecoMetrics.co2AvoidedTons} ton karbon gas buang</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-sky-300 text-xs font-semibold">
              <Droplets className="w-3.5 h-3.5" />
              <span>Air Bersih Terlindungi</span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-white">
              {ecoMetrics.waterSavedLiters} <span className="text-xs font-sans text-sky-300">Liter</span>
            </p>
            <p className="text-[11px] text-slate-300">Dari pencemaran minyak & limbah</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
              <TreePine className="w-3.5 h-3.5" />
              <span>Pohon Produktif</span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-white">
              {ecoMetrics.treesSaved} <span className="text-xs font-sans text-emerald-300">Pohon</span>
            </p>
            <p className="text-[11px] text-slate-300">Kapasitas serapan CO₂ setara 1 tahun</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
              <Leaf className="w-3.5 h-3.5" />
              <span>Diversi TPA</span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-white">
              {ecoMetrics.diversionRate}%
            </p>
            <p className="text-[11px] text-slate-300">Sampah lolos dari TPA Benowo</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap cursor-pointer ${
            activeTab === 'claims'
              ? 'border-civic-700 text-civic-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Validasi Klaim Sembako Warga ({claimsList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap cursor-pointer ${
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
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap cursor-pointer ${
            activeTab === 'katalog'
              ? 'border-civic-700 text-civic-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          Katalog Penukaran Poin & Sembako ({katalogList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap cursor-pointer ${
            activeTab === 'reports'
              ? 'border-civic-700 text-civic-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Pengawasan Aduan Sampah Liar ({reportsList.length})
        </button>
      </div>

      {/* TAB 1: VALIDASI KLAIM SEMBAKO WARGA */}
      {activeTab === 'claims' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-civic-700" />
                Antrean Klaim Penukaran Sembako Warga ({claimsList.length})
              </h2>
              <p className="text-xs text-slate-500">
                Verifikasi ketersediaan barang di Balai RT dan potong stok fisik saat serah terima.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Filter Status:</span>
              <select
                value={claimStatusFilter}
                onChange={(e) => setClaimStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
              >
                <option value="">Semua Status</option>
                <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
                <option value="DISETUJUI_SIAP_AMBIL">Siap Diambil</option>
                <option value="SELESAI_DISERAHKAN">Selesai Diserahkan</option>
                <option value="DITOLAK_BATAL">Ditolak / Batal</option>
              </select>
            </div>
          </div>

          {claimsLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-civic-700 mx-auto" />
            </div>
          ) : claimsList.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Tidak ada permohonan klaim penukaran sembako.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Kode & Tanggal</th>
                    <th className="py-3 px-4 font-semibold">Warga Penukar</th>
                    <th className="py-3 px-4 font-semibold">Item & Poin</th>
                    <th className="py-3 px-4 font-semibold">Status Klaim</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claimsList.map((claim) => {
                    const isPending = claim.status_klaim === 'MENUNGGU_VERIFIKASI';
                    const isReady = claim.status_klaim === 'DISETUJUI_SIAP_AMBIL';
                    const isDone = claim.status_klaim === 'SELESAI_DISERAHKAN';
                    const isCancelled = claim.status_klaim === 'DITOLAK_BATAL';

                    return (
                      <tr key={claim.id_klaim} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-civic-700 block">{claim.kode_klaim}</span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(claim.tanggal_pengajuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{claim.nama_warga}</span>
                          <span className="text-slate-500">RT {claim.rt || '03'} / RW {claim.rw || '05'} • {claim.kontak_warga || '-'}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{claim.nama_item}</span>
                          <span className="font-mono font-semibold text-civic-700">
                            {claim.biaya_poin} Poin ({claim.nilai_rupiah})
                          </span>
                          {claim.sisa_stok_item !== undefined && (
                            <span className="text-[11px] text-slate-400 block">Stok gudang: {claim.sisa_stok_item} pcs</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isReady
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800'
                                : isDone
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isReady
                              ? 'SIAP DIAMBIL'
                              : isPending
                              ? 'MENUNGGU VERIFIKASI'
                              : isDone
                              ? 'SELESAI DISERAHKAN'
                              : 'DITOLAK / BATAL'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {actionClaimLoading === claim.id_klaim ? (
                              <Loader2 className="w-4 h-4 animate-spin text-civic-700" />
                            ) : (
                              <>
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyClaim(claim, 'DISETUJUI_SIAP_AMBIL')}
                                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                                      title="Setujui dan siapkan barang di Balai RT"
                                    >
                                      Setujui (Siap Ambil)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyClaim(claim, 'DITOLAK_BATAL')}
                                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                                      title="Tolak dan kembalikan poin ke saldo warga"
                                    >
                                      Tolak & Refund
                                    </button>
                                  </>
                                )}

                                {isReady && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyClaim(claim, 'SELESAI_DISERAHKAN')}
                                      className="px-2.5 py-1.5 bg-civic-700 hover:bg-civic-800 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                                      title="Serahkan barang fisik di Balai RT dan potong stok"
                                    >
                                      Serahkan (Potong Stok)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyClaim(claim, 'DITOLAK_BATAL')}
                                      className="px-2 py-1.5 text-slate-400 hover:text-rose-600 rounded-lg text-xs transition-colors cursor-pointer"
                                      title="Batal dan kembalikan poin"
                                    >
                                      Batal
                                    </button>
                                  </>
                                )}

                                {(isDone || isCancelled) && (
                                  <span className="text-[11px] text-slate-400 italic">Selesai Diproses</span>
                                )}
                              </>
                            )}
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

      {/* TAB 2: User Moderation Directory */}
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
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors min-h-[36px] cursor-pointer ${
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

      {/* TAB 3: Kelola Katalog Penukaran Poin & Sembako */}
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
              className="px-4 py-2.5 bg-civic-700 hover:bg-civic-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 min-h-[44px] transition-colors shadow-sm cursor-pointer"
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
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[10px] transition-colors min-h-[30px] cursor-pointer ${
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
                              className="p-2 text-slate-600 hover:text-civic-700 hover:bg-slate-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                              title="Edit Item"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteKatalog(item)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
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

      {/* TAB 4: PENGAWASAN ADUAN SAMPAH LIAR (READ-ONLY) */}
      {activeTab === 'reports' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-civic-700" />
                  Pengawasan & Rekapitulasi Aduan Sampah Liar RW 05
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                  Supervisi (Read-Only)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Memantau progres penanganan dan bukti pembersihan armada Satgas Lapangan secara transparan tanpa intervensi fisik.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Cari kode tiket / lokasi..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs w-full focus:outline-hidden focus:border-civic-600"
                />
              </div>

              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-white text-slate-700"
              >
                <option value="">Semua Status Aduan</option>
                <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
                <option value="INVESTIGASI">Tahap Investigasi</option>
                <option value="DALAM_PENANGANAN">Dalam Penanganan Armada</option>
                <option value="SELESAI_DIBERSIHKAN">Selesai Dibersihkan</option>
                <option value="DITOLAK">Ditolak</option>
              </select>

              <button
                type="button"
                onClick={fetchReportsData}
                className="text-xs text-civic-700 font-semibold hover:underline px-2 py-1"
              >
                Segarkan
              </button>
            </div>
          </div>

          {reportsLoading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-civic-700" />
              <p className="text-sm font-medium">Memuat data pengawasan aduan warga...</p>
            </div>
          ) : filteredAdminReports.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Tidak ada aduan yang sesuai filter pengawasan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAdminReports.map((item) => (
                <div key={item.id_laporan} className="bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <div>
                    <div className="h-40 bg-slate-100 relative">
                      {item.foto_bukti_url ? (
                        <img
                          src={item.foto_bukti_url}
                          alt="Bukti sampah liar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          <ImageIcon className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <TicketBadge status={item.status} />
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <Link
                            to={`/lacak?code=${item.kode_tiket}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono font-bold text-civic-700 hover:text-civic-800 hover:underline flex items-center gap-1 group/link"
                            title="Buka tampilan lacak publik (tab baru)"
                          >
                            {item.kode_tiket}
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-civic-700" />
                          </Link>
                          <span className="text-[11px] text-slate-400">{item.nama_pelapor || 'Anonim'}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mt-1">{item.deskripsi_kejadian}</h3>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-200/80">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.alamat_lokasi}, {item.kecamatan}, {item.kota}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <Link
                      to={`/lacak?code=${item.kode_tiket}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[38px]"
                    >
                      Buka Detail Lacak Publik
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Form: Tambah / Edit Item Katalog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-civic-700" />
                {editingItem ? 'Edit Opsi Penukaran Poin' : 'Tambah Opsi Penukaran Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
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
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 min-h-[44px] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-civic-700 hover:bg-civic-800 text-white rounded-xl font-bold min-h-[44px] flex items-center gap-2 transition-colors cursor-pointer"
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
