const Joi = require("joi");

const createItemSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  shortName: Joi.string().allow(null, "").max(50),
  partNumber: Joi.string().allow(null, "").max(50),
  hsnCode: Joi.string().allow(null, "").max(50),
  itemGroupId: Joi.number().integer().positive().required(),
  unitId: Joi.number().integer().positive().required(),
});

const updateItemSchema = createItemSchema;

module.exports = { createItemSchema, updateItemSchema };
