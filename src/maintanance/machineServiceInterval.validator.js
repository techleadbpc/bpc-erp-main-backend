const Joi = require("joi");

const createMachineServiceIntervalSchema = Joi.object({
  machineId: Joi.number().integer().required(),
  serviceType: Joi.string().required(),
  intervalHours: Joi.number().integer().optional(),
  intervalKm: Joi.number().integer().optional(),
  intervalCalendarDays: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
  notes: Joi.string().optional().allow(null, ""),
});

const updateMachineServiceIntervalSchema = Joi.object({
  machineId: Joi.number().integer().optional(),
  serviceType: Joi.string().optional(),
  intervalHours: Joi.number().integer().optional(),
  intervalKm: Joi.number().integer().optional(),
  intervalCalendarDays: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
  notes: Joi.string().optional().allow(null, ""),
}).min(1); // At least one field must be provided for update

module.exports = {
  createMachineServiceIntervalSchema,
  updateMachineServiceIntervalSchema,
};
