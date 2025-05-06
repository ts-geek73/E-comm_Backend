import path from 'path';
import fs from 'fs'
import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './src/uploads/products';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = Date.now() + fileExtension;
    cb(null, fileName);
  },
});


export const upload = multer({ storage });