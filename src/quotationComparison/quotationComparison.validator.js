const Joi = require("joi");

const createQuotationComparisonSchema = Joi.object({
  requisitionId: Joi.number().integer().positive().required(),
});

const addVendorSchema = Joi.object({
  vendorId: Joi.number().integer().positive().required(),
});

const updateRateSchema = Joi.object({
  vendorId: Joi.number().integer().positive().required(),
  rate: Joi.number().precision(2).positive().required(),
  remarks: Joi.string().allow("").optional(),
});

const selectVendorForItemSchema = Joi.object({
  vendorId: Joi.number().integer().positive().required(),
});

const selectVendorForAllItemsSchema = Joi.object({
  vendorId: Joi.number().integer().positive().required(),
});

const selectVendorsSchema = Joi.object({
  selections: Joi.object().pattern(
    Joi.string().regex(/^\d+$/),
    Joi.number().integer().positive()
  ).required(),
});

const submitComparisonSchema = Joi.object({
  remarks: Joi.string().allow("").optional(),
});

const approveComparisonSchema = Joi.object({
  remarks: Joi.string().allow("").optional(),
});

const lockComparisonSchema = Joi.object({
  remarks: Joi.string().allow("").optional(),
});

const updateComparisonStatusSchema = Joi.object({
  status: Joi.string().valid("draft", "submitted", "approved", "locked").required(),
});

const listComparisonsSchema = Joi.object({
  status: Joi.string().valid("draft", "submitted", "approved", "locked"),
  requisitionId: Joi.number().integer().positive(),
  page: Joi.number().integer().positive().default(1),
  limit: Joi.number().integer().positive().default(10),
});

const removeVendorSchema = Joi.object({
  vendorId: Joi.number().integer().positive().required(),
});

const updateItemQuantitySchema = Joi.object({
  quantity: Joi.number().integer().positive().required(),
});

const bulkUpdateSchema = Joi.object({
  rates: Joi.array().items(
    Joi.object({
      itemId: Joi.number().integer().positive().required(),
      vendorId: Joi.number().integer().positive().required(),
      rate: Joi.number().precision(2).positive().required(),
      remarks: Joi.string().allow("").optional(),
    })
  ),
  quantities: Joi.array().items(
    Joi.object({
      itemId: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().required(),
    })
  ),
});

const getRequisitionComparisonsSchema = Joi.object({
  requisitionId: Joi.number().integer().positive().required(),
});

const deleteComparisonSchema = Joi.object();

const removeItemSchema = Joi.object();

const getVendorAttachmentsSchema = Joi.object();

const deleteAttachmentSchema = Joi.object();

const uploadVendorAttachmentSchema = Joi.object();

const downloadAttachmentSchema = Joi.object();

module.exports = {
  createQuotationComparisonSchema,
  addVendorSchema,
  updateRateSchema,
  selectVendorForItemSchema,
  selectVendorForAllItemsSchema,
  selectVendorsSchema,
  submitComparisonSchema,
  approveComparisonSchema,
  lockComparisonSchema,
  updateComparisonStatusSchema,
  listComparisonsSchema,
  removeVendorSchema,
  updateItemQuantitySchema,
  bulkUpdateSchema,
  getRequisitionComparisonsSchema,
  deleteComparisonSchema,
  removeItemSchema,
  getVendorAttachmentsSchema,
  deleteAttachmentSchema,
  downloadAttachmentSchema,
  uploadVendorAttachmentSchema,
};
