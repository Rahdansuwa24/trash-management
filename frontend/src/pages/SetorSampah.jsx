import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { compressAndWatermarkImage } from '../utils/imageCompressor';
import TicketBadge from '../components/TicketBadge';
import DigitalReceiptModal from '../components/DigitalReceiptModal';
import { 
  Coins, PlusCircle, History, Package, ArrowRight, Loader2, CheckCircle, Scale, 
  LogIn, AlertCircle, Gift, Wallet, Receipt, ShoppingBag, CheckCircle2, Wheat, ShoppingBasket,
  Building2, QrCode, Sparkles, UserCheck, Phone, Printer, Ticket
} from 'lucide-react';

export default function SetorSampah() {
  const { user, setLoginModalOpen } = useAuth();

  const [activeTab, setActiveTab] = useState('setor'); // 'setor', 'tukar', 'klaim', 'riwayat'
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [weight, setWeight] = useState('');
  const [alamat, setAlamat] = useState(user?.profile?.alamat || 'Jl. Kenanga Blok B4 No. 14, RT 03 / RW 05');
  const [kota, setKota] = useState('Surabaya');
  const [kecamatan, setKecamatan] = useState('Rungkut');
  const [catatan, setCatatan] = useState('');
  
  const [fotoFile, setFotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [successTrx, setSuccessTrx] = useState(null);
  const [redeemSuccess, setRedeemSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [simulationMsg, setSimulationMsg] = useState('');

  const [myTransactions, setMyTransactions] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [pointsData, setPointsData] = useState({ total_poin: 0, history: [] });
  const [selectedReceiptTrx, setSelectedReceiptTrx] = useState(null);

  const ICON_MAP = {
    Receipt,
    ShoppingBag,
    Wheat,
    ShoppingBasket,
    Wallet,
    Coins,
    Gift,
    Package
  };

  const defaultRedemptionCatalog = [
    {
      id: 'iuran_rt',
      title: 'Potongan Iuran Kebersihan & Keamanan RT',
      cost: 50,
      rupiahValue: 'Rp 10.000',
      icon: Receipt,
      desc: 'Potongan langsung iuran bulanan warga. Klaim diverifikasi bendahara RT saat penarikan iuran.',
      badge: 'Iuran Warga'
    },
    {
      id: 'sembako_minyak',
      title: 'Minyak Goreng 1 Liter di Balai RT',
      cost: 100,
      rupiahValue: 'Rp 20.000',
      icon: ShoppingBag,
      desc: 'Voucher sembako minyak goreng kemasan 1L, dapat diambil di Balai RT 03 saat jadwal timbang sampah.',
      badge: 'Sembako Satuan'
    },
    {
      id: 'beras_warga',
      title: 'Beras Premium 2.5 Kg di Balai RT',
      cost: 175,
      rupiahValue: 'Rp 35.000',
      icon: Wheat,
      desc: 'Beras putih premium kemasan 2.5 kg bersertifikat, disubsidi dari kas hasil daur ulang bank sampah.',
      badge: 'Beras Warga'
    },
    {
      id: 'paket_sembako_berkah',
      title: 'Paket Sembako Lengkap (Beras + Minyak + Gula)',
      cost: 250,
      rupiahValue: 'Rp 50.000',
      icon: ShoppingBasket,
      desc: 'Paket komplit: Beras Premium 2.5 kg, Minyak Goreng 1L, dan Gula Pasir 1 kg. Diambil saat penimbangan bulanan.',
      badge: 'Paket Berkah'
    },
    {
      id: 'kas_tunai',
      title: 'Pencairan Kas Tabungan Tunai',
      cost: 50,
      rupiahValue: 'Rp 10.000 (Kelipatan)',
      icon: Wallet,
      desc: 'Pencairan saldo tabungan daur ulang dalam bentuk uang tunai langsung saat rapat RT bulanan.',
      badge: 'Kas Tunai'
    }
  ];

  const [catalogItems, setCatalogItems] = useState(defaultRedemptionCatalog);

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const catRes = await api.getCategories();
      if (catRes.data && catRes.data.length > 0) {
        setCategories(catRes.data);
        setSelectedCat(catRes.data[0]);
      }

      const katalogRes = await api.getKatalog().catch(() => null);
      if (katalogRes && katalogRes.data && katalogRes.data.length > 0) {
        const dynamicItems = katalogRes.data.map((item) => ({
          id: item.id_katalog || item.kode_item,
          title: item.judul,
          cost: item.biaya_poin,
          rupiahValue: item.nilai_rupiah,
          badge: item.kategori_badge,
          icon: ICON_MAP[item.icon_name] || Gift,
          desc: item.deskripsi,
          stok: item.stok
        }));
        setCatalogItems(dynamicItems);
      }

      if (user) {
        const trxRes = await api.getMyTransactions().catch(() => ({ data: [] }));
        setMyTransactions(trxRes.data || []);

        const ptRes = await api.getPointsHistory().catch(() => ({ data: { total_poin: 0, history: [] } }));
        setPointsData(ptRes.data || { total_poin: 0, history: [] });

        const claimsRes = await api.getMyClaims().catch(() => ({ data: [] }));
        setMyClaims(claimsRes.data || []);
      } else {
        setMyTransactions([]);
        setPointsData({ total_poin: 0, history: [] });
        setMyClaims([]);
      }
    } catch (err) {
      console.warn('Initial data warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulationAddPoints = async () => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    try {
      setSimulating(true);
      const res = await api.simulateAddPoints(100);
      setSimulationMsg(res.message || 'Berhasil menambahkan +100 poin simulasi pengujian!');
      setTimeout(() => setSimulationMsg(''), 4000);
      await fetchInitialData();
    } catch (err) {
      alert(`Gagal simulasi poin: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setCompressing(true);
        // Watermark GPS & Timestamp langsung pada foto bukti setor
        const compressed = await compressAndWatermarkImage(file, {
          latitude: -7.318210,
          longitude: 112.784530,
          tag: 'SETOR SAMPAH WARGA',
          wilayah: `RT ${user?.profile?.rt || '03'} / RW ${user?.profile?.rw || '05'} Kalirungkut`
        }, { maxWidth: 1280, quality: 0.82 });
        setFotoFile(compressed);
        setPreviewUrl(URL.createObjectURL(compressed));
      } catch (err) {
        setFotoFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      } finally {
        setCompressing(false);
      }
    }
  };

  const calculatedPoints = selectedCat && weight && !isNaN(parseFloat(weight))
    ? Math.floor(parseFloat(weight) * selectedCat.poin_per_kg)
    : 0;

  const estimatedValue = selectedCat && weight && !isNaN(parseFloat(weight))
    ? Math.floor(parseFloat(weight) * selectedCat.estimasi_harga_per_kg)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    if (!selectedCat) {
      setErrorMsg('Pilih kategori sampah terlebih dahulu.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const formData = new FormData();
      formData.append('id_kategori', selectedCat.id_kategori);
      formData.append('estimasi_berat_kg', weight);
      formData.append('alamat_jemput', alamat);
      formData.append('kota', kota);
      formData.append('kecamatan', kecamatan);
      formData.append('catatan_warga', catatan);
      if (fotoFile) {
        formData.append('file_foto', fotoFile);
      }

      const res = await api.submitWasteTransaction(formData);
      setSuccessTrx(res.data);
      fetchInitialData();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengajukan transaksi setor sampah.');
    } finally {
      setSubmitting(false);
    }
  };

  const [redeemingId, setRedeemingId] = useState(null);

  const handleRedeemClick = async (item) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    if (user.role !== 'warga') {
      alert('Fitur penukaran poin tabungan daur ulang khusus diperuntukkan bagi akun warga lingkungan.');
      return;
    }
    if (pointsData.total_poin < item.cost) {
      alert(`Saldo poin Anda belum mencukupi untuk klaim ${item.title}. Anda memiliki ${pointsData.total_poin} Poin, dibutuhkan minimal ${item.cost} Poin.`);
      return;
    }

    if (!window.confirm(`Konfirmasi penukaran ${item.cost} Poin untuk voucher "${item.title}"? Saldo Anda akan dipotong dan voucher digital akan diterbitkan untuk ditunjukkan ke Balai RT.`)) {
      return;
    }

    try {
      setRedeemingId(item.id);
      const res = await api.claimReward(item.id);
      setRedeemSuccess(res.data || item);
      await fetchInitialData();
    } catch (err) {
      alert(`Gagal mengajukan penukaran poin: ${err.message}`);
    } finally {
      setRedeemingId(null);
    }
  };

  if (user?.role === 'mitra') {
    return <Navigate to="/mitra" replace />;
  }
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header with Balance and Sandbox Helper */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Coins className="w-7 h-7 text-civic-700" />
            Bank Sampah Unit RT/RW
          </h1>
          <p className="text-sm text-slate-600">
            Setorkan sampah anorganik terpilah dari rumah dan tukarkan menjadi poin tabungan sembako & iuran lingkungan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-stretch sm:self-auto">
          {/* Point Balance */}
          <div className="p-4 bg-civic-50 border border-civic-200 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-civic-700 text-white flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-civic-800 uppercase tracking-wider block">
                {user ? 'Saldo Poin Anda' : 'Saldo (Belum Masuk)'}
              </span>
              <span className="text-2xl font-extrabold text-civic-900 font-mono">
                {user ? pointsData.total_poin.toLocaleString('id-ID') : '0'}{' '}
                <span className="text-sm font-semibold">Poin</span>
              </span>
            </div>
          </div>

          {/* Sandbox Demo Button */}
          {user && (
            <button
              type="button"
              disabled={simulating}
              onClick={handleSimulationAddPoints}
              className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
              title="Suntik 100 poin simulasi pengujian cepat tanpa menunggu penimbangan fisik"
            >
              {simulating ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-600" />
              )}
              +100 Poin Simulasi Demo
            </button>
          )}
        </div>
      </div>

      {simulationMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          {simulationMsg}
        </div>
      )}

      {/* Auth Banner if not logged in */}
      {!user && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-900 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Anda belum masuk ke akun warga. Silakan masuk untuk melihat saldo poin dan riwayat setoran pribadi Anda.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLoginModalOpen(true)}
            className="px-4 py-2 bg-civic-700 hover:bg-civic-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 min-h-[40px]"
          >
            <LogIn className="w-4 h-4" />
            Masuk Akun Warga
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('setor')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap cursor-pointer ${
            activeTab === 'setor'
              ? 'border-civic-700 text-civic-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Form Setor Sampah
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tukar')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap cursor-pointer ${
            activeTab === 'tukar'
              ? 'border-civic-700 text-civic-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          Tukar Sembako ({catalogItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('klaim')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap cursor-pointer ${
            activeTab === 'klaim'
              ? 'border-civic-700 text-civic-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Voucher Klaim Saya ({myClaims.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('riwayat')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap cursor-pointer ${
            activeTab === 'riwayat'
              ? 'border-civic-700 text-civic-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Riwayat Setoran ({myTransactions.length})
        </button>
      </div>

      {/* Tab 1: Form Setor */}
      {activeTab === 'setor' && (
        <div className="space-y-6">
          {successTrx && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-emerald-950">Pengajuan Setor Sampah Berhasil!</h3>
                <p className="text-xs text-emerald-800 mt-1">
                  Kode Transaksi Anda:{' '}
                  <strong className="font-mono text-sm underline">{successTrx.kode_transaksi}</strong>
                </p>
                <p className="text-xs text-emerald-700 mt-2">
                  Petugas unit bank sampah akan segera mengonfirmasi dan menjadwalkan penjemputan di alamat Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSuccessTrx(null);
                  setWeight('');
                  setCatatan('');
                  setFotoFile(null);
                  setPreviewUrl(null);
                }}
                className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 min-h-[40px] cursor-pointer"
              >
                Buat Pengajuan Baru
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            {/* Step 1: Kategori Sampah */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-900">
                1. Pilih Kategori Sampah Anorganik <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const isSelected = selectedCat?.id_kategori === cat.id_kategori;
                  return (
                    <button
                      key={cat.id_kategori}
                      type="button"
                      onClick={() => setSelectedCat(cat)}
                      className={`p-4 rounded-xl border text-left transition-all min-h-[44px] cursor-pointer ${
                        isSelected
                          ? 'border-civic-700 bg-civic-50/70 ring-2 ring-civic-600/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-slate-900">{cat.nama_kategori}</span>
                        <span className="text-[11px] font-mono font-bold text-civic-700">
                          +{cat.poin_per_kg} Poin/kg
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{cat.deskripsi}</p>
                      <div className="mt-2 text-[10px] text-slate-400 font-mono">
                        Estimasi Rp {Number(cat.estimasi_harga_per_kg).toLocaleString('id-ID')}/kg
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Berat & Estimasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                  2. Estimasi Berat (Kilogram) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Contoh: 5.5"
                    className="w-full pl-4 pr-12 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    Kg
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  *Timbangan final akan diverifikasi oleh petugas unit bank sampah saat pengambilan.
                </p>
              </div>

              {/* Live Calculator Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Kalkulator Estimasi Perolehan
                </span>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-600">Estimasi Poin:</span>
                  <span className="text-xl font-extrabold text-civic-700 font-mono">
                    +{calculatedPoints} Poin
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-slate-500 border-t border-slate-200/60 pt-1.5">
                  <span>Nilai Setara:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    Rp {estimatedValue.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Alamat Penjemputan / Lokasi RT-RW */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-900">
                3. Alamat Rumah / Titik Penjemputan Lingkungan <span className="text-rose-600">*</span>
              </label>

              <div className="space-y-3">
                <input
                  type="text"
                  required
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Contoh: Jl. Kenanga Blok B4 No. 14, RT 03 / RW 05"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    placeholder="Kecamatan (Contoh: Rungkut)"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm min-h-[44px]"
                  />
                  <input
                    type="text"
                    required
                    value={kota}
                    onChange={(e) => setKota(e.target.value)}
                    placeholder="Kota (Contoh: Surabaya)"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Foto Sampah Terpilah (dengan kompresi & watermark GPS otomatis) */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-900">
                4. Foto Sampah Terpilah (Otomatis Watermark GPS Lapangan)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-civic-50 file:text-civic-700 hover:file:bg-civic-100"
              />
              {compressing && (
                <p className="text-[11px] text-civic-700 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengompresi dan membubuhkan watermark koordinat...
                </p>
              )}
              {previewUrl && (
                <div className="mt-2 w-48 h-36 rounded-lg overflow-hidden border border-slate-200">
                  <img src={previewUrl} alt="Preview Foto Bukti" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Catatan Tambahan */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-900">
                5. Catatan Tambahan untuk Petugas
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Sampah diletakkan di teras depan, siap ditimbang sore hari..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-civic-700 hover:bg-civic-800 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim Pengajuan...
                </>
              ) : (
                <>
                  Ajukan Penjemputan Sampah Sekarang
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: KATALOG TUKAR POIN */}
      {activeTab === 'tukar' && (
        <div className="space-y-6">
          {redeemSuccess && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-950">Voucher Penukaran Berhasil Diterbitkan!</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Kode Klaim: <strong className="font-mono text-sm underline">{redeemSuccess.kode_klaim}</strong> untuk <strong>{redeemSuccess.judul || redeemSuccess.title}</strong> senilai <strong>{redeemSuccess.biaya_poin || redeemSuccess.cost} Poin</strong>.
              </p>
              <p className="text-xs text-emerald-700">
                Buka tab <strong>"Voucher Klaim Saya"</strong> untuk melihat QR Code bukti klaim siap tunjuk di Balai RT 03.
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRedeemSuccess(null);
                    setActiveTab('klaim');
                  }}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Lihat Voucher Saya &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => setRedeemSuccess(null)}
                  className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Gift className="w-6 h-6 text-civic-700" />
                Katalog Penukaran Tabungan Daur Ulang RT/RW
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Gunakan akumulasi saldo poin dari pemilahan sampah Anda untuk sembako dan subsidi iuran lingkungan warga.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {catalogItems.map((item) => {
                const isAffordable = user && pointsData.total_poin >= item.cost;
                const IconComponent = item.icon || Gift;

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-civic-50 text-civic-700 flex items-center justify-center font-bold">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-civic-800 bg-civic-100 px-2 py-0.5 rounded-md">
                          {item.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-lg font-mono font-extrabold text-civic-700">
                            {item.cost} Poin
                          </span>
                          <span className="text-xs text-slate-500 font-medium">({item.rupiahValue})</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Status Poin Anda:</span>
                        <span className={isAffordable ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          {user ? `${pointsData.total_poin} / ${item.cost} Poin` : 'Belum Masuk'}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={redeemingId === item.id}
                        onClick={() => handleRedeemClick(item)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer ${
                          isAffordable
                            ? 'bg-civic-700 hover:bg-civic-800 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {redeemingId === item.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Memproses Klaim...
                          </>
                        ) : isAffordable ? (
                          'Klaim Voucher Sekarang'
                        ) : user ? (
                          'Poin Belum Cukup'
                        ) : (
                          'Masuk untuk Menukar'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800">Tata Cara Pengambilan Sembako:</span>
              <p>
                Setelah melakukan klaim voucher, tunjukkan kode klaim Anda ke pengurus di Balai RT 03 pada jadwal layanan atau pertemuan RT untuk serah terima barang fisik.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: STATUS & VOUCHER KLAIM SAYA */}
      {activeTab === 'klaim' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Ticket className="w-6 h-6 text-civic-700" />
                  Voucher & Status Klaim Sembako Anda ({myClaims.length})
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Pantau verifikasi pengurus dan gunakan kode voucher digital untuk serah terima barang di Balai RT.
                </p>
              </div>
              <button
                onClick={fetchInitialData}
                className="text-xs text-civic-700 font-semibold hover:underline cursor-pointer"
              >
                Segarkan
              </button>
            </div>

            {myClaims.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl space-y-2">
                <Gift className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Belum ada pengajuan klaim penukaran sembako.</p>
                <p className="text-xs text-slate-400">Pilih sembako di tab "Tukar Sembako" untuk menukarkan poin tabungan Anda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {myClaims.map((claim) => {
                  const isReady = claim.status_klaim === 'DISETUJUI_SIAP_AMBIL';
                  const isDone = claim.status_klaim === 'SELESAI_DISERAHKAN';
                  const isPending = claim.status_klaim === 'MENUNGGU_VERIFIKASI';
                  const isCancelled = claim.status_klaim === 'DITOLAK_BATAL';

                  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                    `TRASHMANAGE-KLAIM:${claim.kode_klaim}:${claim.nama_item}:${claim.biaya_poin}PTS`
                  )}`;

                  return (
                    <div
                      key={claim.id_klaim}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                        isReady
                          ? 'border-emerald-300 bg-emerald-50/30 ring-2 ring-emerald-500/20'
                          : isPending
                          ? 'border-amber-200 bg-amber-50/20'
                          : isCancelled
                          ? 'border-rose-200 bg-rose-50/20'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-bold text-xs text-civic-700 bg-civic-50 px-2.5 py-1 rounded-md border border-civic-200">
                            {claim.kode_klaim}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
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
                              ? 'SIAP DIAMBIL DI BALAI RT'
                              : isPending
                              ? 'MENUNGGU VERIFIKASI'
                              : isDone
                              ? 'SELESAI DISERAHKAN'
                              : 'DITOLAK / DIBATALKAN'}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <img
                            src={qrSrc}
                            alt="QR Code Voucher"
                            className="w-16 h-16 rounded-lg border border-slate-200 p-1 bg-white shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="space-y-0.5">
                            <h3 className="text-sm font-bold text-slate-900">{claim.nama_item}</h3>
                            <p className="text-xs text-slate-600">
                              Biaya: <strong className="text-civic-700">{claim.biaya_poin} Poin</strong> ({claim.nilai_rupiah})
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Diajukan: {new Date(claim.tanggal_pengajuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {/* Catatan Admin / Status Instructions */}
                        <div className="p-3 bg-white/80 rounded-xl text-xs space-y-1 border border-slate-200/60">
                          {isReady && (
                            <p className="text-emerald-800 font-semibold flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              Silakan ambil sembako di Balai RT 03 Kalirungkut. Tunjukkan kode voucher ini kepada pengurus.
                            </p>
                          )}
                          {isPending && (
                            <p className="text-amber-800">
                              Klaim sedang diverifikasi oleh Pengurus RW 05 untuk penyiapan stok fisik di Balai RT.
                            </p>
                          )}
                          {isDone && (
                            <p className="text-slate-600">
                              Barang sembako telah diserahkan. Terima kasih atas partisipasi aktif Anda memilah sampah!
                            </p>
                          )}
                          {isCancelled && (
                            <p className="text-rose-700">
                              {claim.catatan_admin || 'Klaim dibatalkan. Poin tabungan telah otomatis dikembalikan ke saldo Anda.'}
                            </p>
                          )}
                          {claim.catatan_admin && !isCancelled && (
                            <p className="text-[11px] text-slate-500 italic pt-0.5 border-t border-slate-100">
                              Catatan Pengurus: {claim.catatan_admin}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Riwayat Transaksi & Struk Digital */}
      {activeTab === 'riwayat' && (
        <div className="space-y-6">
          {!user && (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <LogIn className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Silakan Masuk Terlebih Dahulu</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Riwayat transaksi dan mutasi poin hanya tersimpan dan dapat diakses oleh akun warga yang terautentikasi.
              </p>
              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="px-4 py-2 bg-civic-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Masuk Akun Warga
              </button>
            </div>
          )}

          {user && (
            <>
              {/* Transactions list */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-slate-900">Daftar Transaksi Penyetoran Sampah</h3>
                  <button
                    onClick={fetchInitialData}
                    className="text-xs text-civic-700 font-semibold hover:underline cursor-pointer"
                  >
                    Segarkan
                  </button>
                </div>

                {myTransactions.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">Belum ada riwayat transaksi penyetoran sampah.</p>
                ) : (
                  <div className="space-y-4">
                    {myTransactions.map((t) => {
                      const isConfirmed = t.status === 'DIKONFIRMASI_MITRA';
                      const isDone = t.status === 'SELESAI';

                      return (
                        <div key={t.id_transaksi} className="p-5 rounded-2xl border border-slate-200 space-y-3 bg-white hover:border-slate-300 transition-colors">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-civic-700">{t.kode_transaksi}</span>
                                <TicketBadge status={t.status} />
                              </div>
                              <span className="font-semibold text-xs text-slate-800 block mt-0.5">
                                Kategori: {t.nama_kategori} • Berat: {t.berat_aktual_kg || t.estimasi_berat_kg} Kg
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {isDone && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedReceiptTrx(t)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Struk Digital Resmi
                                </button>
                              )}
                              <span className="text-sm font-mono font-bold text-emerald-600">
                                +{t.total_poin_diperoleh} Poin
                              </span>
                            </div>
                          </div>

                          {/* Tracking Card: Dispatcher Info */}
                          {isConfirmed && (
                            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-sky-700 shrink-0" />
                                <div>
                                  <span className="font-bold">Penjemput Terkonfirmasi:</span>{' '}
                                  <span>{t.nama_mitra || 'Bank Sampah Unit RT 03'}</span>
                                  {t.nama_petugas && <span className="text-sky-700"> ({t.nama_petugas})</span>}
                                </div>
                              </div>
                              {t.kontak_mitra && (
                                <a
                                  href={`https://wa.me/${t.kontak_mitra.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-white px-2 py-1 rounded-md border border-emerald-300 hover:bg-emerald-50"
                                >
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  Hubungi Petugas: {t.kontak_mitra}
                                </a>
                              )}
                            </div>
                          )}

                          <div className="text-[11px] text-slate-500 flex justify-between items-center border-t border-slate-100 pt-2">
                            <span>Alamat: {t.alamat_jemput}</span>
                            <span>{new Date(t.tanggal_transaksi).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Point Ledger History */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">Buku Besar Mutasi Poin</h3>
                {pointsData.history.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">Belum ada catatan mutasi poin.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Waktu</th>
                          <th className="py-2.5 px-3 font-semibold">Tipe</th>
                          <th className="py-2.5 px-3 font-semibold">Keterangan</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Poin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pointsData.history.map((h) => (
                          <tr key={h.id_riwayat} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                              {new Date(h.created_at).toLocaleDateString('id-ID', { dateStyle: 'short' })}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-700">{h.tipe}</td>
                            <td className="py-3 px-3 text-slate-600">{h.keterangan}</td>
                            <td className={`py-3 px-3 text-right font-mono font-bold ${h.perubahan_poin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {h.perubahan_poin >= 0 ? `+${h.perubahan_poin}` : h.perubahan_poin}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Digital Receipt Modal */}
      {selectedReceiptTrx && (
        <DigitalReceiptModal
          transaction={selectedReceiptTrx}
          onClose={() => setSelectedReceiptTrx(null)}
        />
      )}
    </div>
  );
}
