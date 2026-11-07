import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import TicketBadge from '../components/TicketBadge';
import { Building2, Truck, CheckCircle, Scale, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function PortalMitra() {
  const [partnerType, setPartnerType] = useState('dlh'); // 'dlh' or 'banksampah'
  const [reports, setReports] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // DLH Modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [keteranganAction, setKeteranganAction] = useState('');
  const [statusAction, setStatusAction] = useState('DALAM_PENANGANAN');
  const [fotoTindakan, setFotoTindakan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Bank Sampah Modal state
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [actualWeight, setActualWeight] = useState('');
  const [catatanMitra, setCatatanMitra] = useState('');
  const [pickupLoading, setPickupLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [partnerType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      if (partnerType === 'dlh') {
        const res = await api.getMitraReports();
        setReports(res.data || []);
      } else {
        const res = await api.getWastePickups();
        setPickups(res.data || []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDLHSubmit = async (e) => {
    e.preventDefault();
    if (!keteranganAction.trim()) return;

    try {
      setActionLoading(true);
      const data = new FormData();
      data.append('keterangan_tindakan', keteranganAction);
      data.append('status', statusAction);
      if (fotoTindakan) {
        data.append('file_foto_tindakan', fotoTindakan);
      }

      await api.submitCleanupAction(selectedReport.id_laporan, data);
      setSelectedReport(null);
      setKeteranganAction('');
      setFotoTindakan(null);
      fetchData();
    } catch (err) {
      alert(`Gagal menyimpan tindakan: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePickupComplete = async (e) => {
    e.preventDefault();
    if (!actualWeight || parseFloat(actualWeight) <= 0) {
      alert('Masukkan berat timbangan aktual.');
      return;
    }

    try {
      setPickupLoading(true);
      await api.completePickup(selectedPickup.id_transaksi, {
        berat_aktual_kg: parseFloat(actualWeight),
        catatan_mitra: catatanMitra
      });
      setSelectedPickup(null);
      setActualWeight('');
      setCatatanMitra('');
      fetchData();
    } catch (err) {
      alert(`Gagal menyelesaikan transaksi: ${err.message}`);
    } finally {
      setPickupLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-civic-700" />
            Portal Aksi Mitra & Dinas Lingkungan Hidup
          </h1>
          <p className="text-sm text-slate-600">
            Dasbor operasional penanganan aduan lapangan (DLH) dan verifikasi timbangan daur ulang (Bank Sampah).
          </p>
        </div>

        {/* Partner Role Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setPartnerType('dlh')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all min-h-[40px] flex items-center gap-1.5 ${
              partnerType === 'dlh'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-civic-700" />
            DLH Pemda
          </button>
          <button
            type="button"
            onClick={() => setPartnerType('banksampah')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all min-h-[40px] flex items-center gap-1.5 ${
              partnerType === 'banksampah'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-4 h-4 text-civic-700" />
            Mitra Bank Sampah
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-civic-700 animate-spin mx-auto" />
          <p className="text-sm text-slate-600 font-medium">Memuat data operasional...</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* VIEW 1: DLH REPORTS */}
      {!loading && partnerType === 'dlh' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Daftar Aduan Sampah Liar Masuk ({reports.length})</h2>
            <span className="text-xs text-slate-500">Pembaruan Berkala</span>
          </div>

          {reports.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Tidak ada aduan aktif saat ini.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {reports.map((r) => (
                <div key={r.id_laporan} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{r.kode_tiket}</span>
                      <TicketBadge status={r.status} />
                    </div>
                    <p className="text-sm text-slate-800 font-medium">{r.alamat_lokasi} (Kec. {r.kecamatan}, {r.kota})</p>
                    <p className="text-xs text-slate-600 line-clamp-2">{r.deskripsi_kejadian}</p>
                    <span className="text-[11px] text-slate-400 block">
                      Pelapor: {r.nama_pelapor} • Telp: {r.nomor_kontak}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReport(r);
                        setStatusAction(r.status === 'MENUNGGU_VERIFIKASI' ? 'DALAM_PENANGANAN' : 'SELESAI_DIBERSIHKAN');
                      }}
                      className="px-4 py-2 bg-civic-700 hover:bg-civic-800 text-white font-medium text-xs rounded-lg transition-colors min-h-[40px]"
                    >
                      Tindak Lanjuti
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: BANK SAMPAH PICKUPS */}
      {!loading && partnerType === 'banksampah' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Daftar Pengajuan Setor Sampah Warga ({pickups.length})</h2>
            <span className="text-xs text-slate-500">Penjemputan & Penimbangan</span>
          </div>

          {pickups.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Tidak ada pengajuan penjemputan saat ini.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pickups.map((p) => (
                <div key={p.id_transaksi} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{p.kode_transaksi}</span>
                      <TicketBadge status={p.status} />
                    </div>
                    <p className="text-sm text-slate-800 font-medium">
                      Kategori: <strong className="text-civic-800">{p.nama_kategori}</strong> • Estimasi: {p.estimasi_berat_kg} Kg
                      {p.berat_aktual_kg ? ` • Aktual: ${p.berat_aktual_kg} Kg` : ''}
                    </p>
                    <p className="text-xs text-slate-600">{p.alamat_jemput} ({p.kota})</p>
                    <span className="text-[11px] text-slate-400 block">
                      Warga: {p.nama_warga} • Kontak: {p.kontak_warga || '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {p.status !== 'SELESAI' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPickup(p);
                          setActualWeight(p.estimasi_berat_kg);
                        }}
                        className="px-4 py-2 bg-civic-700 hover:bg-civic-800 text-white font-medium text-xs rounded-lg transition-colors min-h-[40px] flex items-center gap-1.5"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        Verifikasi Timbangan
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        Poin Dikreditkan (+{p.total_poin_diperoleh})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DLH MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Tindak Lanjuti Aduan: <span className="font-mono text-civic-700">{selectedReport.kode_tiket}</span>
            </h3>

            <form onSubmit={handleDLHSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Penanganan</label>
                <select
                  value={statusAction}
                  onChange={(e) => setStatusAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="INVESTIGASI">Tahap Investigasi Petugas</option>
                  <option value="DALAM_PENANGANAN">Dalam Penanganan Armada Truk</option>
                  <option value="SELESAI_DIBERSIHKAN">Selesai Dibersihkan (Tuntas)</option>
                  <option value="DITOLAK">Tolak Laporan (Fiktif / Luar Wilayah)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tindakan Lapangan <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={keteranganAction}
                  onChange={(e) => setKeteranganAction(e.target.value)}
                  placeholder="Contoh: Tim regu 3 telah membersihkan 2 ton sampah liar dan memasang papan larangan buang sampah..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Foto Bukti Hasil Pembersihan (Before-After)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotoTindakan(e.target.files[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-civic-50 file:text-civic-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-civic-700 hover:bg-civic-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Simpan Tindakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANK SAMPAH MODAL */}
      {selectedPickup && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Verifikasi Timbangan: <span className="font-mono text-civic-700">{selectedPickup.kode_transaksi}</span>
            </h3>

            <p className="text-xs text-slate-600">
              Kategori: <strong>{selectedPickup.nama_kategori}</strong>. Masukkan berat riil hasil timbangan untuk menghitung poin warga.
            </p>

            <form onSubmit={handlePickupComplete} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Berat Aktual Timbangan (Kg) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Penimbangan</label>
                <input
                  type="text"
                  value={catatanMitra}
                  onChange={(e) => setCatatanMitra(e.target.value)}
                  placeholder="Contoh: Sampah bersih, kardus kering"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPickup(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pickupLoading}
                  className="px-4 py-2 bg-civic-700 hover:bg-civic-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  {pickupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Selesaikan & Berikan Poin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
