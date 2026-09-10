import multer from "multer";
import supabase from "../lib/supabase.js";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadToSupabase = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const { data, error } = await supabase.storage
      .from("files") // 👈 changed
      .upload(`thumbnails/${fileName}`, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("files") // 👈 changed
      .getPublicUrl(`thumbnails/${fileName}`);

    req.fileUrl = urlData.publicUrl;
    next();
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};
