const Joi = require("joi");

const createMachinerySchema = Joi.object({
  primaryCategoryId: Joi.number().integer().positive().required(), // Foreign Key for PrimaryCategory
  machineCategoryId: Joi.number().integer().positive().required(), // Foreign Key for MachineCategory
  erpCode: Joi.string().trim().allow(null).optional(),
  registrationNumber: Joi.string().trim().allow(null).optional(),
  machineNumber: Joi.string().trim().allow(null).optional(),
  machineCode: Joi.string().trim().allow(null).optional(),
  chassisNumber: Joi.string().trim().allow(null).optional(),
  engineNumber: Joi.string().trim().allow(null).optional(),
  serialNumber: Joi.string().trim().allow(null).optional(),
  model: Joi.string().trim().allow(null).optional(),
  make: Joi.string().trim().allow(null).optional(),
  yom: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .allow(null).optional(),
  purchaseDate: Joi.date().iso().allow(null).optional(),
  capacity: Joi.string().trim().allow(null).optional(),
  ownerName: Joi.string().trim().allow(null).optional(),
  ownerType: Joi.string().valid("Company", "Individual").allow(null).optional(),
  siteId: Joi.number().integer().positive().allow(null).optional(),
  isActive: Joi.boolean().default(true),
  machineName: Joi.string().trim().allow(null).optional(),
  fitnessCertificateExpiry: Joi.date().iso().allow(null).optional(),
  motorVehicleTaxDue: Joi.date().iso().allow(null).optional(),
  permitExpiryDate: Joi.date().iso().allow(null).optional(),
  nationalPermitExpiry: Joi.date().iso().allow(null).optional(),
  insuranceExpiry: Joi.date().iso().allow(null).optional(),
  pollutionCertificateExpiry: Joi.date().iso().allow(null).optional(),
  status: Joi.string()
    .valid("Idle", "In Use", "In Transfer", "Sold", "Scrap")
    .default("Idle"),

  // ✅ Allow file fields (Joi.any())
  fitnessCertificateFile: Joi.any(),
  pollutionCertificateFile: Joi.any(),
  insuranceFile: Joi.any(),
  permitFile: Joi.any(),
  nationalPermitFile: Joi.any(),
  motorVehicleTaxFile: Joi.any(),
  machineImageFile: Joi.any(),
});

const updateMachinerySchema = Joi.object({
  primaryCategoryId: Joi.number().integer().positive(), // Foreign Key for PrimaryCategory
  machineCategoryId: Joi.number().integer().positive(), // Foreign Key for MachineCategory
  erpCode: Joi.string().trim(),
  registrationNumber: Joi.string().trim(),
  machineNumber: Joi.string().trim(),
  machineCode: Joi.string().trim(),
  chassisNumber: Joi.string().trim(),
  engineNumber: Joi.string().trim(),
  serialNumber: Joi.string().trim(),
  model: Joi.string().trim(),
  make: Joi.string().trim(),
  yom: Joi.number().integer().min(1900).max(new Date().getFullYear()),
  purchaseDate: Joi.date().iso(),
  capacity: Joi.string().trim(),
  ownerName: Joi.string().trim(),
  ownerType: Joi.string().valid("Company", "Individual"),
  siteId: Joi.number().integer().positive(),
  isActive: Joi.boolean(),
  machineName: Joi.string().trim(),
  fitnessCertificateExpiry: Joi.date().iso(),
  motorVehicleTaxDue: Joi.date().iso(),
  permitExpiryDate: Joi.date().iso(),
  nationalPermitExpiry: Joi.date().iso(),
  insuranceExpiry: Joi.date().iso(),
  pollutionCertificateExpiry: Joi.date().iso(),
  status: Joi.string().valid("Idle", "In Use", "In Transfer", "Sold", "Scrap"),
});

module.exports = {
  createMachinerySchema,
  updateMachinerySchema,
};
