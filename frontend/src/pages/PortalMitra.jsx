import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import TicketBadge from '../components/TicketBadge';
import { useAuth } from '../context/AuthContext';
import { Building2, Truck, Scale, MapPin, Calendar, CheckCircle, AlertTriangle, ArrowRight, Loader2, Image as ImageIcon, UserCheck, Phone, Check } from 'lucide-react';

export default function PortalMitra() {
  const { user } = useAuth();
  const isSatgas = user?.email?.includes('petugas') || user?.nama?.toLowerCase().includes('satgas');
  const [partnerType, setPartnerType] = useState(isSatgas ? 'lapangan' : 'banksampah'); // default to 'lapangan' for satgas, or 'banksampah'
  const [pickupFilter, setPickupFilter] = useState('ALL'); // 'ALL', 'OPEN', 'MY_TASKS'
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal state for lapangan action
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusAction, setStatusAction] = useState('DALAM_PENANGANAN');
  const [keteranganAction, setKeteranganAction] = useState('');
  const [fotoBuktiFile, setFotoBuktiFile] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Modal state for bank sampah completion
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [beratAktual, setBeratAktual] = useState('');
  const [catatanMitra, setCatatanMitra] = useState('');
  const [submittingPickup, setSubmittingPickup] = useState(false);
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    if (user) {
      const satgas = user?.email?.includes('petugas') || user?.nama?.toLowerCase().includes('satgas');
      if (satgas) {
        setPartnerType('lapangan');
      }
    }
  }, [user]);

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
        const res = await api.getWastePickups();
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
        formData.append('file_foto_tindakan', fotoBuktiFile);
      }

      await api.submitCleanupAction(selectedReport.id_laporan, formData);
      setSelectedReport(null);
      setKeteranganAction('');
      setFotoBuktiFile(null);
      setSuccessMsg(`Tindakan untuk laporan ${selectedReport.kode_tiket} berhasil disimpan.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (err) {
      alert(`Gagal menyimpan tindakan: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleClaimPickup = async (trx) => {
    try {
      setClaimingId(trx.id_transaksi);
      const res = await api.claimPickup(trx.id_transaksi);
      setSuccessMsg(res.message || 'Tugas penjemputan berhasil Anda klaim.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (err) {
      alert(`Gagal mengklaim tugas: ${err.message}`);
    } finally {
      setClaimingId(null);
    }
  };

  const handlePickupComplete = async (e) => {
    e.preventDefault();
    if (!selectedPickup || !beratAktual) return;
    try {
      setSubmittingPickup(true);
      await api.completePickup(selectedPickup.id_transaksi, {
        berat_aktual_kg: parseFloat(beratAktual),
        catatan_mitra: catatanMitra.trim() || undefined
      });
      setSelectedPickup(null);
      setBeratAktual('');
      setCatatanMitra('');
      setSuccessMsg(`Penimbangan ${selectedPickup.kode_transaksi} selesai diverifikasi dan poin telah dikreditkan ke warga.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (err) {
      alert(`Gagal menyelesaikan penimbangan: ${err.message}`);
    } finally {
      setSubmittingPickup(false);
    }
  };

  // Filter pickups
  const filteredPickups = pickups.filter(p => {
    if (pickupFilter === 'OPEN') return p.status === 'MENUNGGU_PENJEMPUTAN';
    if (pickupFilter === 'MY_TASKS') return p.status === 'DIKONFIRMASI_MITRA' || p.status === 'SELESAI';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-civic-700" />
            Portal Petugas & Mitra Pengelola Lingkungan (RT/RW)
          </h1>
          <p className="text-sm text-slate-600">
            Dasbor operasional penjemputan sampah warga berbasis dispatching & verifikasi timbangan unit RT 01-05 RW 05.
          </p>
        </div>

        {/* Partner Role Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-stretch sm:self-auto">
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
            Satgas Kebersihan Lapangan
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

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

      {/* VIEW 2: BANK SAMPAH PICKUPS & LOGISTICS DISPATCH */}
      {!loading && partnerType === 'banksampah' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Logistik & Penjemputan Sampah Warga ({filteredPickups.length})
              </h2>
              <p className="text-xs text-slate-500">Klaim tugas penjemputan warga di lingkungan RT Anda sebelum melakukan penimbangan.</p>
            </div>

            {/* Sub-Filter Tabs */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setPickupFilter('ALL')}
                  className={`px-3 py-1.5 rounded-md transition-all ${pickupFilter === 'ALL' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Semua ({pickups.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPickupFilter('OPEN')}
                  className={`px-3 py-1.5 rounded-md transition-all ${pickupFilter === 'OPEN' ? 'bg-amber-500 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Perlu Dijemput ({pickups.filter(p => p.status === 'MENUNGGU_PENJEMPUTAN').length})
                </button>
                <button
                  type="button"
                  onClick={() => setPickupFilter('MY_TASKS')}
                  className={`px-3 py-1.5 rounded-md transition-all ${pickupFilter === 'MY_TASKS' ? 'bg-civic-700 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Tugas Saya ({pickups.filter(p => p.status === 'DIKONFIRMASI_MITRA' || p.status === 'SELESAI').length})
                </button>
              </div>

              <button
                onClick={fetchData}
                className="text-xs text-civic-700 font-semibold hover:underline px-2 py-1"
              >
                Segarkan
              </button>
            </div>
          </div>

          {filteredPickups.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada tugas penjemputan pada filter ini.</p>
              <p className="text-xs text-slate-500 mt-1">Pilih filter 'Semua' untuk melihat seluruh riwayat penjemputan unit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPickups.map((trx) => {
                const isWaitingPickup = trx.status === 'MENUNGGU_PENJEMPUTAN';
                const isConfirmed = trx.status === 'DIKONFIRMASI_MITRA';
                const isDone = trx.status === 'SELESAI';

                return (
                  <div key={trx.id_transaksi} className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors ${isWaitingPickup ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-mono font-bold text-civic-700">{trx.kode_transaksi}</span>
                        <TicketBadge status={trx.status} />
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900">{trx.nama_warga || 'Warga Lingkungan'}</h3>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                          <span>Kategori: <strong className="text-slate-800">{trx.nama_kategori}</strong></span>
                          <span>Estimasi: <strong className="text-slate-800">{trx.estimasi_berat_kg} Kg</strong></span>
                          {trx.poin_per_kg && (
                            <span className="text-civic-700 font-semibold">({trx.poin_per_kg} Poin/Kg)</span>
                          )}
                        </div>
                      </div>

                      {/* Info Kontak & Alamat Warga */}
                      <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-600 border border-slate-100">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          <MapPin className="w-3.5 h-3.5 text-civic-700 shrink-0" />
                          <span>Alamat: RT {trx.rt || '03'} / RW {trx.rw || '05'}</span>
                        </div>
                        <p className="pl-5 text-slate-600">{trx.alamat_jemput}</p>
                        {trx.kontak_warga && (
                          <div className="pl-5 flex items-center gap-1 text-slate-700 pt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>WA/Telp: <strong>{trx.kontak_warga}</strong></span>
                          </div>
                        )}
                        {trx.catatan_warga && (
                          <p className="pl-5 text-slate-500 italic text-[11px]">"{trx.catatan_warga}"</p>
                        )}
                      </div>

                      {/* Petugas Status Banner */}
                      {trx.nama_mitra && (
                        <div className="p-2.5 bg-civic-50 rounded-xl border border-civic-200 text-xs text-civic-900 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-civic-700 shrink-0" />
                          <div>
                            <p className="font-semibold">{trx.nama_mitra}</p>
                            <p className="text-[11px] text-civic-700">Petugas Armada: {trx.nama_petugas || 'Petugas Bank Sampah'}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons based on Dispatch State */}
                    <div>
                      {isWaitingPickup ? (
                        <button
                          type="button"
                          disabled={claimingId === trx.id_transaksi}
                          onClick={() => handleClaimPickup(trx)}
                          className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-xs"
                        >
                          {claimingId === trx.id_transaksi ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                          Ambil Tugas Penjemputan
                        </button>
                      ) : isConfirmed ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPickup(trx);
                            setBeratAktual(trx.estimasi_berat_kg);
                            setCatatanMitra('');
                          }}
                          className="w-full py-2.5 px-4 bg-civic-700 hover:bg-civic-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                        >
                          Verifikasi Timbangan & Beri Poin
                          <Scale className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="py-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          Selesai ({trx.berat_aktual_kg || trx.estimasi_berat_kg} Kg • +{trx.total_poin_diperoleh} Poin)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* BANK SAMPAH VERIFICATION MODAL */}
      {selectedPickup && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Verifikasi Timbangan: <span className="font-mono text-civic-700">{selectedPickup.kode_transaksi}</span>
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Warga Penyetor:</span>
                <strong className="text-slate-900">{selectedPickup.nama_warga}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori Sampah:</span>
                <strong className="text-slate-900">{selectedPickup.nama_kategori}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimasi Awal:</span>
                <span className="text-slate-700">{selectedPickup.estimasi_berat_kg} Kg</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="text-slate-500">Tarif Poin Unit:</span>
                <span className="font-bold text-civic-700">{selectedPickup.poin_per_kg || 15} Poin / Kg</span>
              </div>
            </div>

            <form onSubmit={handlePickupComplete} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hasil Timbangan Aktual (Kg) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={beratAktual}
                  onChange={(e) => setBeratAktual(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-civic-700 focus:outline-hidden"
                  placeholder="Misal: 10.5"
                />
                {beratAktual && !isNaN(parseFloat(beratAktual)) && (
                  <p className="mt-1 text-xs text-civic-700 font-semibold">
                    &rarr; Poin yang akan diterima warga: {Math.floor(parseFloat(beratAktual) * (selectedPickup.poin_per_kg || 15))} Poin
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Petugas (Opsional)
                </label>
                <input
                  type="text"
                  value={catatanMitra}
                  onChange={(e) => setCatatanMitra(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  placeholder="Contoh: Sampah bersih, sudah disortir kardus dan duplex."
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
                  Selesaikan & Terbitkan Struk Resmi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
