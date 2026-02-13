const Joi = require("joi");

const createMachineryItemCodeSchema = Joi.object({
  code: Joi.string().min(1).max(50).required().messages({
    "string.base": "Code must be a string",
    "string.empty": "Code is required",
    "string.min": "Code must be at least 1 character",
    "string.max": "Code must not exceed 50 characters",
    "any.required": "Code is required",
  }),
  name: Joi.string().min(1).max(100).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
    "string.min": "Name must be at least 1 character",
    "string.max": "Name must not exceed 100 characters",
    "any.required": "Name is required",
  }),
  remarks: Joi.string().optional().allow("").messages({
    "string.base": "Remarks must be a string",
  }),
});

const updateMachineryItemCodeSchema = Joi.object({
  code: Joi.string().min(1).max(50).optional(),
  name: Joi.string().min(1).max(100).optional(),
  remarks: Joi.string().optional().allow(""),
});

module.exports = {
  createMachineryItemCodeSchema,
  updateMachineryItemCodeSchema,
};
