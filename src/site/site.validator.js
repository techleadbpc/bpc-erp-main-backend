const Joi = require("joi");

const createSiteSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must not exceed 100 characters",
    "any.required": "Name is required",
  }),
  // code: Joi.string().min(3).max(100).required().messages({
  //   "string.base": "Site code must be a string",
  //   "string.empty": "Site code is required",
  //   "string.min": "Site code must be at least 3 characters long",
  //   "string.max": "Site code must not exceed 100 characters",
  //   "any.required": "Site code is required",
  // }),
  address: Joi.string().min(3).max(200).required().messages({
    "string.base": "Site adress must be a string",
    "string.empty": "Site adress is required",
    "string.min": "Site adress must be at least 3 characters long",
    "string.max": "Site adress must not exceed 200 characters",
    "any.required": "Site adress is required",
  }),
  departmentId: Joi.number().integer().positive().required().messages({
    "number.base": "Department ID must be a number",
    "number.integer": "Department ID must be an integer",
    "number.positive": "Department ID must be a positive number",
    "any.required": "Department ID is required",
  }),
  mobileNumber: Joi.string().optional().messages({
    "string.base": "Mobile number must be a string",
    "string.empty": "Mobile number is required",
  }),
  pincode: Joi.string().optional().messages({
    "string.base": "Pincode must be a string",
    "string.empty": "Pincode is required",
  }),
  code: Joi.string()
    .allow(null, "") // allows null and empty string
    .optional(),
  status: Joi.string()
    .valid("active", "closed", "paused")
    .default("active")
    .messages({
      "any.only": 'Status must be one of "active", "closed", or "paused"',
    }),
});

const updateSiteSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name must not be empty",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must not exceed 100 characters",
  }),
  // code: Joi.string().min(3).max(100).required().messages({
  //   "string.base": "Site code must be a string",
  //   "string.empty": "Site code is required",
  //   "string.min": "Site code must be at least 3 characters long",
  //   "string.max": "Site code must not exceed 100 characters",
  //   "any.required": "Site code is required",
  // }),
  address: Joi.string().min(3).max(200).required().messages({
    "string.base": "Site adress must be a string",
    "string.empty": "Site adress is required",
    "string.min": "Site adress must be at least 3 characters long",
    "string.max": "Site adress must not exceed 200 characters",
    "any.required": "Site adress is required",
  }),
  mobileNumber: Joi.string().optional().messages({
    "string.base": "Mobile number must be a string",
    "string.empty": "Mobile number is required",
  }),
  departmentId: Joi.number().integer().positive().optional().messages({
    "number.base": "Department ID must be a number",
    "number.integer": "Department ID must be an integer",
    "number.positive": "Department ID must be a positive number",
  }),
  status: Joi.string().valid("active", "closed", "paused").optional().messages({
    "any.only": 'Status must be one of "active", "closed", or "paused"',
  }),
  pincode: Joi.string().optional().messages({
    "string.base": "Pincode must be a string",
    "string.empty": "Pincode is required",
  }),
});

module.exports = {
  createSiteSchema,
  updateSiteSchema,
};
