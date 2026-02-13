const Joi = require("joi");

const createUnitSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  shortName: Joi.string().min(1).max(10).required(),
  decimalPlaces: Joi.number().integer().min(0).max(5).allow(null),
});

const updateUnitSchema = createUnitSchema;

module.exports = {
  createUnitSchema,
  updateUnitSchema,
};
