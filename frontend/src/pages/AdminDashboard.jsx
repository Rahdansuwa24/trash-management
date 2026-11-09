import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import TicketBadge from '../components/TicketBadge';
import { calculateEcoImpact } from '../utils/ecoCalculator';
import { 
  Shield, Users, CheckCircle, Trash2, Coins, Loader2, AlertTriangle, 
  Gift, Plus, Pencil, Eye, EyeOff, Package, ShoppingBag, Wheat, 
  ShoppingBasket, Receipt, Wallet, X, CheckCircle2, Ticket, Leaf, Droplets, TreePine, Sparkles, ShieldAlert, MapPin, ExternalLink, Calendar, Search, Truck, Image as ImageIcon,
  Scale, LayoutDashboard, BarChart3, Filter, Clock, ChevronRight, RefreshCw, ArrowUpRight, UserPlus, Building2, ShieldCheck
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
  const [activeTab, setActiveTab] = useState('bank_sampah'); // 'bank_sampah' | 'overview' | 'claims' | 'katalog' | 'users' | 'reports'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // State Monitoring Bank Sampah (Ekonomi Sirkular & Transaksi Warga)
  const [pickupsList, setPickupsList] = useState([]);
  const [pickupsLoading, setPickupsLoading] = useState(false);
  const [pickupStatusFilter, setPickupStatusFilter] = useState('');
  const [pickupTimeFilter, setPickupTimeFilter] = useState('ALL'); // 'ALL' | 'THIS_MONTH' | 'THIS_WEEK'
  const [pickupSearch, setPickupSearch] = useState('');

  // State Klaim Sembako Warga
  const [claimsList, setClaimsList] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimStatusFilter, setClaimStatusFilter] = useState('');
  const [claimTimeFilter, setClaimTimeFilter] = useState('ALL'); // 'ALL' | 'THIS_MONTH' | 'THIS_WEEK'
  const [actionClaimLoading, setActionClaimLoading] = useState(null);

  // State Katalog Penukaran
  const [katalogList, setKatalogList] = useState([]);
  const [katalogLoading, setKatalogLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // State Pengawasan Sampah Liar (Read-Only Supervision)
  const [reportsList, setReportsList] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('');
  const [reportTimeFilter, setReportTimeFilter] = useState('ALL'); // 'ALL' | 'THIS_MONTH' | 'THIS_WEEK'

  // State Pendaftaran Akun Mitra / Petugas Baru oleh Admin
  const [mitraModalOpen, setMitraModalOpen] = useState(false);
  const [mitraSubmitting, setMitraSubmitting] = useState(false);
  const [mitraError, setMitraError] = useState('');
  const [mitraFormData, setMitraFormData] = useState({
    nama: '',
    email: '',
    password: '',
    instansi_nama: '',
    jenis_mitra: 'satgas_lapangan',
    wilayah_tugas: 'RW 05',
    no_telp: '',
    alamat: ''
  });

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

  const fetchPickupsData = async () => {
    try {
      setPickupsLoading(true);
      const query = pickupStatusFilter ? `?status=${encodeURIComponent(pickupStatusFilter)}` : '';
      const res = await api.getAdminPickups(query);
      setPickupsList(res.data || []);
    } catch (err) {
      console.warn('Gagal memuat data transaksi bank sampah:', err.message);
    } finally {
      setPickupsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchClaimsData();
    fetchPickupsData();
  }, [selectedRole, claimStatusFilter]);

  useEffect(() => {
    if (activeTab === 'katalog') {
      fetchKatalogData();
    } else if (activeTab === 'claims') {
      fetchClaimsData();
    } else if (activeTab === 'reports') {
      fetchReportsData();
    } else if (activeTab === 'bank_sampah') {
      fetchPickupsData();
    }
  }, [activeTab, reportStatusFilter, pickupStatusFilter]);

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

  // Mitra Registration Handlers
  const handleOpenMitraModal = () => {
    setMitraFormData({
      nama: '',
      email: '',
      password: '',
      instansi_nama: '',
      jenis_mitra: 'satgas_lapangan',
      wilayah_tugas: 'RW 05',
      no_telp: '',
      alamat: ''
    });
    setMitraError('');
    setMitraModalOpen(true);
  };

  const handleMitraFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setMitraSubmitting(true);
      setMitraError('');
      const res = await api.createAdminMitra(mitraFormData);
      setSuccessMsg(res.message || 'Akun mitra / petugas berhasil didaftarkan.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setMitraModalOpen(false);
      fetchAdminData();
    } catch (err) {
      setMitraError(err.message || 'Gagal mendaftarkan akun mitra.');
    } finally {
      setMitraSubmitting(false);
    }
  };

  // Klaim Sembako Handlers
  const handleVerifyClaim = async (claim, nextStatus) => {
    let catatanAdmin = '';

    if (nextStatus === 'DITOLAK_BATAL') {
      const input = window.prompt(`Alasan pembatalan/penolakan klaim ${claim.kode_klaim} (poin akan dikembalikan otomatis ke warga):`, 'Stok sembako di Balai RT sedang habis');
      if (input === null) return;
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

  // Filter & Search Bank Sampah
  const filteredPickups = useMemo(() => {
    return pickupsList.filter((item) => {
      if (pickupSearch.trim()) {
        const q = pickupSearch.toLowerCase();
        const matchSearch =
          item.kode_transaksi?.toLowerCase().includes(q) ||
          item.nama_warga?.toLowerCase().includes(q) ||
          item.alamat_jemput?.toLowerCase().includes(q) ||
          item.nama_kategori?.toLowerCase().includes(q) ||
          item.nama_petugas?.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      if (pickupTimeFilter !== 'ALL' && item.tanggal_transaksi) {
        const itemDate = new Date(item.tanggal_transaksi);
        const now = new Date();
        if (pickupTimeFilter === 'THIS_WEEK') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < oneWeekAgo) return false;
        } else if (pickupTimeFilter === 'THIS_MONTH') {
          if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [pickupsList, pickupSearch, pickupTimeFilter]);

  // Statistik Agregat Bank Sampah
  const bankSampahStats = useMemo(() => {
    let totalKg = 0;
    let totalPoints = 0;
    let totalSelesai = 0;
    let totalMenunggu = 0;
    const categoryBreakdown = {};

    pickupsList.forEach((item) => {
      const kg = parseFloat(item.berat_aktual_kg || item.estimasi_berat_kg || 0);
      const poin = parseInt(item.total_poin_diperoleh || (kg * (item.poin_per_kg || 15)), 10);
      
      if (item.status === 'SELESAI') {
        totalKg += kg;
        totalPoints += poin;
        totalSelesai += 1;
      } else if (item.status === 'MENUNGGU_VERIFIKASI') {
        totalMenunggu += 1;
      }

      const cat = item.nama_kategori || 'Lainnya';
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { kg: 0, count: 0 };
      categoryBreakdown[cat].kg += kg;
      categoryBreakdown[cat].count += 1;
    });

    return {
      totalKg: totalKg.toFixed(1),
      totalPoints,
      totalRupiah: (totalPoints * 100).toLocaleString('id-ID'),
      totalSelesai,
      totalMenunggu,
      categoryBreakdown
    };
  }, [pickupsList]);

  const filteredClaimsList = useMemo(() => {
    return claimsList.filter((c) => {
      if (claimTimeFilter !== 'ALL' && c.tanggal_pengajuan) {
        const itemDate = new Date(c.tanggal_pengajuan);
        const now = new Date();
        if (claimTimeFilter === 'THIS_WEEK') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < oneWeekAgo) return false;
        } else if (claimTimeFilter === 'THIS_MONTH') {
          if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }
      return true;
    });
  }, [claimsList, claimTimeFilter]);

  const filteredAdminReports = useMemo(() => {
    return reportsList.filter((item) => {
      if (reportSearch.trim()) {
        const q = reportSearch.toLowerCase();
        const match =
          item.kode_tiket?.toLowerCase().includes(q) ||
          item.alamat_lokasi?.toLowerCase().includes(q) ||
          item.nama_pelapor?.toLowerCase().includes(q) ||
          item.deskripsi_kejadian?.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (reportTimeFilter !== 'ALL' && item.created_at) {
        const itemDate = new Date(item.created_at);
        const now = new Date();
        if (reportTimeFilter === 'THIS_WEEK') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < oneWeekAgo) return false;
        } else if (reportTimeFilter === 'THIS_MONTH') {
          if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [reportsList, reportSearch, reportTimeFilter]);

  const pendingClaimsCount = claimsList.filter((c) => c.status_klaim === 'MENUNGGU_VERIFIKASI').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-civic-50 text-civic-800 border border-civic-200">
            <Shield className="w-3.5 h-3.5 text-civic-700" />
            Panel Administrator RW 05 Kalirungkut
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pusat Pengawasan & Tata Kelola Sirkular
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Monitoring perputaran nilai jual Bank Sampah, validasi sembako warga, supervisi armada, dan pemantauan reduksi emisi karbon KLHK.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              fetchAdminData();
              fetchClaimsData();
              fetchPickupsData();
              if (activeTab === 'reports') fetchReportsData();
            }}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title="Muat ulang seluruh data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Segarkan Data
          </button>
        </div>
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

      {/* Main Container with Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar Menu */}
        <aside className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 sticky top-20">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu Administrasi
          </div>

          <nav className="space-y-1">
            {/* Menu 1: Monitoring Bank Sampah */}
            <button
              type="button"
              onClick={() => setActiveTab('bank_sampah')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-colors min-h-[44px] cursor-pointer ${
                activeTab === 'bank_sampah'
                  ? 'bg-civic-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Coins className="w-4 h-4 shrink-0" />
                <span>Monitoring Bank Sampah</span>
              </div>
              {bankSampahStats.totalMenunggu > 0 ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'bank_sampah' ? 'bg-white text-civic-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {bankSampahStats.totalMenunggu} jemput
                </span>
              ) : (
                <span className={`text-[10px] ${activeTab === 'bank_sampah' ? 'text-white/80' : 'text-slate-400'}`}>
                  {pickupsList.length}
                </span>
              )}
            </button>

            {/* Menu 2: Ringkasan & Dampak KLHK */}
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-colors min-h-[44px] cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-civic-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Leaf className="w-4 h-4 shrink-0" />
                <span>Ringkasan & Metrik KLHK</span>
              </div>
              <span className={`text-[10px] ${activeTab === 'overview' ? 'text-white/80' : 'text-emerald-600 font-semibold'}`}>
                {ecoMetrics.co2AvoidedKg} kg CO₂
              </span>
            </button>

            {/* Menu 3: Validasi Klaim Sembako */}
            <button
              type="button"
              onClick={() => setActiveTab('claims')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-colors min-h-[44px] cursor-pointer ${
                activeTab === 'claims'
                  ? 'bg-civic-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Ticket className="w-4 h-4 shrink-0" />
                <span>Validasi Klaim Sembako</span>
              </div>
              {pendingClaimsCount > 0 ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'claims' ? 'bg-white text-civic-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {pendingClaimsCount} baru
                </span>
              ) : (
                <span className={`text-[10px] ${activeTab === 'claims' ? 'text-white/80' : 'text-slate-400'}`}>
                  {claimsList.length}
                </span>
              )}
            </button>

            {/* Menu 4: Katalog Reward & Sembako */}
            <button
              type="button"
              onClick={() => setActiveTab('katalog')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-colors min-h-[44px] cursor-pointer ${
                activeTab === 'katalog'
                  ? 'bg-civic-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gift className="w-4 h-4 shrink-0" />
                <span>Katalog Poin & Sembako</span>
              </div>
              <span className={`text-[10px] ${activeTab === 'katalog' ? 'text-white/80' : 'text-slate-400'}`}>
                {katalogList.length} item
              </span>
            </button>

            {/* Menu 5: Moderasi Pengguna */}
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-colors min-h-[44px] cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-civic-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0" />
                <span>Moderasi Akun Pengguna</span>
              </div>
              <span className={`text-[10px] ${activeTab === 'users' ? 'text-white/80' : 'text-slate-400'}`}>
                {users.length} akun
              </span>
            </button>

            {/* Menu 6: Arsip Aduan Sampah Liar */}
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-colors min-h-[44px] cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-civic-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Arsip Aduan Sampah Liar</span>
              </div>
              <span className={`text-[10px] ${activeTab === 'reports' ? 'text-white/80' : 'text-slate-400'}`}>
                {reportsList.length}
              </span>
            </button>
          </nav>

          {/* Quick System Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>Status Operasional</span>
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Aktif
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Unit Bank Sampah terhubung dengan 5 RT di lingkungan RW 05 Kalirungkut, Surabaya.
            </p>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="lg:col-span-9 space-y-6 min-w-0">
          
          {/* ======================================================== */}
          {/* TAB: MONITORING BANK SAMPAH (Wadah Nilai Jual & Transaksi) */}
          {/* ======================================================== */}
          {activeTab === 'bank_sampah' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Scale className="w-3.5 h-3.5 text-civic-600" />
                    <span>Total Ditimbang</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono block">
                    {bankSampahStats.totalKg} <span className="text-xs font-sans text-slate-500">Kg</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Sampah anorganik terpilah</span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Poin Terdistribusi</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono block">
                    {bankSampahStats.totalPoints.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">Masuk ke saldo warga</span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    <Wallet className="w-3.5 h-3.5 text-blue-600" />
                    <span>Perputaran Nilai</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold text-blue-700 font-mono block">
                    Rp {bankSampahStats.totalRupiah}
                  </span>
                  <span className="text-[11px] text-slate-500">Estimasi nilai ekonomi sembako</span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    <Truck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Antrean Jemput</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono block">
                    {bankSampahStats.totalMenunggu} <span className="text-xs font-sans text-slate-500">Warga</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Perlu penjemputan mitra</span>
                </div>
              </div>

              {/* Kategori Komoditas Breakdown */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-civic-700" />
                    Distribusi Komoditas Sampah Terkumpul
                  </h3>
                  <span className="text-[11px] text-slate-500">Akumulasi seluruh transaksi</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(bankSampahStats.categoryBreakdown).length === 0 ? (
                    <p className="text-xs text-slate-400 col-span-4 py-2">Belum ada data komoditas.</p>
                  ) : (
                    Object.entries(bankSampahStats.categoryBreakdown).map(([category, val]) => (
                      <div key={category} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-xs font-bold text-slate-800 block truncate">{category}</span>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-base font-extrabold text-civic-800 font-mono">
                            {val.kg.toFixed(1)} <span className="text-[10px] font-sans text-slate-500">Kg</span>
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 font-mono">
                            {val.count}x setor
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Table / List Container */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Coins className="w-5 h-5 text-civic-700" />
                      Audit Transaksi & Riwayat Bank Sampah ({filteredPickups.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Catatan pembukuan digital setoran warga, verifikasi timbangan mitra, dan perolehan poin sembako.
                    </p>
                  </div>

                  {/* Filter Group: Search, Status, Time Range */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Time Range Filter (Menjawab kebutuhan agar riwayat tidak menumpuk tanpa menghapus data) */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setPickupTimeFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          pickupTimeFilter === 'ALL'
                            ? 'bg-white text-civic-800 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Semua Waktu
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickupTimeFilter('THIS_MONTH')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          pickupTimeFilter === 'THIS_MONTH'
                            ? 'bg-white text-civic-800 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Bulan Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickupTimeFilter('THIS_WEEK')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          pickupTimeFilter === 'THIS_WEEK'
                            ? 'bg-white text-civic-800 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        7 Hari Terakhir
                      </button>
                    </div>

                    {/* Status Filter */}
                    <select
                      value={pickupStatusFilter}
                      onChange={(e) => setPickupStatusFilter(e.target.value)}
                      className="text-xs py-1.5 px-3 border border-slate-300 rounded-xl bg-white font-medium text-slate-700"
                    >
                      <option value="">Semua Status</option>
                      <option value="MENUNGGU_VERIFIKASI">Menunggu Penjemputan</option>
                      <option value="DIKONFIRMASI_MITRA">Dalam Penjemputan</option>
                      <option value="SELESAI">Selesai & Poin Diberikan</option>
                    </select>

                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-48">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={pickupSearch}
                        onChange={(e) => setPickupSearch(e.target.value)}
                        placeholder="Cari transaksi..."
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs w-full focus:outline-hidden focus:border-civic-600"
                      />
                    </div>
                  </div>
                </div>

                {pickupsLoading ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-civic-700 mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Memuat buku transaksi bank sampah...</p>
                  </div>
                ) : filteredPickups.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Coins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Tidak ada transaksi bank sampah yang cocok.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter waktu atau kata kunci pencarian.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Kode & Tanggal</th>
                          <th className="py-3 px-4 font-semibold">Warga & Lokasi Jemput</th>
                          <th className="py-3 px-4 font-semibold">Kategori & Berat</th>
                          <th className="py-3 px-4 font-semibold">Nilai Poin & Rupiah</th>
                          <th className="py-3 px-4 font-semibold">Mitra Penjemput</th>
                          <th className="py-3 px-4 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPickups.map((item) => {
                          const isDone = item.status === 'SELESAI';
                          const isClaimed = item.status === 'DIKONFIRMASI_MITRA';
                          const berat = isDone ? item.berat_aktual_kg : item.estimasi_berat_kg;
                          const poin = item.total_poin_diperoleh || Math.round(berat * (item.poin_per_kg || 15));
                          const nilaiRp = (poin * 100).toLocaleString('id-ID');

                          return (
                            <tr key={item.id_transaksi} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold text-civic-700 block">{item.kode_transaksi}</span>
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {new Date(item.tanggal_transaksi).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="font-bold text-slate-900 block">{item.nama_warga}</span>
                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  RT {item.rt || '03'} / RW {item.rw || '05'} • {item.alamat_jemput}
                                </span>
                                {item.kontak_warga && (
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Telp: {item.kontak_warga}
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="font-semibold text-slate-800 block">{item.nama_kategori}</span>
                                <span className="text-[11px] font-mono text-slate-600">
                                  {berat} Kg {isDone ? '(Hasil Timbang Riil)' : '(Estimasi Warga)'}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold text-emerald-700 text-sm block">
                                  +{poin} Poin
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Setara Rp {nilaiRp}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                {item.nama_petugas || item.nama_mitra ? (
                                  <div>
                                    <span className="font-semibold text-slate-800 block text-[11px]">
                                      {item.nama_petugas || item.nama_mitra}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {item.nama_mitra ? `Unit: ${item.nama_mitra}` : 'Petugas Armada'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] italic text-amber-600">Belum di-klaim armada</span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                {isDone ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle className="w-3 h-3" />
                                    Selesai Ditimbang
                                  </span>
                                ) : isClaimed ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                    <Truck className="w-3 h-3" />
                                    Dalam Penjemputan
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3 h-3" />
                                    Menunggu Petugas
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: RINGKASAN & METRIK KLHK */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Primary Metrics Grid */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Aduan Sampah</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                      {stats.total_reports}
                    </span>
                    <span className="text-[11px] text-slate-400 block">Titik lokasi teridentifikasi</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Selesai Dibersihkan</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
                      {stats.resolved_reports}
                    </span>
                    <span className="text-[11px] text-emerald-600 block">Dibersihkan satgas lapangan</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">Sampah Terdaur Ulang</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono">
                      {stats.total_waste_recycled_kg} <span className="text-sm font-semibold">Kg</span>
                    </span>
                    <span className="text-[11px] text-blue-600 block">Unit Bank Sampah RT/RW</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <span className="text-xs font-semibold text-civic-600 uppercase tracking-wider block">Total Poin Beredar</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-civic-800 font-mono">
                      {stats.total_points_distributed?.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-slate-400 block">Siap ditukar sembako</span>
                  </div>
                </div>
              )}

              {/* KLHK ECOLOGICAL IMPACT METRICS PANEL */}
              <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md space-y-5">
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
                      <span>Air Terlindungi</span>
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
                    <p className="text-[11px] text-slate-300">Sampah teralihkan dari TPA Benowo</p>
                  </div>
                </div>

                <div className="p-3.5 bg-black/20 rounded-xl text-xs text-slate-300 flex items-start gap-2 border border-white/5">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Data di atas dihitung secara riil berdasarkan standar konversi KLHK RI dari seluruh transaksi timbang Bank Sampah yang diselesaikan mitra lapangan. Data ini siap diekspor untuk Laporan Tahunan Adipura & Pengelolaan Lingkungan Hidup Daerah.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: VALIDASI KLAIM SEMBAKO WARGA */}
          {/* ======================================================== */}
          {activeTab === 'claims' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-civic-700" />
                    Antrean Klaim Penukaran Sembako Warga ({filteredClaimsList.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verifikasi ketersediaan barang di Balai RT dan potong stok fisik saat serah terima.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Time Range Filter Buttons */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setClaimTimeFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        claimTimeFilter === 'ALL'
                          ? 'bg-white text-civic-800 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua Waktu
                    </button>
                    <button
                      type="button"
                      onClick={() => setClaimTimeFilter('THIS_MONTH')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        claimTimeFilter === 'THIS_MONTH'
                          ? 'bg-white text-civic-800 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bulan Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setClaimTimeFilter('THIS_WEEK')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        claimTimeFilter === 'THIS_WEEK'
                          ? 'bg-white text-civic-800 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      7 Hari Terakhir
                    </button>
                  </div>

                  <select
                    value={claimStatusFilter}
                    onChange={(e) => setClaimStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
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
              ) : filteredClaimsList.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Tidak ada klaim sembako pada filter periode ini.</p>
                  <p className="text-xs text-slate-400 mt-1">Ubah filter waktu ke "Semua Waktu" untuk melihat pengajuan sebelumnya.</p>
                </div>
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
                      {filteredClaimsList.map((claim) => {
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
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Menunggu Verifikasi Balai RT
                                </span>
                              )}
                              {isReady && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  Siap Diambil di Balai RT
                                </span>
                              )}
                              {isDone && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Selesai Diserahkan
                                </span>
                              )}
                              {isCancelled && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Dibatalkan / Ditolak (Poin Refund)
                                </span>
                              )}
                              {claim.catatan_admin && (
                                <span className="text-[11px] text-slate-500 italic block mt-1">
                                  "{claim.catatan_admin}"
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              {actionClaimLoading === claim.id_klaim ? (
                                <Loader2 className="w-4 h-4 animate-spin text-civic-700 ml-auto" />
                              ) : (
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {isPending && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleVerifyClaim(claim, 'DISETUJUI_SIAP_AMBIL')}
                                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition-colors min-h-[32px] cursor-pointer"
                                      >
                                        Setujui Siap Ambil
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleVerifyClaim(claim, 'DITOLAK_BATAL')}
                                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] transition-colors min-h-[32px] cursor-pointer"
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
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors min-h-[32px] cursor-pointer"
                                      >
                                        Selesai Serahkan Fisik
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleVerifyClaim(claim, 'DITOLAK_BATAL')}
                                        className="px-2 py-1.5 text-slate-400 hover:text-rose-600 font-semibold text-[11px] min-h-[32px] cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                    </>
                                  )}

                                  {(isDone || isCancelled) && (
                                    <span className="text-[11px] text-slate-400 italic">Arsip final</span>
                                  )}
                                </div>
                              )}
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

          {/* ======================================================== */}
          {/* TAB: KATALOG PENUKARAN POIN & SEMBAKO */}
          {/* ======================================================== */}
          {activeTab === 'katalog' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-civic-700" />
                    Daftar Pilihan Penukaran Sembako & Reward
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Item yang berstatus aktif akan langsung tampil di halaman Setor & Tukar Poin warga.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-4 py-2.5 bg-civic-700 hover:bg-civic-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 min-h-[44px] transition-colors shadow-xs cursor-pointer"
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
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">{item.judul}</span>
                                  {item.deskripsi && (
                                    <span className="text-[11px] text-slate-400 block max-w-xs truncate">{item.deskripsi}</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-700">
                                {item.kategori_badge || 'Sembako'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-civic-700 block">{item.biaya_poin} Poin</span>
                              <span className="text-[11px] text-slate-400">Setara {item.nilai_rupiah}</span>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span className="font-mono font-bold text-slate-800">{item.stok ?? 50} unit</span>
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

          {/* ======================================================== */}
          {/* TAB: MODERASI PENGGUNA */}
          {/* ======================================================== */}
          {activeTab === 'users' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-civic-700" />
                    Daftar Pengguna Terdaftar ({users.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola status akun warga serta daftarkan akun resmi Mitra Bank Sampah Unit dan Satgas Lapangan RT/RW.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleOpenMitraModal}
                    className="px-3.5 py-2 bg-civic-700 hover:bg-civic-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer min-h-[38px]"
                  >
                    <UserPlus className="w-4 h-4" />
                    + Daftarkan Mitra / Petugas Baru
                  </button>

                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 text-xs min-h-[38px]"
                    >
                      <option value="">Semua Peran</option>
                      <option value="warga">Warga</option>
                      <option value="mitra">Mitra / Petugas</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-civic-700 mx-auto" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Nama & Email</th>
                        <th className="py-3 px-4 font-semibold">Unit / Wilayah</th>
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
                            {u.role === 'warga' && u.no_telp_warga && (
                              <span className="text-[11px] text-slate-500 block mt-0.5">WA: {u.no_telp_warga}</span>
                            )}
                            {u.role === 'mitra' && u.no_telp_mitra && (
                              <span className="text-[11px] text-slate-500 block mt-0.5">WA: {u.no_telp_mitra}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {u.role === 'mitra' ? (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-800 flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5 text-civic-600 shrink-0" />
                                  {u.instansi_nama || 'Unit RT/RW'}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  Tugas: {u.wilayah_tugas || 'RW 05'}
                                </span>
                              </div>
                            ) : u.role === 'warga' ? (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-800 block">
                                  RT {u.rt || '-'} / RW {u.rw || '05'}
                                </span>
                                <span className="text-[11px] text-slate-500 block truncate max-w-[200px]" title={u.alamat_warga}>
                                  {u.alamat_warga || '-'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">Pusat RW 05</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {u.role === 'admin' ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] bg-purple-50 text-purple-700 border border-purple-200">
                                Administrator
                              </span>
                            ) : u.role === 'mitra' ? (
                              <div className="space-y-1">
                                <span className="inline-block px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                                  Mitra Petugas
                                </span>
                                <span className="block text-[10px] text-slate-500">
                                  {u.jenis_mitra === 'bank_sampah_unit' ? 'Bank Sampah Unit' : 'Satgas Lapangan'}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] bg-slate-100 text-slate-700">
                                Warga
                              </span>
                            )}
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

          {/* ======================================================== */}
          {/* TAB: ARSIP PENGAWASAN SAMPAH LIAR (READ-ONLY) */}
          {/* ======================================================== */}
          {activeTab === 'reports' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-civic-700" />
                      Arsip & Pengawasan Aduan Sampah Liar
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                      Supervisi (Read-Only)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Supervisi penanganan aduan lingkungan oleh armada Satgas Kebersihan Lapangan RT/RW.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Time Range Filter Buttons */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setReportTimeFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        reportTimeFilter === 'ALL'
                          ? 'bg-white text-civic-800 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua Waktu
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportTimeFilter('THIS_MONTH')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        reportTimeFilter === 'THIS_MONTH'
                          ? 'bg-white text-civic-800 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bulan Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportTimeFilter('THIS_WEEK')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        reportTimeFilter === 'THIS_WEEK'
                          ? 'bg-white text-civic-800 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      7 Hari Terakhir
                    </button>
                  </div>

                  <div className="relative flex-1 sm:w-52">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      placeholder="Cari kode tiket / lokasi..."
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs w-full focus:outline-hidden focus:border-civic-600"
                    />
                  </div>

                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                    className="text-xs py-1.5 px-3 border border-slate-300 rounded-xl bg-white text-slate-700"
                  >
                    <option value="">Semua Status Aduan</option>
                    <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
                    <option value="INVESTIGASI">Dalam Investigasi</option>
                    <option value="DALAM_PENANGANAN">Dalam Penanganan Armada</option>
                    <option value="SELESAI">Selesai Dibersihkan</option>
                    <option value="DITOLAK">Ditolak / Tidak Valid</option>
                  </select>
                </div>
              </div>

              {reportsLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-civic-700 mx-auto" />
                </div>
              ) : filteredAdminReports.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">Tidak ada aduan sampah liar yang cocok.</p>
              ) : (
                <div className="space-y-4">
                  {filteredAdminReports.map((item) => (
                    <div
                      key={item.id_laporan}
                      className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/80 text-slate-800">
                            #{item.kode_tiket}
                          </span>
                          <TicketBadge status={item.status} />
                          <span className="text-xs font-bold text-slate-900">{item.nama_pelapor || 'Warga Anonim'}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        <div className="flex items-start gap-1.5 text-xs text-slate-700">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span>{item.alamat_lokasi} (RT {item.rt || '-'} / RW {item.rw || '-'}, {item.kota || 'Surabaya'})</span>
                        </div>

                        {item.deskripsi_kejadian && (
                          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                            "{item.deskripsi_kejadian}"
                          </p>
                        )}

                        {item.catatan_tindakan && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span><strong>Catatan Armada:</strong> {item.catatan_tindakan}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <Link
                          to={`/lacak?code=${encodeURIComponent(item.kode_tiket)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[38px] transition-colors"
                        >
                          <span>Lacak Transparansi</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

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

      {/* Modal Form: Pendaftaran Mitra / Petugas Baru oleh Admin */}
      {mitraModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMitraModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-civic-700" />
                  Daftarkan Akun Mitra / Petugas Baru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Buat akun login resmi untuk Satgas Kebersihan Lapangan atau Pengurus Bank Sampah Unit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMitraModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mitraError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {mitraError}
              </div>
            )}

            <form onSubmit={handleMitraFormSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="block font-bold text-slate-900">
                  Nama Lengkap Petugas / PIC <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mitraFormData.nama}
                  onChange={(e) => setMitraFormData({ ...mitraFormData, nama: e.target.value })}
                  placeholder="Contoh: Rudi Hermawan"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-900">
                  Nama Instansi / Unit Kerja <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mitraFormData.instansi_nama}
                  onChange={(e) => setMitraFormData({ ...mitraFormData, instansi_nama: e.target.value })}
                  placeholder="Contoh: Bank Sampah Melati RT 04 atau Satgas Kebersihan RW 05"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-900">
                    Klasifikasi Mitra <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={mitraFormData.jenis_mitra}
                    onChange={(e) => setMitraFormData({ ...mitraFormData, jenis_mitra: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white min-h-[44px]"
                  >
                    <option value="satgas_lapangan">Satgas Lapangan / Armada TPS3R</option>
                    <option value="bank_sampah_unit">Pengurus Bank Sampah Unit RT/RW</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-900">
                    Wilayah Tugas / Operasional <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={mitraFormData.wilayah_tugas}
                    onChange={(e) => setMitraFormData({ ...mitraFormData, wilayah_tugas: e.target.value })}
                    placeholder="Contoh: RT 04 / RW 05 atau RW 05 Seluruhnya"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-900">
                    Email Akun Petugas <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={mitraFormData.email}
                    onChange={(e) => setMitraFormData({ ...mitraFormData, email: e.target.value })}
                    placeholder="petugas.rt04@trashmanage.id"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-900">
                    Password Akun <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={mitraFormData.password}
                    onChange={(e) => setMitraFormData({ ...mitraFormData, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-900">
                  No. WhatsApp Petugas
                </label>
                <input
                  type="tel"
                  value={mitraFormData.no_telp}
                  onChange={(e) => setMitraFormData({ ...mitraFormData, no_telp: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm min-h-[44px]"
                />
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  Akses Portal Khusus Mitra
                </span>
                <p>
                  Setelah akun dibuat, petugas dapat langsung login di TrashManage untuk mengakses Dashboard Armada & Penjemputan Bank Sampah.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMitraModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 min-h-[44px] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={mitraSubmitting}
                  className="px-5 py-2.5 bg-civic-700 hover:bg-civic-800 text-white rounded-xl font-bold min-h-[44px] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {mitraSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Daftarkan Akun Mitra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
