const Router = require('express').Router();
const FileController = require('./file.controller');
const upload = require('../../middlewares/cloudinaryUpload');
const asyncMiddleware = require('../../middlewares/asyncMiddleware');

// Upload File
Router.post(
  '/upload',
  upload.single('file'),
  asyncMiddleware(FileController.uploadFile)
);

// Delete File
Router.delete(
  '/delete/:publicId',
  asyncMiddleware(FileController.deleteFile)
);

module.exports = Router;