const Joi = require("joi");

const createVendorSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  contactPerson: Joi.string().required(),
  phone: Joi.string().pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/),
  address: Joi.string().allow(null, "").max(500),
  isActive: Joi.boolean().default(true)
});

const updateVendorSchema = createVendorSchema.keys({
  email: Joi.string().email()
});

module.exports = { createVendorSchema, updateVendorSchema };