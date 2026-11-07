import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ShieldAlert, Coins, CheckCircle2, ArrowRight, MapPin } from 'lucide-react';

export default function Home() {
  const [ticketInput, setTicketInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const navigate = useNavigate();

  const handleSearchTicket = (e) => {
    e.preventDefault();
    if (!ticketInput.trim()) {
      setSearchError('Silakan masukkan kode tiket terlebih dahulu.');
      return;
    }
    setSearchError('');
    navigate(`/lacak?code=${encodeURIComponent(ticketInput.trim().toUpperCase())}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-civic-50/60 to-transparent pt-12 pb-16 border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-civic-100 text-civic-800 border border-civic-200">
            <span className="w-2 h-2 rounded-full bg-civic-600 animate-pulse"></span>
            Portal Terpadu Smart City & Ekonomi Sirkular
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Pelaporan Sampah Liar & <br className="hidden sm:inline" />
            <span className="text-civic-700">Bank Sampah Komunitas</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
            Laporkan titik sampah liar di sekitar Anda secara cepat tanpa perlu login, atau setorkan sampah daur ulang Anda ke mitra bank sampah untuk mendapatkan poin.
          </p>

          {/* Quick Ticket Lookup Box */}
          <div className="max-w-xl mx-auto mt-8 p-3 sm:p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <form onSubmit={handleSearchTicket} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={ticketInput}
                  onChange={(e) => {
                    setTicketInput(e.target.value);
                    if (searchError) setSearchError('');
                  }}
                  placeholder="Masukkan kode tiket (contoh: LAPOR-2611-8921)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
                  aria-label="Cari kode tiket aduan"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-civic-700 hover:bg-civic-800 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
              >
                Lacak Tiket
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            {searchError && (
              <p className="text-xs text-rose-600 mt-2 text-left">{searchError}</p>
            )}
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
              <span>Ingin mencoba fitur lacak?</span>
              <button
                type="button"
                onClick={() => setTicketInput('LAPOR-2611-8921')}
                className="text-civic-700 hover:underline font-medium"
              >
                Gunakan Kode Demo (LAPOR-2611-8921)
              </button>
            </div>
          </div>

          {/* Direct Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/lapor"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-civic-700 hover:bg-civic-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            >
              <ShieldAlert className="w-4 h-4" />
              Lapor Titik Sampah Liar
            </Link>
            <Link
              to="/setor"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-sm flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            >
              <Coins className="w-4 h-4 text-civic-600" />
              Tukar Sampah Jadi Poin
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Pillar Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Alur Kerja Sederhana dan Bertanggung Jawab
          </h2>
          <p className="text-sm text-slate-600">
            Dirancang untuk menghubungkan warga, pemerintah kota, dan pengepul daur ulang dalam satu wadah.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Aduan Publik Tanpa Login</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Warga dapat langsung mengunggah foto tumpukan sampah liar dan koordinat GPS. Sistem menerbitkan kode tiket acak untuk pemantauan mandiri.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Verifikasi Tim DLH</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Dinas Lingkungan Hidup meninjau laporan, mengirim armada truk pembersih, dan mengunggah foto lokasi sesudah dibersihkan sebagai transparansi publik.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Sirkular Bank Sampah</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sampah rumah tangga seperti plastik botol, kertas kardus, dan minyak jelantah dapat ditukar dengan poin yang tercatat di riwayat mutasi resmi.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Credentials Box for Reviewers */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-slate-200 p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Panduan Uji Coba Portofolio (Data Demo Siap Pakai)
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Gunakan data pengujian berikut untuk meninjau masing-masing peran dan alur sistem:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="text-slate-400 block mb-1">Tiket Aduan Publik:</span>
              <strong className="text-emerald-400 font-mono text-sm">LAPOR-2611-8921</strong>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="text-slate-400 block mb-1">Akun Warga / Bank Sampah:</span>
              <strong className="text-white block">warga.budi@trashmanage.com</strong>
              <span className="text-slate-400">Pass: Password123!</span>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="text-slate-400 block mb-1">Akun DLH (Pemerintah):</span>
              <strong className="text-white block">dlh.surabaya@trashmanage.com</strong>
              <span className="text-slate-400">Pass: Password123!</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
