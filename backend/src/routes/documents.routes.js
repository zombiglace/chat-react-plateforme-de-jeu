const router = require("express").Router();
const multer = require("multer");
const fs = require("fs");
const { protect } = require("../middleware/auth");
const { Document, User } = require("../config/db");

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

router.get("/", protect, async (_, res) => {
  const docs = await Document.findAll({
    include: [{ model: User, as: "uploadedBy", attributes: ["id", "username"] }],
    order: [["createdAt", "DESC"]],
  });
  res.json(docs);
});

router.post("/", protect, upload.single("file"), async (req, res) => {
  const doc = await Document.create({
    name: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    size: req.file.size,
    mimetype: req.file.mimetype,
    uploadedById: req.user.id,
  });
  res.json(doc);
});

module.exports = router;
