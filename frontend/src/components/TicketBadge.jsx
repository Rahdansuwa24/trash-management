import React from 'react';
import { Clock, Search, Truck, CheckCircle, XCircle } from 'lucide-react';

const statusConfig = {
  // Illegal Report Statuses
  MENUNGGU_VERIFIKASI: {
    label: 'Menunggu Verifikasi',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock
  },
  INVESTIGASI: {
    label: 'Tahap Investigasi',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Search
  },
  DALAM_PENANGANAN: {
    label: 'Dalam Penanganan Armada',
    classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Truck
  },
  SELESAI_DIBERSIHKAN: {
    label: 'Selesai Dibersihkan',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle
  },
  DITOLAK: {
    label: 'Laporan Ditolak',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle
  },

  // Waste Bank Transaction Statuses
  MENUNGGU_PENJEMPUTAN: {
    label: 'Menunggu Penjemputan',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock
  },
  DIKONFIRMASI_MITRA: {
    label: 'Dikonfirmasi Mitra',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Truck
  },
  SELESAI: {
    label: 'Selesai & Poin Diberikan',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle
  },
  DIBATALKAN: {
    label: 'Dibatalkan',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle
  }
};

export default function TicketBadge({ status }) {
  const config = statusConfig[status] || {
    label: status || 'Status Tidak Diketahui',
    classes: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: Clock
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.classes}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
