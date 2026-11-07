import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Forbidden403({ requiredRoles = [] }) {
  const { user, logout, setLoginModalOpen } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white max-w-lg w-full p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            Peringatan Otorisasi (403 Forbidden)
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Akses Terbatas: Khusus Pengurus Lingkungan
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Halaman ini membutuhkan hak akses khusus ({requiredRoles.join(' / ')}).{' '}
            {user ? (
              <>
                Saat ini Anda masuk sebagai <strong className="text-slate-800 capitalize">{user.nama} ({user.role})</strong>.
              </>
            ) : (
              'Anda belum masuk ke dalam sistem.'
            )}
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800">Petunjuk Akses:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            <li><strong>Warga Lingkungan:</strong> Silakan akses layanan di halaman Beranda, Lapor Sampah Liar, atau Bank Sampah.</li>
            <li><strong>Petugas RT/RW:</strong> Masuk menggunakan akun petugas (contoh: <code className="text-civic-700 font-mono">petugas.rw05@trashmanage.com</code>).</li>
            <li><strong>Admin Koordinator:</strong> Masuk menggunakan akun admin (<code className="text-civic-700 font-mono">admin@trashmanage.com</code>).</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Link
            to="/"
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>

          {user ? (
            <button
              type="button"
              onClick={() => {
                logout();
                setLoginModalOpen(true);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-civic-700 hover:bg-civic-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              Ganti Akun Petugas
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-civic-700 hover:bg-civic-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
            >
              <LogIn className="w-4 h-4" />
              Masuk Sekarang
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
