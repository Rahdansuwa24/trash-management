const multer = require('multer');

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'video/mp4',
  'video/webm'
];

function fileFilter(req, file, cb) {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipe berkas tidak didukung: ${file.mimetype}. Gunakan JPG, PNG, WEBP, atau MP4.`), false);
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max per file as specified in rule 2.4
  },
  fileFilter
});

function handleUploadError(middleware) {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Ukuran file melebihi batas maksimal 5 MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Kesalahan unggah: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
}

module.exports = {
  uploadSingle: (fieldName) => handleUploadError(upload.single(fieldName)),
  uploadFields: (fieldsArray) => handleUploadError(upload.fields(fieldsArray))
};
