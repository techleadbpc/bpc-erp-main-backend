const Joi = require("joi");

const createUserSchema = Joi.object({
  name: Joi.string().required().messages({ "any.required": "Name is required" }),
  code: Joi.string().required().messages({ "any.required": "Code is required" }),
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  phone: Joi.string().required().messages({ "any.required": "Phone is required" }),
  imageUrl: Joi.string().uri().optional().messages({ "string.uri": "Invalid image URL" }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
  roleId: Joi.number().required().messages({ "any.required": "Role ID is required" }),
  departmentId: Joi.number().optional(),
  siteId: Joi.number().optional(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  imageUrl: Joi.string().uri().optional(),
  password: Joi.string().min(6).optional(),
  roleId: Joi.number().optional(),
  departmentId: Joi.number().optional(),
  siteId: Joi.number().optional(),
});


module.exports = {
  createUserSchema,
  updateUserSchema,
};
