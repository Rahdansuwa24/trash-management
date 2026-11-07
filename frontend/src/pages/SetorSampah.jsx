import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompressor';
import TicketBadge from '../components/TicketBadge';
import { 
  Coins, PlusCircle, History, Package, ArrowRight, Loader2, CheckCircle, Scale, 
  LogIn, AlertCircle, Gift, Wallet, Receipt, ShoppingBag, CheckCircle2, Wheat, ShoppingBasket,
  Building2
} from 'lucide-react';

export default function SetorSampah() {
  const { user, setLoginModalOpen } = useAuth();

  const [activeTab, setActiveTab] = useState('setor'); // 'setor', 'tukar', or 'riwayat'
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
  const [successTrx, setSuccessTrx] = useState(null);
  const [redeemSuccess, setRedeemSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [myTransactions, setMyTransactions] = useState([]);
  const [pointsData, setPointsData] = useState({ total_poin: 0, history: [] });

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

  // Fallback awal katalog penukaran jika offline/sebelum API terhubung
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

      // Ambil katalog penukaran dinamis dari backend (yang dikelola admin)
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
      } else {
        setMyTransactions([]);
        setPointsData({ total_poin: 0, history: [] });
      }
    } catch (err) {
      console.warn('Initial data warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setCompressing(true);
        const compressed = await compressImage(file, { maxWidth: 1280, quality: 0.8 });
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

  const handleRedeemClick = (item) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    if (pointsData.total_poin < item.cost) {
      alert(`Saldo poin Anda belum mencukupi untuk klaim ${item.title}. Anda memiliki ${pointsData.total_poin} Poin, dibutuhkan minimal ${item.cost} Poin.`);
      return;
    }
    setRedeemSuccess(item);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header with Balance */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Coins className="w-7 h-7 text-civic-700" />
            Bank Sampah Unit RT/RW
          </h1>
          <p className="text-sm text-slate-600">
            Setorkan sampah anorganik terpilah dari rumah dan tukarkan menjadi poin tabungan bernilai ekonomis.
          </p>
        </div>

        <div className="p-4 bg-civic-50 border border-civic-200 rounded-xl flex items-center gap-3 self-stretch sm:self-auto">
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
      </div>

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

      {/* Role Guidance Banner if logged in as Mitra */}
      {user?.role === 'mitra' && (
        <div className="p-5 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Building2 className="w-6 h-6 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-sky-950">Anda Masuk Sebagai Akun Petugas ({user.nama})</h4>
              <p className="text-xs text-sky-800 mt-0.5">
                Akun petugas/mitra bertugas <strong>menerima dan memverifikasi timbangan</strong> setoran warga, bukan mengajukan setor sampah. Silakan gunakan Portal Petugas untuk memproses antrean penimbangan warga.
              </p>
            </div>
          </div>
          <Link
            to="/mitra"
            className="px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-semibold shrink-0 min-h-[44px] flex items-center gap-1.5 transition-colors shadow-xs"
          >
            Buka Portal Petugas &rarr;
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('setor')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap ${
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
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap ${
            activeTab === 'tukar'
              ? 'border-civic-700 text-civic-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          Tukar Poin Tabungan ({catalogItems.length} Pilihan)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('riwayat')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap ${
            activeTab === 'riwayat'
              ? 'border-civic-700 text-civic-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Buku Besar Mutasi ({myTransactions.length})
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
                  Petugas unit bank sampah akan menjadwalkan penimbangan di alamat Anda.
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
                className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 min-h-[40px]"
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

          {user?.role === 'mitra' ? (
            <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto">
                <Scale className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Formulir Setor Ini Khusus Nasabah / Warga Lingkungan</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                  Akun Anda terdaftar sebagai <strong>{user.nama} (Peran: Petugas / Mitra)</strong>. Peran Anda dalam ekosistem ini adalah sebagai <strong>penerima</strong> yang bertugas menimbang berat sampah fisik dan menerbitkan poin tabungan bagi warga.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/mitra"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-civic-700 hover:bg-civic-800 text-white rounded-xl text-xs font-bold transition-colors min-h-[44px]"
                >
                  Buka Antrean Penimbangan di Portal Petugas
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
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
                      className={`p-4 rounded-xl border text-left transition-all min-h-[44px] ${
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

            {/* Step 4: Foto Sampah Terpilah (dengan kompresi otomatis) */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-900">
                4. Foto Sampah Terpilah (Opsional tapi dianjurkan)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-civic-50 file:text-civic-700 hover:file:bg-civic-100"
              />
              {compressing && (
                <p className="text-[11px] text-civic-700 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengompresi foto sebelum upload...
                </p>
              )}
              {previewUrl && (
                <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
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
                placeholder="Contoh: Sampah diletakkan di teras depan, bisa diambil setelah pukul 15.00..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-civic-700 hover:bg-civic-800 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
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
          )}
        </div>
      )}

      {/* Tab 2: KATALOG TUKAR POIN */}
      {activeTab === 'tukar' && (
        <div className="space-y-6">
          {redeemSuccess && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-950">Pengajuan Klaim Penukaran Berhasil!</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Pengajuan klaim untuk <strong>{redeemSuccess.title}</strong> senilai <strong>{redeemSuccess.cost} Poin</strong> telah tercatat.
              </p>
              <p className="text-xs text-emerald-700">
                Silakan konfirmasi ke Bendahara RT / Pengurus Bank Sampah saat jadwal pertemuan warga atau penarikan iuran.
              </p>
              <button
                type="button"
                onClick={() => setRedeemSuccess(null)}
                className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                Tutup Pemberitahuan
              </button>
            </div>
          )}

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Gift className="w-6 h-6 text-civic-700" />
                Katalog Penukaran Tabungan Daur Ulang RT/RW
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Gunakan akumulasi saldo poin dari pemilahan sampah Anda untuk manfaat riil di lingkungan perumahan.
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
                        onClick={() => handleRedeemClick(item)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] ${
                          isAffordable
                            ? 'bg-civic-700 hover:bg-civic-800 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isAffordable ? 'Klaim Penukaran Sekarang' : user ? 'Poin Belum Cukup' : 'Masuk untuk Menukar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800">Tata Cara Penukaran Komunitas:</span>
              <p>
                Seluruh klaim penukaran diselesaikan secara gotong royong oleh Pengurus Bank Sampah Unit dan Bendahara RT setempat saat agenda pertemuan warga atau penarikan iuran lingkungan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Riwayat Transaksi */}
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
                className="px-4 py-2 bg-civic-700 text-white rounded-lg text-xs font-semibold"
              >
                Masuk Akun Warga
              </button>
            </div>
          )}

          {user && (
            <>
              {/* Transactions list */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">Daftar Transaksi Penyetoran Anda</h3>
                {myTransactions.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">Belum ada riwayat transaksi penyetoran sampah.</p>
                ) : (
                  <div className="space-y-3">
                    {myTransactions.map((t) => (
                      <div key={t.id_transaksi} className="p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-mono font-bold text-civic-700 block">{t.kode_transaksi}</span>
                          <span className="font-semibold text-slate-800">{t.nama_kategori}</span>
                          <span className="text-slate-500 block">Berat: {t.estimasi_berat_kg} Kg</span>
                        </div>
                        <div className="text-right space-y-1">
                          <TicketBadge status={t.status} />
                          <span className="text-xs font-mono font-bold text-civic-700 block">
                            +{t.total_poin_diperoleh} Poin
                          </span>
                        </div>
                      </div>
                    ))}
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
                            <td className="py-3 px-3 text-right font-mono font-bold text-civic-700">
                              +{h.perubahan_poin}
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
    </div>
  );
}
