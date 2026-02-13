const Joi = require("joi");

const requisitionItemSchema = Joi.object({
  itemId: Joi.number().integer().required(),
  quantity: Joi.number().positive().required(),
});

const createRequisitionSchema = Joi.object({
  requestedAt: Joi.date().required(),
  requestingSiteId: Joi.number().required(),
  requestedFor: Joi.string().required(),
  chargeType: Joi.string().required(),
  requestPriority: Joi.string().valid("High", "Medium", "Low").required(),
  dueDate: Joi.date().required(),
  preparedById: Joi.number().required(),
  items: Joi.array().items(requisitionItemSchema).min(1).required(),
});

module.exports = {
  createRequisitionSchema,
};
