const router = require("express").Router();
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const quotationComparisonController = require("./quotationComparison.controller");
const validateRequest = require("../../middlewares/validateRequest");
const auth = require("../../middlewares/tokenValidator");
const hasRole = require("../../middlewares/hasRole");
const {
  fileUploadMiddleware,
  upload,
} = require("../../middlewares/fileUploadMiddleware");
const {
  createQuotationComparisonSchema,
  addVendorSchema,
  updateRateSchema,
  selectVendorForItemSchema,
  selectVendorForAllItemsSchema,
  selectVendorsSchema,
  submitComparisonSchema,
  approveComparisonSchema,
  lockComparisonSchema,
  bulkUpdateSchema,
  removeVendorSchema,
  getRequisitionComparisonsSchema,
  deleteComparisonSchema,
  getVendorAttachmentsSchema,
  deleteAttachmentSchema,
  downloadAttachmentSchema,
} = require("./quotationComparison.validator");

// Routes
// Create a new quotation comparison from a requisition
router.post(
  "/",
  auth,
  hasRole([2, 3]), // Mechanical Head, Mechanical Manager
  validateRequest(createQuotationComparisonSchema),
  asyncMiddleware(quotationComparisonController.createComparison)
);

// Get a specific quotation comparison
router.get(
  "/:id",
  auth,
  asyncMiddleware(quotationComparisonController.getComparison)
);

// Add vendor to comparison
router.post(
  "/:id/vendors",
  auth,
  validateRequest(addVendorSchema),
  asyncMiddleware(quotationComparisonController.addVendor)
);

// Remove vendor from comparison
router.delete(
  "/:id/vendors/:vendorId",
  auth,
  // validateRequest(removeVendorSchema),
  asyncMiddleware(quotationComparisonController.removeVendor)
);

// Update rate for a specific item and vendor
router.put(
  "/:id/items/:itemId/rates",
  auth,
  validateRequest(updateRateSchema),
  asyncMiddleware(quotationComparisonController.updateRate)
);

// Select vendor for an item
router.put(
  "/:id/items/:itemId/vendor",
  auth,
  validateRequest(selectVendorForItemSchema),
  asyncMiddleware(quotationComparisonController.selectVendorForItem)
);

// Select vendor for all items in comparison
router.post(
  "/:id/select-vendor-for-all",
  auth,
  validateRequest(selectVendorForAllItemsSchema),
  asyncMiddleware(quotationComparisonController.selectVendorForAllItems)
);

// Bulk select vendors for items
router.put(
  "/:id/bulk-select",
  auth,
  validateRequest(selectVendorsSchema),
  asyncMiddleware(quotationComparisonController.selectVendors)
);

// Submit comparison for approval
router.put(
  "/:id/submit",
  auth,
  hasRole([2, 3]), // Mechanical Head, Mechanical Manager
  validateRequest(submitComparisonSchema),
  asyncMiddleware(quotationComparisonController.submitComparison)
);

// Approve comparison
router.put(
  "/:id/approve",
  auth,
  hasRole([1]), // Admin
  validateRequest(approveComparisonSchema),
  asyncMiddleware(quotationComparisonController.approveComparison)
);

// Lock comparison after final approval
router.put(
  "/:id/lock",
  auth,
  hasRole([1]), // Admin
  validateRequest(lockComparisonSchema),
  asyncMiddleware(quotationComparisonController.lockComparison)
);

// Get all comparisons for a requisition
router.get(
  "/requisition/:requisitionId",
  auth,
  // validateRequest(getRequisitionComparisonsSchema),
  asyncMiddleware(quotationComparisonController.getComparisonsForRequisition)
);

// Get all comparisons
router.get("/", auth, asyncMiddleware(quotationComparisonController.getAllComparisons));

// Remove item from comparison
router.delete(
  "/:id/items/:itemId",
  auth,
  asyncMiddleware(quotationComparisonController.removeItem)
);

// Bulk update rates and quantities
router.put(
  "/:id/bulk-update",
  auth,
  validateRequest(bulkUpdateSchema),
  asyncMiddleware(quotationComparisonController.bulkUpdate)
);

// Delete quotation comparison
router.delete(
  "/:id",
  auth,
  // validateRequest(deleteComparisonSchema),
  asyncMiddleware(quotationComparisonController.deleteComparison)
);

// Upload vendor attachment
router.post(
  "/:comparisonId/vendors/:vendorId/attachments",
  auth,
  upload.fields([{ name: "files", maxCount: 5 }]),
  fileUploadMiddleware(["files"], "quotationComparison", "vendor-attachments"),
  asyncMiddleware(quotationComparisonController.uploadVendorAttachment)
);

// Get vendor attachments
router.get(
  "/:comparisonId/vendors/:vendorId/attachments",
  auth,
  // validateRequest(getVendorAttachmentsSchema),
  asyncMiddleware(quotationComparisonController.getVendorAttachments)
);

// Delete attachment
router.delete(
  "/:comparisonId/vendors/:vendorId/attachments",
  auth,
  // validateRequest(deleteAttachmentSchema),
  asyncMiddleware(quotationComparisonController.deleteAttachment)
);

// Download attachment
router.get(
  "/:comparisonId/vendors/:vendorId/attachments/download",
  auth,
  // validateRequest(downloadAttachmentSchema),
  asyncMiddleware(quotationComparisonController.downloadAttachment)
);

module.exports = router;
