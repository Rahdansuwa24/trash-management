import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import TicketBadge from '../components/TicketBadge';
import { Search, MapPin, Calendar, User, FileText, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Sparkles, ExternalLink, Truck } from 'lucide-react';

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.includes('/uploads/')) {
    return '/uploads/' + url.split('/uploads/')[1];
  }
  return url;
}

export default function LacakAduan() {
  const [searchParams, setSearchParams] = useSearchParams();
  const codeParam = searchParams.get('code') || searchParams.get('ticket') || '';

  const [inputCode, setInputCode] = useState(codeParam);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ticketData, setTicketData] = useState(null);

  const fetchTicket = async (codeToFetch) => {
    if (!codeToFetch || !codeToFetch.trim()) return;

    try {
      setLoading(true);
      setErrorMsg('');
      setTicketData(null);

      const res = await api.lookupTicket(codeToFetch.trim());
      setTicketData(res.data);
    } catch (err) {
      setErrorMsg(err.message || 'Tiket tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeParam) {
      setInputCode(codeParam);
      fetchTicket(codeParam);
    }
  }, [codeParam]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setSearchParams({ code: inputCode.trim().toUpperCase() });
      fetchTicket(inputCode.trim().toUpperCase());
    }
  };

  const getStepProgress = (status) => {
    switch (status) {
      case 'MENUNGGU_VERIFIKASI':
        return 1;
      case 'INVESTIGASI':
        return 2;
      case 'DALAM_PENANGANAN':
        return 3;
      case 'SELESAI_DIBERSIHKAN':
        return 4;
      default:
        return 1;
    }
  };

  const step = ticketData ? getStepProgress(ticketData.status) : 1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div className="space-y-4">
        <Link to="/" className="text-xs text-civic-700 hover:underline inline-flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Beranda
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pantau Status Aduan Tiket
          </h1>
          <p className="text-sm text-slate-600">
            Masukkan kode tiket laporan Anda untuk melihat progres investigasi dan penanganan oleh petugas.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Contoh: LAPOR-2611-8921"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-civic-700 hover:bg-civic-800 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 min-h-[44px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cari'}
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-civic-700 animate-spin mx-auto" />
          <p className="text-sm text-slate-600 font-medium">Mengambil data status aduan...</p>
        </div>
      )}

      {/* Error / Not Found State */}
      {!loading && errorMsg && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Tiket Tidak Ditemukan</h3>
          <p className="text-sm text-rose-700 max-w-md mx-auto">{errorMsg}</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setInputCode('LAPOR-2611-8921');
                setSearchParams({ code: 'LAPOR-2611-8921' });
                fetchTicket('LAPOR-2611-8921');
              }}
              className="text-xs font-semibold text-civic-700 hover:underline"
            >
              Coba gunakan kode tiket demo bawaan: LAPOR-2611-8921
            </button>
          </div>
        </div>
      )}

      {/* Initial Empty State */}
      {!loading && !ticketData && !errorMsg && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700">Belum Ada Tiket yang Dipilih</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ketik kode tiket di atas atau masukkan kode demo <strong className="text-slate-700">LAPOR-2611-8921</strong> untuk melihat contoh tampilan status penanganan.
          </p>
        </div>
      )}

      {/* Ticket Details View */}
      {!loading && ticketData && (
        <div className="space-y-6">
          {/* Main Card Header */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kode Tiket</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {ticketData.kode_tiket}
                </h2>
              </div>
              <div>
                <TicketBadge status={ticketData.status} />
              </div>
            </div>

            {/* Step Progress Tracker */}
            <div className="py-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-4">
                Tahapan Penanganan
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                {[
                  { num: 1, title: 'Laporan Masuk', desc: 'Verifikasi berkas' },
                  { num: 2, title: 'Investigasi', desc: 'Pengecekan lapangan' },
                  { num: 3, title: 'Armada Dikirim', desc: 'Proses pembersihan' },
                  { num: 4, title: 'Selesai', desc: 'Lokasi bersih' }
                ].map((s) => {
                  const isDone = step >= s.num;
                  const isCurrent = step === s.num;
                  return (
                    <div
                      key={s.num}
                      className={`p-3 rounded-xl border text-left sm:text-center transition-colors ${
                        isCurrent
                          ? 'border-civic-600 bg-civic-50 text-civic-900 font-semibold'
                          : isDone
                          ? 'border-emerald-200 bg-emerald-50/50 text-slate-800'
                          : 'border-slate-200 bg-slate-50 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center sm:justify-center gap-1.5 mb-1">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isDone ? 'bg-civic-700 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {s.num}
                        </span>
                        <span className="font-bold text-xs">{s.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 hidden sm:block">{s.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2 border-t border-slate-100">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-civic-700 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 block">Lokasi Aduan:</span>
                  <span className="font-medium text-slate-900">{ticketData.alamat_lokasi}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Kec. {ticketData.kecamatan}, {ticketData.kota}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-civic-700 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 block">Waktu Pelaporan:</span>
                  <span className="font-medium text-slate-900">
                    {new Date(ticketData.created_at).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                  {ticketData.penanggung_jawab_dlh && (
                    <span className="text-xs text-civic-700 block mt-0.5 font-medium">
                      Ditangani oleh: {ticketData.penanggung_jawab_dlh}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">Keterangan Pelapor:</span>
              <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 leading-relaxed">
                {ticketData.deskripsi_kejadian}
              </p>
            </div>

            {/* Google Maps Location Embed */}
            {ticketData.latitude && ticketData.longitude && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-civic-700" />
                    Peta Lokasi Titik Sampah Liar
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${ticketData.latitude},${ticketData.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-civic-700 hover:text-civic-800 inline-flex items-center gap-1"
                  >
                    Buka di Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="h-48 sm:h-56 w-full rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100 shadow-xs">
                  <iframe
                    title="Peta Lokasi Aduan"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${ticketData.latitude},${ticketData.longitude}&hl=id&z=16&output=embed`}
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* Photo Evidence & Before-After Comparison */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-civic-700" />
              Bukti Visual & Penanganan Lapangan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Photo 1: Initial Report Photo */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md inline-block">
                  Kondisi Awal (Pelaporan Warga)
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center">
                  {ticketData.foto_bukti_url ? (
                    <img
                      src={resolveImageUrl(ticketData.foto_bukti_url)}
                      alt="Kondisi Awal Sampah"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Tidak ada foto</span>
                  )}
                </div>
              </div>

              {/* Photo 2: After Cleanup Photo */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
                  Kondisi Sesudah (Tindakan Tim DLH)
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center">
                  {ticketData.timeline && ticketData.timeline.find((t) => t.foto_bukti_penanganan_url) ? (
                    <img
                      src={resolveImageUrl(ticketData.timeline.find((t) => t.foto_bukti_penanganan_url).foto_bukti_penanganan_url)}
                      alt="Hasil Pembersihan DLH"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  ) : (
                    <div className="text-center p-4 space-y-1">
                      <Truck className="w-8 h-8 text-slate-300 mx-auto" />
                      <span className="text-xs text-slate-500 block">Armada sedang dijadwalkan ke lokasi</span>
                      <span className="text-[11px] text-slate-400 block">Foto hasil pembersihan akan muncul setelah tim menyelesaikan tugas</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action History Log */}
          {ticketData.timeline && ticketData.timeline.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Catatan Tindakan Petugas Lapangan</h3>
              <div className="space-y-3">
                {ticketData.timeline.map((act) => (
                  <div key={act.id_tindak_lanjut} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-civic-800">{act.dilakukan_oleh}</span>
                      <span className="text-slate-400">
                        {new Date(act.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{act.keterangan_tindakan}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
