const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Uploads a file to Cloudinary
 * @param {Object} file - The file object from Multer
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<string|null>} - Public URL of uploaded file
 */
async function uploadFileToCloudinary(file, folder, field, oldFileUrl = null) {
  if (!file) return null; // Skip if no file provided

  // Optional: Delete old file from Cloudinary
  if (oldFileUrl) {
    const publicId = oldFileUrl.split("/").pop().split(".")[0]; // Extract public ID
    await cloudinary.uploader.destroy(publicId);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve({ field, url: result.secure_url });
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
}

/**
 * Middleware to handle file uploads and store file URLs in req.fileData
 * @param {string[]} fileFields - Array of expected file field names
 * @param {string} folder - Cloudinary folder name
 */
function fileUploadMiddleware(
  fileFields,
  folder = "uploads",
  subFolder,
  getExistingFiles
) {
  return async (req, res, next) => {
    try {
      if (!req.files) return next();

      req.fileData = {};

      // Determine full upload path
      const uploadPath = subFolder ? `${folder}/${subFolder}` : folder;

      // Optionally load existing files (e.g., for replacements)
      let existingFiles = undefined;
      if (typeof getExistingFiles === "function") {
        try {
          existingFiles = await getExistingFiles(req);
        } catch (e) {
          // If fetching existing files fails, proceed without them
          existingFiles = undefined;
        }
      }

      // Normalize a field's files to an array of file objects
      const toArray = (maybeArray) => {
        if (!maybeArray) return [];
        return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
      };

      // Build upload promises for each field, supporting multiple files
      const uploadPromises = [];

      for (const field of fileFields) {
        const incoming = req.files[field]; // could be undefined | file | file[]
        const files = toArray(incoming); // always an array now

        if (files.length === 0) continue;

        // Determine old files for this field (could be string or array)
        const oldForField = existingFiles?.[field];

        // If multiple files uploaded, pass oldFileUrl per index (optional logic)
        // Strategy:
        // - If oldForField is an array, align by index; otherwise, pass null for multiples.
        // - For single upload, keep previous behavior.
        files.forEach((file, idx) => {
          const oldUrl = Array.isArray(oldForField)
            ? oldForField[idx] ?? null
            : (idx === 0 && typeof oldForField === "string" ? oldForField : null);

          uploadPromises.push(
            uploadFileToCloudinary(file, uploadPath, field, oldUrl).then((res) => ({
              field,
              url: res?.url,
            }))
          );
        });
      }

      if (uploadPromises.length === 0) {
        return next();
      }

      const uploaded = await Promise.all(uploadPromises);

      // Aggregate results by field: if multiple files arrive for a field, store an array
      const aggregated = {};
      for (const { field, url } of uploaded) {
        if (!url) continue;
        if (!aggregated[field]) aggregated[field] = [];
        aggregated[field].push(url);
      }

      // Decide per field whether to store a single string or an array
      for (const field of Object.keys(aggregated)) {
        const urls = aggregated[field];
        req.fileData[field] = urls.length === 1 ? urls[0] : urls;
      }

      next();
    } catch (error) {
      res
        .status(500)
        .send({ message: "Error uploading files to Cloudinary", error });
    }
  };
}

module.exports = { upload, fileUploadMiddleware };
