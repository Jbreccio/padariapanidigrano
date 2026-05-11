import multer from 'multer';

// 🔐 filtro
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Formato inválido'), false);
  }

  cb(null, true);
};

// 🚀 storage em memória (IMPORTANTE)
export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});