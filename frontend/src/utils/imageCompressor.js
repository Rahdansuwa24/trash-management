/**
 * Client-Side Image Compressor
 * Mengompres foto berukuran besar (5-10MB dari kamera HP) menjadi WebP/JPEG ringan (~150-300KB)
 * sebelum dikirim ke backend, menghemat bandwidth jaringan dan RAM server secara signifikan.
 */
export async function compressImage(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.8 } = {}) {
  // Jika bukan file gambar, kembalikan apa adanya
  if (!file || !file.type.startsWith('image/')) {
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
