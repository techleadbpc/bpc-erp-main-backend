const FileService = require('./file.service');

exports.uploadFile = async (req, res) => {
  const { folder, fileName } = req.body
  const result = await FileService.uploadFile(req.file, folder, fileName);
  res.sendResponse(result, "File uploaded successfully");
};

exports.deleteFile = async (req, res) => {
  await FileService.deleteFile(req.params.publicId);
  res.sendResponse(null, "File deleted successfully");
};