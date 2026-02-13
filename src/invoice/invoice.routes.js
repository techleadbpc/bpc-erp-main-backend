// routes/invoice.routes.js
const router = require("express").Router();
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const validateRequest = require("../../middlewares/validateRequest");
const invoiceController = require("./invoice.controller");
const {
  fileUploadMiddleware,
  upload,
} = require("../../middlewares/fileUploadMiddleware");

const fileFields = ["files"];
const {
  createInvoiceSchema,
  updateInvoiceSchema,
  createPaymentSchema,
} = require("./invoice.validator");

// Invoice routes
router.post(
  "/invoices",
  upload.fields(fileFields.map((name) => ({ name, maxCount: 1 }))),
  fileUploadMiddleware(fileFields, "mani", "invoices"),
  (req, res, next) => {
    if (req.body.items && typeof req.body.items === "string") {
      try {
        req.body.items = JSON.parse(req.body.items);
      } catch (e) {
        console.error("Failed to parse items JSON:", e);
      }
    }
    next();
  },
  validateRequest(createInvoiceSchema),
  asyncMiddleware(invoiceController.createInvoice)
);

router.post(
  "/invoices/:id/payments",
  validateRequest(createPaymentSchema),
  asyncMiddleware(invoiceController.createPayment)
);

router.post(
  "/invoices/:id/accept",
  asyncMiddleware(invoiceController.acceptInvoice)
);

// Add other invoice routes (GET, PUT, DELETE) as needed

module.exports = router;
