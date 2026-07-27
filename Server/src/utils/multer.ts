import multer from "multer";

// Memory storage instead of the old disk storage: files are streamed
// straight to Cloudinary from the buffer, so there's no temp file left
// behind on disk to clean up (the previous version wrote every upload
// into Server/uploads and never deleted it afterwards).
const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
