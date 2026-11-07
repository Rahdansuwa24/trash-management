import React from 'react';
import { Recycle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <div className="w-7 h-7 rounded bg-civic-600 flex items-center justify-center text-white">
                <Recycle className="w-4 h-4" />
              </div>
              TrashManage
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Inisiatif digital untuk kebersihan lingkungan dan ekonomi sirkular berbasis komunitas RT/RW. Mempermudah warga memantau kebersihan dan menabung sampah bernilai ekonomis.
            </p>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-3 tracking-wider uppercase">Layanan Warga</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/lapor" className="hover:text-white transition-colors">Pelaporan Sampah Liar Lingkungan</a>
              </li>
              <li>
                <a href="/lacak" className="hover:text-white transition-colors">Pantau Status Aduan Tiket</a>
              </li>
              <li>
                <a href="/setor" className="hover:text-white transition-colors">Setor Sampah ke Bank Sampah RT/RW</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-3 tracking-wider uppercase">Pengelolaan Lingkungan</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-2">
              Dikelola secara mandiri oleh tim pengurus RT/RW dan unit bank sampah lingkungan setempat.
            </p>
            <div className="text-xs text-slate-500">
              Sistem Operasional Lingkungan (Versi 1.0.0)
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} TrashManage. Inisiatif Pengelolaan Sampah Komunitas RT/RW.</p>
          <div className="flex gap-4">
            <span>Standar Aksesibilitas WCAG AA</span>
            <span>Amanah & Transparan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
