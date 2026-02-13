const Joi = require("joi");

const issueItemSchema = Joi.object({
  itemId: Joi.number().integer().required(),
  quantity: Joi.number().positive().required(),
  issueTo: Joi.string().allow(null, ""),
  machineId: Joi.number().allow(null),
  siteId: Joi.number().required(),
  otherSiteId: Joi.number().allow(null),
});

const createMaterialIssueSchema = Joi.object({
  issueDate: Joi.date().required(),
  issueType: Joi.string().valid("Consumption", "Site Transfer").required(),
  status: Joi.string().optional(),
  siteId: Joi.number().required(),
  otherSiteId: Joi.number().allow(null),
  items: Joi.array().items(issueItemSchema).min(1).required(),
  requisitionId: Joi.number().allow(null),
});

module.exports = {
  createMaterialIssueSchema,
};
