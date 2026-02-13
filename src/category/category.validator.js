const Joi = require("joi");

// ✅ Schema for Primary Category
const createPrimaryCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
});

const updatePrimaryCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
});

// ✅ Schema for Machine Category
const createMachineCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  primaryCategoryId: Joi.number().integer().positive().allow(null),
  averageBase: Joi.string().valid("Distance", "Time", "Both", "None").allow(null),
  standardKmRun: Joi.number().positive().allow(null),
  standardMileage: Joi.number().positive().allow(null),
  standardHrsRun: Joi.number().positive().allow(null),
  ltrPerHour: Joi.number().positive().allow(null),
  remarks: Joi.string().trim().allow(null, ""),
  useFor: Joi.string().trim().allow(null, ""),
  machineType: Joi.string().valid("Vehicle", "Machine", "Drilling").allow(null),
  unitPerHour: Joi.number().positive().allow(null),
  isApplicable: Joi.array().allow(null), // JSON field
  other: Joi.string().trim().allow(null, ""),
});

const updateMachineCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  primaryCategoryId: Joi.number().integer().positive().allow(null),
  averageBase: Joi.string().valid("Distance", "Time", "Both", "None").allow(null),
  standardKmRun: Joi.number().positive().allow(null),
  standardMileage: Joi.number().positive().allow(null),
  standardHrsRun: Joi.number().positive().allow(null),
  ltrPerHour: Joi.number().positive().allow(null),
  remarks: Joi.string().trim().allow(null, ""),
  useFor: Joi.string().trim().allow(null, ""),
  machineType: Joi.string().valid("Vehicle", "Machine", "Drilling").allow(null),
  unitPerHour: Joi.number().positive().allow(null),
  isApplicable: Joi.array().allow(null), // JSON field
  other: Joi.string().trim().allow(null, ""),
});

module.exports = {
  createPrimaryCategorySchema,
  updatePrimaryCategorySchema,
  createMachineCategorySchema,
  updateMachineCategorySchema,
};