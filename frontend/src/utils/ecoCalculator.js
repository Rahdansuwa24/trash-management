/**
 * KLHK Ecological Impact Calculator
 * Berdasarkan Pedoman Penghitungan Reduksi Emisi GRK Sektor Pengelolaan Sampah (Permen LHK No. 14/2021)
 * dan Standar Edukasi Sirkular Bank Sampah Komunitas Indonesia.
 */

// Faktor emisi tercegah (kg CO2e per kg sampah terdaur ulang)
const EMISSION_FACTORS = {
  plastik: 2.15,
  kertas: 1.35,
  kardus: 1.35,
  logam: 4.80,
  besi: 4.80,
  aluminium: 8.20,
  minyak: 2.65,
  elektronik: 8.50,
  default: 2.15
};

/**
 * Hitung kalkulasi dampak ekologis dari total berat sampah terkelola
 * @param {number} totalKg - Total berat sampah anorganik terdaur ulang (kg)
 * @param {Object} breakdown - Rincian berat per kategori opsional
 */
export function calculateEcoImpact(totalKg = 0, breakdown = {}) {
  const kg = Math.max(0, Number(totalKg) || 0);

  // 1. Reduksi Emisi Karbon (kg CO2e)
  let co2AvoidedKg = 0;
  if (breakdown && Object.keys(breakdown).length > 0) {
    for (const [kategori, weight] of Object.entries(breakdown)) {
      const lower = kategori.toLowerCase();
      let factor = EMISSION_FACTORS.default;
      for (const [key, val] of Object.entries(EMISSION_FACTORS)) {
        if (lower.includes(key)) {
          factor = val;
          break;
        }
      }
      co2AvoidedKg += (Number(weight) || 0) * factor;
    }
  } else {
    co2AvoidedKg = kg * EMISSION_FACTORS.default;
  }

  // 2. Air Bersih Terlindungi (Liter)
  // Tiap 1 kg/liter minyak jelantah melindungi 1.000 liter air tanah. Untuk campuran rata-rata daur ulang: ~35L air per kg
  const jelantahKg = breakdown?.minyak ? Number(breakdown.minyak) : (kg * 0.12);
  const waterSavedLiters = Math.round((jelantahKg * 1000) + (kg * 35));

  // 3. Pohon Terselamatkan (Setara Pohon Dewasa Menyerap CO2 per Tahun)
  // Rata-rata 1 pohon dewasa menyerap 21.77 kg CO2 per tahun
  const treesSaved = (co2AvoidedKg / 21.77).toFixed(1);

  // 4. Energi Listrik Terselamatkan (kWh)
  // Rata-rata daur ulang anorganik menghemat ~1.4 kWh per kg
  const energySavedKwh = (kg * 1.42).toFixed(1);

  // 5. Tingkat Diversi TPA Lingkungan RW 05
  // Estimasi timbulan sampah bulanan kawasan RW 05 (5 RT x 120 KK x 0.7 kg/hari x 30 hari = ~12.600 kg/bln)
  const monthlyBaselineWasteKg = 12600;
  const diversionRate = Math.min(100, (kg / monthlyBaselineWasteKg) * 100).toFixed(1);

  return {
    totalWasteKg: kg.toFixed(2),
    co2AvoidedKg: co2AvoidedKg.toFixed(1),
    co2AvoidedTons: (co2AvoidedKg / 1000).toFixed(3),
    waterSavedLiters: waterSavedLiters.toLocaleString('id-ID'),
    waterSavedLitersRaw: waterSavedLiters,
    treesSaved: Number(treesSaved),
    energySavedKwh: Number(energySavedKwh),
    diversionRate: Number(diversionRate)
  };
}
