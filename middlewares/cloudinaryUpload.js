const multer = require("multer");
const cloudinary = require("./../utils/cloudinary");

// For older versions (v1.x)
const storage = require("multer-storage-cloudinary");

const cloudinaryStorage = storage({
  cloudinary: cloudinary,
  params: {
    folder: "hekopay_logos",
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
    public_id: (req, file) => `user_${req.params.id}_logo`,
  },
});

const upload = multer({ storage: cloudinaryStorage });

module.exports = upload;