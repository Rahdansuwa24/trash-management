import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import TicketBadge from '../components/TicketBadge';
import { Coins, PlusCircle, History, Package, ArrowRight, Loader2, CheckCircle, Scale } from 'lucide-react';

export default function SetorSampah() {
  const [activeTab, setActiveTab] = useState('setor'); // 'setor' or 'riwayat'
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [weight, setWeight] = useState('');
  const [alamat, setAlamat] = useState('Jl. Rungkut Madya No. 45');
  const [kota, setKota] = useState('Surabaya');
  const [kecamatan, setKecamatan] = useState('Rungkut');
  const [catatan, setCatatan] = useState('');
  
  const [fotoFile, setFotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successTrx, setSuccessTrx] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [myTransactions, setMyTransactions] = useState([]);
  const [pointsData, setPointsData] = useState({ total_poin: 0, history: [] });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const catRes = await api.getCategories();
      if (catRes.data && catRes.data.length > 0) {
        setCategories(catRes.data);
        setSelectedCat(catRes.data[0]);
      }

      const trxRes = await api.getMyTransactions().catch(() => ({ data: [] }));
      setMyTransactions(trxRes.data || []);

      const ptRes = await api.getPointsHistory().catch(() => ({ data: { total_poin: 0, history: [] } }));
      setPointsData(ptRes.data || { total_poin: 0, history: [] });
    } catch (err) {
      console.warn('Initial data warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header with Balance */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Coins className="w-7 h-7 text-civic-700" />
            Bank Sampah Komunitas
          </h1>
          <p className="text-sm text-slate-600">
            Setorkan sampah anorganik terpilah Anda dan tukarkan menjadi poin bernilai ekonomis.
          </p>
        </div>

        <div className="p-4 bg-civic-50 border border-civic-200 rounded-xl flex items-center gap-3 self-stretch sm:self-auto">
          <div className="w-10 h-10 rounded-lg bg-civic-700 text-white flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-civic-800 uppercase tracking-wider block">Saldo Poin Anda</span>
            <span className="text-2xl font-extrabold text-civic-900 font-mono">
              {pointsData.total_poin.toLocaleString('id-ID')} <span className="text-sm font-semibold">Poin</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('setor')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] ${
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
          onClick={() => setActiveTab('riwayat')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors min-h-[44px] ${
            activeTab === 'riwayat'
              ? 'border-civic-700 text-civic-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Riwayat Transaksi & Poin ({myTransactions.length})
        </button>
      </div>

      {/* Tab 1: Form Setor */}
      {activeTab === 'setor' && (
        <div className="space-y-6">
          {successTrx && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-emerald-900">Pengajuan Setor Berhasil Dibuat</h3>
                <p className="text-sm text-emerald-700">
                  Kode Transaksi: <strong className="font-mono text-base">{successTrx.kode_transaksi}</strong>
                </p>
                <p className="text-xs text-slate-600 max-w-md mx-auto pt-1">
                  Mitra Bank Sampah akan mengonfirmasi penjemputan ke alamat Anda. Poin akhir akan disesuaikan dengan hasil timbangan riil.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSuccessTrx(null);
                  setWeight('');
                  setFotoFile(null);
                  setPreviewUrl(null);
                }}
                className="px-5 py-2 bg-civic-700 hover:bg-civic-800 text-white rounded-lg text-xs font-semibold"
              >
                Buat Setoran Baru
              </button>
            </div>
          )}

          {!successTrx && (
            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              {errorMsg && (
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  {errorMsg}
                </div>
              )}

              {/* Category Picker */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-800">
                  Pilih Kategori Sampah Daur Ulang <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((cat) => {
                    const isSelected = selectedCat?.id_kategori === cat.id_kategori;
                    return (
                      <button
                        type="button"
                        key={cat.id_kategori}
                        onClick={() => setSelectedCat(cat)}
                        className={`p-4 rounded-xl border text-left transition-all min-h-[44px] ${
                          isSelected
                            ? 'border-civic-600 bg-civic-50/70 ring-2 ring-civic-600'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-sm text-slate-900">{cat.nama_kategori}</span>
                          <span className="text-xs font-bold text-civic-700 bg-civic-100 px-2 py-0.5 rounded">
                            {cat.poin_per_kg} Poin/Kg
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{cat.deskripsi}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weight Input & Live Calculator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Estimasi Berat Sampah (Kg) <span className="text-rose-600">*</span>
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
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">Kg</span>
                  </div>
                </div>

                {/* Live Estimator Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Estimasi Perolehan</span>
                    <div className="text-lg font-bold text-civic-800 font-mono">
                      {calculatedPoints} Poin
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Estimasi Nilai</span>
                    <div className="text-sm font-semibold text-slate-700">
                      Rp {estimatedValue.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Kota / Wilayah <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={kota}
                    onChange={(e) => setKota(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Kecamatan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Alamat Lengkap Titik Penjemputan <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, atau patokan lokasi"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
                />
              </div>

              {/* Photo Input (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Foto Sampah (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-civic-50 file:text-civic-700 hover:file:bg-civic-100"
                />
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="mt-2 h-24 rounded-lg object-cover" />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Catatan untuk Mitra Pengepul
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Sampah sudah dikemas rapi dalam karung di depan pagar"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-6 bg-civic-700 hover:bg-civic-800 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Memproses Pengajuan...
                    </>
                  ) : (
                    'Ajukan Penjemputan Sampah'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: Riwayat Transaksi & Mutasi Poin */}
      {activeTab === 'riwayat' && (
        <div className="space-y-6">
          {/* Active Transactions */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Daftar Transaksi Setor Sampah</h3>
            {myTransactions.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">Belum ada transaksi setor sampah.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {myTransactions.map((t) => (
                  <div key={t.id_transaksi} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">{t.kode_transaksi}</span>
                        <TicketBadge status={t.status} />
                      </div>
                      <p className="text-xs text-slate-600">
                        Kategori: <strong className="text-slate-800">{t.nama_kategori}</strong> | Estimasi: {t.estimasi_berat_kg} Kg
                        {t.berat_aktual_kg ? ` | Aktual: ${t.berat_aktual_kg} Kg` : ''}
                      </p>
                      <span className="text-[11px] text-slate-400 block">
                        {new Date(t.tanggal_transaksi).toLocaleDateString('id-ID', { dateStyle: 'medium' })} • {t.alamat_jemput}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-civic-700 font-mono block">
                        +{t.total_poin_diperoleh} Poin
                      </span>
                      {t.nama_mitra && (
                        <span className="text-[11px] text-slate-500 block">Mitra: {t.nama_mitra}</span>
                      )}
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
              <p className="text-sm text-slate-500 py-6 text-center">Belum ada riwayat mutasi poin.</p>
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
        </div>
      )}
    </div>
  );
}
