const Joi = require("joi");

const createItemGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  shortName: Joi.string().allow(null, "").max(50),
  itemType: Joi.string().allow(null, "").max(50),
});

const updateItemGroupSchema = createItemGroupSchema;

module.exports = {
  createItemGroupSchema,
  updateItemGroupSchema,
};
