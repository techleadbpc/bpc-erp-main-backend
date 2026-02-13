const Joi = require("joi");

const createProcurementSchema = Joi.object({
  requisitionId: Joi.number().integer().positive().required(),
  vendorId: Joi.number().integer().positive().required(),
  expectedDelivery: Joi.date().iso().required(),
  notes: Joi.string(),
  quotationComparisonId: Joi.number().integer().positive(),
  totalAmount: Joi.number().precision(2).positive().required(),
  items: Joi.array()
    .items(
      Joi.object({
        requisitionItemId: Joi.number().integer().positive().required(),
        itemId: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().required(),
        rate: Joi.number().precision(2).positive().required(),
        amount: Joi.number().precision(2).positive().required(),
      })
    )
    .min(1)
    .required(),
});
//   vendor: Joi.alternatives()
//     .try(
//       // Option 1: Full vendor object (for new vendors)
//       Joi.object({
//         name: Joi.string().required().min(2).max(100),
//         email: Joi.string().email().required(),
//         contactPerson: Joi.string().required(),
//         phone: Joi.string().pattern(/^[+]?[\d\s-]{8,15}$/),
//         address: Joi.string().max(200),
//       }).required(),

//       // Option 2: Just vendor ID (for existing vendors)
//       Joi.number().integer().positive().required()
//     )
//     .required()
//     .error(
//       new Error("Either vendor ID or complete vendor details must be provided")
//     ),
// }).xor("vendorId", "vendor"); // Ensure only one vendor reference method is used

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "pending",
      "ordered",
      "delivered",
      "paid",
      "cancelled",
      "accepted_at_virtual_site",
      "in_transit_to_requested_site"
    )
    .required(),
});

const listProcurementsSchema = Joi.object({
  status: Joi.string().valid(
    "pending",
    "ordered",
    "delivered",
    "paid",
    "cancelled",
    "accepted_at_virtual_site",
    "in_transit_to_requested_site"
  ),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  vendorId: Joi.number().integer().positive(),
  page: Joi.number().integer().positive().default(1),
  limit: Joi.number().integer().positive().default(10),
});

const updatePaymentSchema = Joi.object({
  paymentStatus: Joi.boolean().required(), // true=paid, false=unpaid
  paymentDate: Joi.date().iso(),
});

module.exports = {
  createProcurementSchema,
  updateStatusSchema,
  listProcurementsSchema,
  updatePaymentSchema,
};
