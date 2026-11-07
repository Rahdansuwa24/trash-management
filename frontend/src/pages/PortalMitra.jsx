import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import TicketBadge from '../components/TicketBadge';
import { Building2, Truck, Scale, MapPin, Calendar, Clock, CheckCircle, AlertTriangle, ArrowRight, X, Loader2, Image as ImageIcon } from 'lucide-react';

export default function PortalMitra() {
  const [partnerType, setPartnerType] = useState('lapangan'); // 'lapangan' (petugas kebersihan) or 'banksampah'
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modal state for lapangan action
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusAction, setStatusAction] = useState('DALAM_PENANGANAN');
  const [keteranganAction, setKeteranganAction] = useState('');
  const [fotoBuktiFile, setFotoBuktiFile] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Modal state for bank sampah completion
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [beratAktual, setBeratAktual] = useState('');
  const [submittingPickup, setSubmittingPickup] = useState(false);

  useEffect(() => {
    fetchData();
  }, [partnerType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      if (partnerType === 'lapangan') {
        const res = await api.getMitraReports('?status=MENUNGGU_VERIFIKASI,INVESTIGASI,DALAM_PENANGANAN');
        setReports(res.data || []);
      } else {
        const res = await api.getWastePickups('?status=MENUNGGU_PENJEMPUTAN,DIJADWALKAN');
        setPickups(res.data || []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengambil data tugas operasional.');
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    try {
      setSubmittingAction(true);
      const formData = new FormData();
      formData.append('status', statusAction);
      formData.append('keterangan_tindakan', keteranganAction);
      if (fotoBuktiFile) {
        formData.append('file_foto_bukti', fotoBuktiFile);
      }

      await api.submitCleanupAction(selectedReport.id_laporan, formData);
      setSelectedReport(null);
      setKeteranganAction('');
      setFotoBuktiFile(null);
      fetchData();
    } catch (err) {
      alert(`Gagal menyimpan tindakan: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handlePickupComplete = async (e) => {
    e.preventDefault();
    if (!selectedPickup || !beratAktual) return;
    try {
      setSubmittingPickup(true);
      await api.completePickup(selectedPickup.id_transaksi, {
        berat_aktual_kg: parseFloat(beratAktual)
      });
      setSelectedPickup(null);
      setBeratAktual('');
      fetchData();
    } catch (err) {
      alert(`Gagal menyelesaikan penimbangan: ${err.message}`);
    } finally {
      setSubmittingPickup(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-civic-700" />
            Portal Petugas & Pengelola Lingkungan (RT/RW)
          </h1>
          <p className="text-sm text-slate-600">
            Dasbor operasional penanganan aduan sampah liar lingkungan dan verifikasi timbangan unit bank sampah.
          </p>
        </div>

        {/* Partner Role Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setPartnerType('lapangan')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all min-h-[40px] flex items-center gap-1.5 ${
              partnerType === 'lapangan'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-civic-700" />
            Petugas Lapangan (Aduan Liar)
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
            Bank Sampah Unit RT/RW
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-civic-700" />
          <p className="text-sm font-medium">Memuat data penugasan lingkungan...</p>
        </div>
      )}

      {/* VIEW 1: FIELD CLEANUP REPORTS */}
      {!loading && partnerType === 'lapangan' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Aduan Sampah Liar Perlu Penanganan ({reports.length})
            </h2>
            <button
              onClick={fetchData}
              className="text-xs text-civic-700 font-semibold hover:underline"
            >
              Segarkan Data
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada aduan sampah liar yang tertunda.</p>
              <p className="text-xs text-slate-500 mt-1">Seluruh titik aduan lingkungan telah bersih atau tertangani.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((item) => (
                <div key={item.id_laporan} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <div>
                    <div className="h-44 bg-slate-100 relative">
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
                        <span className="text-xs font-mono font-bold text-civic-700 block">{item.kode_tiket}</span>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mt-1">{item.deskripsi_kejadian}</h3>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
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

                  <div className="p-5 pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReport(item);
                        setStatusAction(item.status === 'MENUNGGU_VERIFIKASI' ? 'DALAM_PENANGANAN' : item.status);
                      }}
                      className="w-full py-2.5 px-4 bg-civic-700 hover:bg-civic-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      Tindak Lanjuti Aduan
                      <ArrowRight className="w-4 h-4" />
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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Penyetoran Sampah Warga ({pickups.length})
            </h2>
            <button
              onClick={fetchData}
              className="text-xs text-civic-700 font-semibold hover:underline"
            >
              Segarkan Data
            </button>
          </div>

          {pickups.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada jadwal penimbangan sampah warga.</p>
              <p className="text-xs text-slate-500 mt-1">Semua transaksi penimbangan telah selesai diverifikasi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pickups.map((trx) => (
                <div key={trx.id_transaksi} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono font-bold text-civic-700">{trx.kode_transaksi}</span>
                      <TicketBadge status={trx.status} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">{trx.nama_warga || 'Warga Lingkungan'}</h3>
                      <p className="text-xs text-slate-500">Kategori: <strong className="text-slate-800">{trx.nama_kategori}</strong></p>
                      <p className="text-xs text-slate-500">Estimasi Warga: <strong className="text-slate-800">{trx.estimasi_berat_kg} Kg</strong></p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium text-slate-900">
                        <MapPin className="w-3.5 h-3.5 text-civic-700" />
                        <span>Alamat Penjemputan / Setoran:</span>
                      </div>
                      <p className="pl-5 text-slate-600">{trx.alamat_jemput}, {trx.kecamatan}</p>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPickup(trx);
                        setBeratAktual(trx.estimasi_berat_kg);
                      }}
                      className="w-full py-2.5 px-4 bg-civic-700 hover:bg-civic-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      Verifikasi Timbangan & Beri Poin
                      <Scale className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FIELD ACTION MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Tindak Lanjuti Aduan Lingkungan: <span className="font-mono text-civic-700">{selectedReport.kode_tiket}</span>
            </h3>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Penanganan</label>
                <select
                  value={statusAction}
                  onChange={(e) => setStatusAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="INVESTIGASI">Tahap Investigasi Petugas</option>
                  <option value="DALAM_PENANGANAN">Dalam Penanganan Petugas Kebersihan</option>
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
                  placeholder="Contoh: Petugas kebersihan RT 03 telah mengangkut tumpukan sampah dan membersihkan saluran air..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unggah Foto Lokasi Sesudah Ditangani (Bukti Transparansi)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotoBuktiFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-civic-50 file:text-civic-700 hover:file:bg-civic-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 text-xs font-semibold text-white bg-civic-700 hover:bg-civic-800 rounded-lg min-h-[44px] flex items-center gap-1.5"
                >
                  {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Tindak Lanjut
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

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p>Warga: <strong>{selectedPickup.nama_warga}</strong></p>
              <p>Kategori: <strong>{selectedPickup.nama_kategori}</strong></p>
              <p>Estimasi Warga: <strong>{selectedPickup.estimasi_berat_kg} Kg</strong></p>
            </div>

            <form onSubmit={handlePickupComplete} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hasil Timbangan Aktual (Kg) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={beratAktual}
                  onChange={(e) => setBeratAktual(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  placeholder="Misal: 10.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPickup(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPickup}
                  className="px-5 py-2 text-xs font-semibold text-white bg-civic-700 hover:bg-civic-800 rounded-lg min-h-[44px] flex items-center gap-1.5"
                >
                  {submittingPickup && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Selesaikan & Kirim Poin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
