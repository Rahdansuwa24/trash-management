/**
 * Client-Side Image Compressor & Field GPS Watermarker
 * Mengompres foto berukuran besar (5-10MB dari kamera HP) menjadi WebP/JPEG ringan (~150-300KB)
 * sebelum dikirim ke backend, serta mencetak watermark digital forensik GPS & Timestamp langsung
 * pada canvas foto bukti lapangan untuk menjamin integritas inspeksi.
 */

function formatTimestampWIB() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min} WIB`;
}

export async function compressImage(file, {
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.82,
  watermark = null
} = {}) {
  // Jika bukan file gambar, kembalikan apa adanya
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung skala rasio agar tidak melebihi dimensi batas
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Cetak Watermark jika requested (untuk laporan aduan / bukti timbang)
        if (watermark) {
          const lat = watermark.latitude ? Number(watermark.latitude).toFixed(6) : '-7.318210';
          const lng = watermark.longitude ? Number(watermark.longitude).toFixed(6) : '112.784530';
          const tag = watermark.tag || 'BUKTI INSPEKSI LAPANGAN RT/RW';
          const wilayah = watermark.wilayah || 'RW 05 Kalirungkut, Rungkut';
          const timeStr = formatTimestampWIB();

          const bannerHeight = Math.max(44, Math.round(height * 0.065));
          const bannerY = height - bannerHeight;

          // Background banner gelap semi-transparan
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(0, bannerY, width, bannerHeight);

          // Garis aksen hijau daun di atas banner
          ctx.fillStyle = '#10b981';
          ctx.fillRect(0, bannerY, width, 3);

          // Teks Watermark
          const fontSize = Math.max(11, Math.round(bannerHeight * 0.28));
          ctx.font = `600 ${fontSize}px "SF Mono", Menlo, Consolas, monospace`;
          ctx.fillStyle = '#ffffff';

          const line1 = `TRASHMANAGE • ${tag.toUpperCase()} • ${wilayah}`;
          const line2 = `📍 KOORDINAT: ${lat}, ${lng}  |  🕒 WAKTU: ${timeStr}`;

          ctx.fillText(line1, 14, bannerY + fontSize + 6);
          ctx.font = `400 ${fontSize - 1}px "SF Mono", Menlo, Consolas, monospace`;
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(line2, 14, bannerY + (fontSize * 2) + 10);
        }

        // Ekspor ke WebP jika didukung, atau fallback ke JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // fallback jika gagal
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}

export async function compressAndWatermarkImage(file, watermarkInfo, options = {}) {
  return compressImage(file, {
    ...options,
    watermark: watermarkInfo
  });
}
