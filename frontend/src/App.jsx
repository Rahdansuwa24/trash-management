import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';

import Home from './pages/Home';
import LaporSampahLiar from './pages/LaporSampahLiar';
import LacakAduan from './pages/LacakAduan';
import SetorSampah from './pages/SetorSampah';
import PortalMitra from './pages/PortalMitra';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lapor" element={<LaporSampahLiar />} />
            <Route path="/lacak" element={<LacakAduan />} />
            <Route path="/setor" element={<SetorSampah />} />
            <Route path="/mitra" element={<PortalMitra />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
        <LoginModal />
      </div>
    </AuthProvider>
  );
}
