const cloudinary = require("../../utils/cloudinary");


exports.uploadFile = async (file, folder, fileName) => {
  if (!file) throw new Error('No file uploaded');
  const directory = folder ? folder + "/" + fileName : "uploads"

  const result = await cloudinary.uploader.upload(file.path, {
    folder: directory,
    use_filename: true,
    unique_filename: false,
    resource_type: 'auto'
  });

  return {
    fileUrl: result.secure_url,
    publicId: result.public_id
  };
};

exports.deleteFile = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};