const quotationComparisonService = require("./quotationComparison.service");

const createComparison = async (req, res) => {
  const { requisitionId } = req.body;
  const userId = req.user.id;

  const comparison = await quotationComparisonService.createComparison(
    requisitionId,
    userId
  );
  res.sendResponse(comparison, "Quotation comparison created successfully");
};

const getComparison = async (req, res) => {
  const comparison = await quotationComparisonService.getComparisonWithDetails(
    req.params.id
  );
  res.sendResponse(comparison);
};

const addVendor = async (req, res) => {
  const { id } = req.params; // comparison id
  const { vendorId } = req.body;

  const vendor = await quotationComparisonService.addVendorToComparison(
    id,
    vendorId
  );
  res.sendResponse(vendor, "Vendor added to comparison");
};

const updateRate = async (req, res) => {
  const { id, itemId } = req.params; // comparison id and item id
  const { vendorId, rate, remarks } = req.body;

  const rateRecord = await quotationComparisonService.updateRate(
    id,
    itemId,
    vendorId,
    rate,
    remarks
  );
  res.sendResponse(rateRecord, "Rate updated successfully");
};

const selectVendorForItem = async (req, res) => {
  const { id, itemId } = req.params; // comparison id and item id
  const { vendorId } = req.body;

  const item = await quotationComparisonService.selectVendorForItem(
    id,
    itemId,
    vendorId
  );
  res.sendResponse(item, "Vendor selected for item");
};

const selectVendorForAllItems = async (req, res) => {
  const { id } = req.params; // comparison id
  const { vendorId } = req.body;

  const items = await quotationComparisonService.selectVendorForAllItems(
    id,
    vendorId
  );
  res.sendResponse(items, "Vendor selected for all items");
};

const selectVendors = async (req, res) => {
  const { id } = req.params; // comparison id
  const { selections } = req.body;

  const results = await quotationComparisonService.bulkSelectVendors(
    id,
    selections
  );
  res.sendResponse(results, "Selections saved successfully");
};

const submitComparison = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { remarks } = req.body;

  const comparison = await quotationComparisonService.submitComparison(
    id,
    userId,
    remarks
  );
  res.sendResponse(comparison, "Comparison submitted successfully");
};

const approveComparison = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { remarks } = req.body;

  const comparison = await quotationComparisonService.approveComparison(
    id,
    userId,
    remarks
  );
  res.sendResponse(comparison, "Comparison approved successfully");
};

const lockComparison = async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;

  const comparison = await quotationComparisonService.lockComparison(
    id,
    remarks
  );
  res.sendResponse(comparison, "Comparison locked successfully");
};

const getComparisonsForRequisition = async (req, res) => {
  const comparisons =
    await quotationComparisonService.getComparisonsForRequisition(
      req.params.requisitionId
    );
  res.sendResponse(comparisons);
};

const getAllComparisons = async (req, res) => {
  const comparisons = await quotationComparisonService.getAllComparisons();
  res.sendResponse(comparisons);
};

const removeVendor = async (req, res) => {
  const { id, vendorId } = req.params; // comparison id and vendor id

  const result = await quotationComparisonService.removeVendorFromComparison(
    id,
    parseInt(vendorId)
  );
  res.sendResponse(result, "Vendor removed from comparison");
};

const removeItem = async (req, res) => {
  const { id, itemId } = req.params; // comparison id and item id

  const result = await quotationComparisonService.removeItem(
    parseInt(id),
    parseInt(itemId)
  );
  res.sendResponse(result, "Item removed from comparison");
};

const bulkUpdate = async (req, res) => {
  const { id } = req.params; // comparison id
  const { rates, quantities } = req.body;

  const result = await quotationComparisonService.bulkUpdate(parseInt(id), {
    rates,
    quantities,
  });
  res.sendResponse(result, "Bulk update completed successfully");
};

const deleteComparison = async (req, res) => {
  const result = await quotationComparisonService.deleteComparison(
    parseInt(req.params.id)
  );
  res.sendResponse(result, "Quotation comparison deleted successfully");
};

const uploadVendorAttachment = async (req, res) => {
  const { comparisonId, vendorId } = req.params;
  const userId = req.user.id;
  // Check if file was uploaded
  if (!req.fileData || !req.fileData.files) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  // Get the first file from the files array
  const file = Array.isArray(req.fileData.files)
    ? req.fileData.files[0]
    : req.fileData.files;

  const attachmentData = {
    comparisonId: parseInt(comparisonId),
    vendorId: parseInt(vendorId),
    file: file,
    uploadedById: userId,
  };

  const attachment = await quotationComparisonService.uploadVendorAttachment(
    attachmentData
  );
  res.sendResponse(attachment, "Attachment uploaded successfully");
};

const getVendorAttachments = async (req, res) => {
  const { comparisonId, vendorId } = req.params;

  const attachments = await quotationComparisonService.getVendorAttachments(
    parseInt(comparisonId),
    parseInt(vendorId)
  );
  res.sendResponse(attachments);
};

const deleteAttachment = async (req, res) => {
  const { comparisonId, vendorId } = req.params; // Removed attachmentId since we're storing one per vendor

  const result = await quotationComparisonService.deleteAttachment(
    parseInt(comparisonId),
    parseInt(vendorId)
  );
  res.sendResponse(result, "Attachment deleted successfully");
};

const downloadAttachment = async (req, res) => {
  const { comparisonId, vendorId } = req.params; // Removed attachmentId since we're storing one per vendor

  const attachment = await quotationComparisonService.getAttachmentById(
    parseInt(comparisonId),
    parseInt(vendorId)
  );

  if (!attachment || !attachment.attachmentFilePath) {
    return res.status(404).json({
      success: false,
      message: "Attachment not found",
    });
  }

  // Redirect to the Cloudinary URL for download
  res.redirect(attachment.attachmentFilePath);
};

module.exports = {
  createComparison,
  getComparison,
  addVendor,
  updateRate,
  selectVendorForItem,
  selectVendorForAllItems,
  selectVendors,
  submitComparison,
  approveComparison,
  lockComparison,
  getComparisonsForRequisition,
  getAllComparisons,
  removeVendor,
  removeItem,
  bulkUpdate,
  deleteComparison,
  uploadVendorAttachment,
  getVendorAttachments,
  deleteAttachment,
  downloadAttachment,
};
