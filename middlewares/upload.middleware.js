import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "public/signatures",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

export const uploadSignature = multer({ storage });
