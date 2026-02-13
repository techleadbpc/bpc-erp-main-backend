// validators/maintanance.validator.js
const Joi = require("joi");

// Maintenance Log validation - now includes all fields for all maintenance types
const createMaintenanceLogSchema = Joi.object({
  machineId: Joi.number().integer().positive().required(),
  type: Joi.string()
    .valid(
      "servicing",
      "custom",
      "hydraulic_service",
      "engine_service",
    )
    .optional()
    .allow(null, ""),
  date: Joi.date().optional().allow(null),
  title: Joi.string().required(),
  description: Joi.string().optional().allow(null, ""),
  parts: Joi.string().optional().allow(null, ""),
  cost: Joi.number().precision(2).optional().allow(null),
  technician: Joi.string().optional().allow(null, ""),
  status: Joi.string()
    .valid("completed", "in_progress", "scheduled", "overdue", "due_today")
    .required(),
  kilometersAtService: Joi.number().integer().optional().allow(null),
  hoursAtService: Joi.number().integer().optional().allow(null),
  vendorAndPartsDetails: Joi.array().items(Joi.object()).optional().allow(null),
  dueDate: Joi.date().optional().allow(null),
  estimatedHours: Joi.number().optional().allow(null),
  estimatedCost: Joi.number().precision(2).optional().allow(null),
  priority: Joi.string()
    .valid("low", "medium", "high")
    .optional()
    .allow(null)
    .default("medium"),
  assignedTo: Joi.string().optional().allow(null, ""),
  lastAlertDate: Joi.date().optional().allow(null),
});

const updateMaintenanceLogSchema = Joi.object({
  machineId: Joi.number().integer().positive().optional(),
  type: Joi.string()
    .valid(
      "servicing",
      "custom",
      "hydraulic_service",
      "engine_service",
    )
    .optional()
    .allow(null, ""),
  date: Joi.date().optional().allow(null),
  title: Joi.string().optional().allow(null, ""),
  description: Joi.string().optional().allow(null, ""),
  parts: Joi.string().optional().allow(null, ""),
  cost: Joi.number().precision(2).optional().allow(null),
  technician: Joi.string().optional().allow(null, ""),
  status: Joi.string()
    .valid("completed", "in_progress", "scheduled", "overdue", "due_today")
    .optional(),
  kilometersAtService: Joi.number().integer().optional().allow(null),
  hoursAtService: Joi.number().integer().optional().allow(null),
  vendorAndPartsDetails: Joi.array().items(Joi.object()).optional().allow(null),
  dueDate: Joi.date().optional().allow(null),
  estimatedHours: Joi.number().optional().allow(null),
  estimatedCost: Joi.number().precision(2).optional().allow(null),
  priority: Joi.string().valid("low", "medium", "high").optional().allow(null),
  assignedTo: Joi.string().optional().allow(null, ""),
  lastAlertDate: Joi.date().optional().allow(null),
});

// Scheduled Maintenance validation - now uses the same schema as maintenance log
const createScheduledMaintenanceSchema = Joi.object({
  machineId: Joi.number().integer().positive().required(),
  title: Joi.string().required(),
  type: Joi.string()
    .valid(
      "servicing",
      "custom",
      "hydraulic_service",
      "engine_service",
    )
    .optional()
    .allow(null, ""),
  dueDate: Joi.date().required(),
  estimatedHours: Joi.number().optional().allow(null),
  estimatedCost: Joi.number().precision(2).optional().allow(null),
  priority: Joi.string()
    .valid("low", "medium", "high")
    .optional()
    .default("medium"),
  assignedTo: Joi.string().optional().allow(null, ""),
  status: Joi.string()
    .valid("scheduled", "overdue", "due_today")
    .optional()
    .default("scheduled"),
  description: Joi.string().optional().allow(null, ""),
  parts: Joi.string().optional().allow(null, ""),
  cost: Joi.number().precision(2).optional().allow(null),
  technician: Joi.string().optional().allow(null, ""),
  hoursAtService: Joi.number().integer().optional().allow(null),
  vendorAndPartsDetails: Joi.array().items(Joi.object()).optional().allow(null),
});

const updateScheduledMaintenanceSchema = Joi.object({
  machineId: Joi.number().integer().positive().optional(),
  title: Joi.string().optional().allow(null, ""),
  type: Joi.string()
    .valid(
      "servicing",
      "custom",
      "hydraulic_service",
      "engine_service",
    )
    .optional()
    .allow(null, ""),
  dueDate: Joi.date().optional().allow(null),
  estimatedHours: Joi.number().optional().allow(null),
  estimatedCost: Joi.number().precision(2).optional().allow(null),
  priority: Joi.string().valid("low", "medium", "high").optional().allow(null),
  assignedTo: Joi.string().optional().allow(null, ""),
  status: Joi.string()
    .valid("completed", "in_progress", "scheduled", "overdue", "due_today")
    .optional(),
  description: Joi.string().optional().allow(null, ""),
  parts: Joi.string().optional().allow(null, ""),
  cost: Joi.number().precision(2).optional().allow(null),
  technician: Joi.string().optional().allow(null, ""),
  hoursAtService: Joi.number().integer().optional().allow(null),
  vendorAndPartsDetails: Joi.array().items(Joi.object()).optional().allow(null),
  lastAlertDate: Joi.date().optional().allow(null),
  date: Joi.date().optional().allow(null),
});

module.exports = {
  createMaintenanceLogSchema,
  updateMaintenanceLogSchema,
  createScheduledMaintenanceSchema,
  updateScheduledMaintenanceSchema,
};
