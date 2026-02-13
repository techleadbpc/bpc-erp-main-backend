const multer = require("multer");
const fs = require("fs");
// const sharp = require("sharp");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: async (req, file, cb) => {
    const originalFilename = file.originalname;
    // const destinationPath = "uploads/";
    // const filePath = destinationPath + originalFilename;

    // try {
    //   const stats = await fs.promises.stat(filePath);

    //   if (stats.isFile()) {
    //     await fs.promises.unlink(filePath);
    //     const newFilename = originalFilename.replace(/\s/g, "_");
    //     cb(null, newFilename);
    //     return;
    //   } else {
    //   }
    // } catch (err) {
    //   // return err.message;
    // }
    const newFilename = Date.now() + "-" + originalFilename.replace(/\s/g, "_");
    cb(null, newFilename);
  },
});

const upload = multer({
  storage: storage,
});

const processImage = async (req, res, next) => {
  if (req.file) {
    try {
      await sharp(req.file.path)
        .resize({ width: 100, height: 100, fit: "inside" })
        .toFile("./uploads/" + "compressed_" + req.file.filename);
    } catch (error) {
      return res
        .status(500)
        .json({ code: 500, success: false, msg: error.message });
    }
  }
  next();
};

const processImages = async (req, res, next) => {
  const images = req.files.images;
  if (images && images.length > 0) {
    try {
      const resizePromises = images.map(async (file) => {
        await sharp(file.path)
          .resize({ width: 100, height: 100, fit: "inside" })
          .toFile("./uploads/" + "compressed_" + file.filename);
      });

      await Promise.all(resizePromises);
    } catch (error) {
      return res
        .status(500)
        .json({ code: 500, success: false, msg: error.message });
    }
  }
  next();
};

// Middleware to process CSV files

module.exports = { upload, processImage, processImages };
