import React, { useState, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { compressImage, compressAndWatermarkImage } from '../utils/imageCompressor';
import { ShieldAlert, Camera, MapPin, CheckCircle, Copy, Check, ArrowRight, Loader2, ExternalLink } from 'lucide-react';

export default function LaporSampahLiar() {
  const { user } = useAuth();

  // Admin berfokus pada pengawasan, metrik dan moderasi di dashboard, bukan membuat aduan publik
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const [formData, setFormData] = useState({
    nama_pelapor: '',
    nomor_kontak: '',
    alamat_lokasi: '',
    kota: 'Surabaya',
    kecamatan: '',
    kelurahan: '',
    latitude: '-7.31820000',
    longitude: '112.78450000',
    deskripsi_kejadian: ''
  });

  const fileInputRef = useRef(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      nama_pelapor: user?.nama || '',
      nomor_kontak: user?.profile?.no_telp || '',
      alamat_lokasi: '',
      kota: 'Surabaya',
      kecamatan: '',
      kelurahan: '',
      latitude: '-7.31820000',
      longitude: '112.78450000',
      deskripsi_kejadian: ''
    });
    setFotoFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressAndWatermarkImage(file, {
          latitude: formData.latitude || '-7.318210',
          longitude: formData.longitude || '112.784530',
          tag: 'BUKTI LAPORAN SAMPAH LIAR',
          wilayah: `RT ${formData.rt || '03'} / RW ${formData.rw || '05'}`
        }, { maxWidth: 1280, quality: 0.82 });
        setFotoFile(compressed);
        setPreviewUrl(URL.createObjectURL(compressed));
        setErrorMsg('');
      } catch (err) {
        setFotoFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  const handleGetLocation = () => {
    setGeoLoading(true);

    const applyCoords = (lat, lng) => {
      setFormData((prev) => ({
        ...prev,
        latitude: Number(lat).toFixed(8),
        longitude: Number(lng).toFixed(8)
      }));
      setGeoLoading(false);
    };

    // 1. Coba GPS browser jika diizinkan
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyCoords(pos.coords.latitude, pos.coords.longitude);
        },
        async (err) => {
          console.warn('GPS hardware dibatasi (pada HTTP IP publik):', err.message);
          // 2. Fallback via IP Geolocation jika GPS diblokir oleh browser pada HTTP
          try {
            const res = await fetch('https://ipwho.is/').then((r) => r.json());
            if (res && res.latitude && res.longitude) {
              applyCoords(res.latitude, res.longitude);
              return;
            }
          } catch (_) {}
          // 3. Fallback default presisi area lingkungan RW 05
          applyCoords(-7.31820000, 112.78450000);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      applyCoords(-7.31820000, 112.78450000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fotoFile) {
      setErrorMsg('Foto bukti tumpukan sampah wajib diunggah.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key] || '');
      });
      data.append('file_foto', fotoFile);

      const res = await api.submitIllegalReport(data);
      setSuccessResult(res);
      resetForm();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengirim laporan.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (successResult?.kode_tiket) {
      navigator.clipboard.writeText(successResult.kode_tiket);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (successResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Laporan Berhasil Terkirim</h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Terima kasih atas kepedulian Anda terhadap kebersihan lingkungan. Laporan telah masuk ke sistem dan siap ditindaklanjuti oleh petugas terkait.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-w-sm mx-auto">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kode Tiket Pelacakan Anda</span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 tracking-wider">
                {successResult.kode_tiket}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Salin Kode Tiket"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && <span className="text-xs text-emerald-600 font-medium block">Kode berhasil disalin!</span>}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/lacak?code=${encodeURIComponent(successResult.kode_tiket)}`}
              className="px-6 py-2.5 bg-civic-700 hover:bg-civic-800 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 min-h-[44px]"
            >
              Pantau Status Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccessResult(null);
                resetForm();
              }}
              className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm min-h-[44px]"
            >
              Kirim Laporan Lainnya
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 space-y-2">
        <Link to="/" className="text-xs text-civic-700 hover:underline inline-flex items-center gap-1 font-medium mb-1">
          ← Kembali ke Beranda
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <ShieldAlert className="w-7 h-7 text-rose-600" />
          Form Pelaporan Sampah Liar
        </h1>
        <p className="text-sm text-slate-600">
          Laporkan tumpukan sampah liar atau pembuangan sampah ilegal. Laporan ini dapat diisi tanpa membuat akun.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
        {/* Photo Upload with Preview */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-800">
            Foto Bukti Sampah Liar <span className="text-rose-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-civic-500 transition-colors bg-slate-50/50">
            {previewUrl ? (
              <div className="space-y-3 text-center">
                <img src={previewUrl} alt="Pratinjau Bukti Sampah" className="max-h-56 mx-auto rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setFotoFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-xs text-rose-600 hover:underline font-medium"
                >
                  Ganti Foto
                </button>
              </div>
            ) : (
              <div className="space-y-1 text-center">
                <Camera className="mx-auto h-10 w-10 text-slate-400" />
                <div className="flex text-sm text-slate-600">
                  <label
                    htmlFor="file_foto"
                    className="relative cursor-pointer font-medium text-civic-700 hover:text-civic-800 focus-within:outline-none"
                  >
                    <span>Unggah foto dari perangkat</span>
                    <input
                      ref={fileInputRef}
                      id="file_foto"
                      name="file_foto"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500">Maksimal 5 MB (Format JPG, PNG, WEBP)</p>
              </div>
            )}
          </div>
        </div>

        {/* Identity & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Nama Pelapor <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <input
              type="text"
              value={formData.nama_pelapor}
              onChange={(e) => setFormData({ ...formData, nama_pelapor: e.target.value })}
              placeholder="Contoh: Budi Santoso (Atau biarkan kosong)"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Nomor WhatsApp / HP Aktif <span className="text-rose-600">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.nomor_kontak}
              onChange={(e) => setFormData({ ...formData, nomor_kontak: e.target.value })}
              placeholder="Contoh: 081234567890"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
            />
          </div>
        </div>

        {/* Location Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Kota / Kabupaten <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.kota}
                onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px] bg-white"
              >
                <option value="Surabaya">Kota Surabaya</option>
                <option value="Sidoarjo">Kabupaten Sidoarjo</option>
                <option value="Gresik">Kabupaten Gresik</option>
                <option value="Malang">Kota Malang</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Kecamatan <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                placeholder="Contoh: Rungkut"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Patokan Alamat Lokasi Sampah <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.alamat_lokasi}
              onChange={(e) => setFormData({ ...formData, alamat_lokasi: e.target.value })}
              placeholder="Contoh: Jl. Wonorejo Timur samping jembatan dekat pos ronda"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
            />
          </div>

          {/* Coordinates & GPS */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-civic-700" />
                Koordinat Peta (Latitude & Longitude)
              </span>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={geoLoading}
                className="text-xs font-medium text-civic-700 hover:text-civic-800 underline flex items-center gap-1"
              >
                {geoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Deteksi Otomatis
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                readOnly
                value={formData.latitude}
                className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-600 font-mono"
                title="Latitude"
              />
              <input
                type="text"
                readOnly
                value={formData.longitude}
                className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-600 font-mono"
                title="Longitude"
              />
            </div>

            {/* Google Maps Preview Embed */}
            {formData.latitude && formData.longitude && (
              <div className="mt-2 pt-2 border-t border-slate-200/80 space-y-1.5">
                <div className="h-44 sm:h-52 w-full rounded-lg overflow-hidden border border-slate-200 shadow-xs relative bg-slate-100">
                  <iframe
                    title="Pratinjau Peta Lokasi Sampah"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${formData.latitude},${formData.longitude}&hl=id&z=16&output=embed`}
                  ></iframe>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Pin titik lokasi akurat di Google Maps
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-civic-700 hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    Buka Tab Peta Penuh <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Deskripsi Kondisi Sampah <span className="text-rose-600">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={formData.deskripsi_kejadian}
            onChange={(e) => setFormData({ ...formData, deskripsi_kejadian: e.target.value })}
            placeholder="Jelaskan jenis tumpukan sampah (limbah rumah tangga, puing, plastik) dan apakah menghambat jalan atau saluran air..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg bg-civic-700 hover:bg-civic-800 disabled:opacity-50 text-white font-semibold text-base transition-colors flex items-center justify-center gap-2 min-h-[48px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mengunggah & Mengirim Laporan...
              </>
            ) : (
              'Kirim Laporan Sampah Liar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
