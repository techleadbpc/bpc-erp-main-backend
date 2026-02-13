const Joi = require("joi");

const createInventorySchema = Joi.object({
  siteId: Joi.number().integer().positive().required(),
  itemId: Joi.number().integer().positive().required(),
  quantity: Joi.number().precision(2).required(),
});

const updateInventorySchema = Joi.object({
  siteId: Joi.number().integer().positive(),
  itemId: Joi.number().integer().positive(),
  quantity: Joi.number().precision(2),
});

module.exports = {
  createInventorySchema,
  updateInventorySchema,
};
