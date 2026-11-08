import React, { useEffect } from 'react';
import { X, Printer, CheckCircle, Scale, Building2 } from 'lucide-react';

export default function DigitalReceiptModal({ transaction, onClose }) {
  if (!transaction) return null;

  // Tutup modal jika tombol Escape ditekan
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';
  };

  const renderAddress = () => {
    const addr = transaction.alamat_jemput || '';
    const rtRwInfo = `RT ${transaction.rt || '03'} / RW ${transaction.rw || '05'}`;
    if (addr.includes('RT') || addr.includes('RW')) {
      return addr;
    }
    return `${addr} (${rtRwInfo})`;
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
    `TRASHMANAGE-VERIFIED:${transaction.kode_transaksi}:${transaction.berat_aktual_kg || transaction.estimasi_berat_kg}KG:${transaction.total_poin_diperoleh}PTS`
  )}`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Sticky & Always Visible at top, hidden during print) */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-3 flex justify-between items-center shrink-0 border-b border-slate-800 print:hidden z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Scale className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Struk Bukti Penimbangan Digital Resmi</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-civic-700 hover:bg-civic-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs min-h-[34px]"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container (Scrolls smoothly if screen height is constrained) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 text-slate-800 font-sans print:p-0 print:overflow-visible">
          {/* Header Lembaga */}
          <div className="text-center border-b-2 border-slate-900 pb-3.5 space-y-1">
            <div className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-civic-800 tracking-wider uppercase">
              <Building2 className="w-3.5 h-3.5 text-civic-700" />
              Sistem Pengelolaan Sampah Mandiri RW 05
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              BANK SAMPAH UNIT KOMUNITAS
            </h2>
            <p className="text-xs text-slate-500">
              Kelurahan Kalirungkut, Kecamatan Rungkut, Kota Surabaya
            </p>
            <p className="text-[11px] font-mono text-slate-400 pt-0.5">
              Surat Tanda Terima & Nota Kredit Poin Tabungan Lingkungan
            </p>
          </div>

          {/* Meta Transaksi */}
          <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-3 gap-3">
            <div className="space-y-1">
              <p className="text-slate-500">Nomor Transaksi:</p>
              <p className="font-mono font-bold text-sm text-slate-900">{transaction.kode_transaksi}</p>
              <p className="text-slate-500 pt-1">Tanggal & Waktu:</p>
              <p className="font-medium text-slate-800">{formatDate(transaction.tanggal_selesai || transaction.tanggal_transaksi)}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-slate-500">Petugas Penimbang:</p>
              <p className="font-bold text-slate-900">{transaction.nama_mitra || 'Bank Sampah Unit RT 03'}</p>
              <p className="text-slate-500 pt-1">Armada / Kontak:</p>
              <p className="font-medium text-slate-800">{transaction.kontak_mitra || '0856-7890-1234'}</p>
            </div>
          </div>

          {/* Rincian Penimbangan */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rincian Penyetoran Sampah</h4>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-semibold text-slate-700">Kategori Sampah Anorganik:</span>
                <strong className="text-slate-900">{transaction.nama_kategori}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Estimasi Pengajuan Warga:</span>
                <span className="text-slate-800">{transaction.estimasi_berat_kg} Kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-900">Berat Timbangan Aktual (Sertifikasi):</span>
                <span className="font-extrabold text-base text-slate-900">{transaction.berat_aktual_kg || transaction.estimasi_berat_kg} Kg</span>
              </div>
              <div className="flex justify-between py-1 pt-1.5">
                <span className="font-semibold text-civic-800">Total Poin Tabungan Diperoleh:</span>
                <span className="font-extrabold text-base text-emerald-600">+{transaction.total_poin_diperoleh} Poin</span>
              </div>
            </div>
          </div>

          {/* Lokasi Penjemputan & Catatan */}
          <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="font-semibold text-slate-800">Alamat Penyetor:</p>
            <p>{renderAddress()}</p>
            {transaction.catatan_mitra && (
              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200 mt-1">
                Catatan: {transaction.catatan_mitra}
              </p>
            )}
          </div>

          {/* QR Code & Tanda Tangan */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <img
                src={qrUrl}
                alt="QR Code Verifikasi"
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg border border-slate-200 p-1 bg-white shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="text-[11px] text-slate-500 leading-tight">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Terverifikasi Sah
                </p>
                <p>Poin telah tercatat di</p>
                <p>Buku Besar Komunitas RW 05</p>
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-500 space-y-6 pr-2">
              <p>Petugas Penimbang</p>
              <p className="font-semibold text-slate-900 border-t border-slate-400 pt-0.5 whitespace-nowrap">
                {transaction.nama_mitra || 'Pengurus Bank Sampah'}
              </p>
            </div>
          </div>

          <p className="text-[10px] text-center text-slate-400 pt-1.5 border-t border-slate-100">
            Struk ini sah dan diterbitkan secara digital oleh Sistem Manajemen Sampah RW 05 Kalirungkut.
          </p>
        </div>
      </div>
    </div>
  );
}
