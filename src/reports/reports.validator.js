const Joi = require("joi");

const reportsFiltersSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date()
    .optional()
    .when("startDate", {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref("startDate")).required(),
      otherwise: Joi.optional(),
    }),

  // Site filters
  siteId: Joi.number().integer().positive().optional(),
  currentSiteId: Joi.number().integer().positive().optional(),
  destinationSiteId: Joi.number().integer().positive().optional(),
  otherSiteId: Joi.number().integer().positive().optional(),

  // Machine filters
  machineId: Joi.number().integer().positive().optional(),

  // Item filters
  itemId: Joi.number().integer().positive().optional(),
  itemGroupId: Joi.number().integer().positive().optional(),

  // User filters
  userId: Joi.number().integer().positive().optional(),

  // Vendor filters
  vendorId: Joi.number().integer().positive().optional(),

  // Status filters
  status: Joi.string().optional(),

  // Type filters
  type: Joi.string().optional(),
  maintenanceType: Joi.string().optional(),
  requestType: Joi.string().optional(),
  activityType: Joi.string().optional(),
  assetType: Joi.string().optional(),

  // Priority filters
  priority: Joi.string().optional(),

  // Payment filters
  paymentMethod: Joi.string().optional(),

  // Specific filters
  lowStock: Joi.boolean().optional(),
  expiring_within_days: Joi.number().integer().min(1).max(365).optional(),

  // Pagination (optional)
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(1000).optional(),
}).unknown(false);

module.exports = {
  reportsFiltersSchema,
};
