const Joi = require("joi");

const dashboardFiltersSchema = Joi.object({
  siteId: Joi.number().integer().positive().optional(),
  departmentId: Joi.number().integer().positive().optional(),
  categoryId: Joi.number().integer().positive().optional(),
  dateRange: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  }).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  days: Joi.number().integer().min(1).max(365).optional(),
  months: Joi.number().integer().min(1).max(24).optional(),
  status: Joi.string().optional(),
  severity: Joi.string().valid('Low Stock', 'Out of Stock').optional()
});

module.exports = {
  dashboardFiltersSchema,
};