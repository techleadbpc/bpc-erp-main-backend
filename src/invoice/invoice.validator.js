// validators/invoice.validator.js
const Joi = require("joi");

const createInvoiceSchema = Joi.object({
  procurementId: Joi.number().integer().positive().required(),
  invoiceNumber: Joi.string().required(),
  invoiceDate: Joi.date().required(),
  amount: Joi.number().precision(2).positive().required(),
  files: Joi.array().items(Joi.string().uri()).optional(),
  notes: Joi.string(),
  items: Joi.array()
    .items(
      Joi.object({
        procurementItemId: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().required(),
        rate: Joi.number().positive().required(),
        amount: Joi.number().positive().required(),
      })
    )
    .optional(),
});

const updateInvoiceSchema = createInvoiceSchema.keys({
  status: Joi.string().valid(
    "DRAFT",
    "SENT",
    "PAID",
    "PARTIALLY_PAID",
    "CANCELLED"
  ),
});

const createPaymentSchema = Joi.object({
  invoiceId: Joi.number().integer().positive().required(),
  paymentDate: Joi.date().required(),
  amount: Joi.number().positive().required(),
  paymentMethod: Joi.string()
    .valid("CASH", "CHEQUE", "BANK_TRANSFER", "ONLINE_PAYMENT", "OTHER")
    .required(),
  referenceNumber: Joi.string(),
  remarks: Joi.string(),
});

module.exports = {
  createInvoiceSchema,
  updateInvoiceSchema,
  createPaymentSchema,
};
