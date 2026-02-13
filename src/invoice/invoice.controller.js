// controllers/invoice.controller.js
const invoiceService = require('./invoice.service');

const createInvoice = async (req, res) => {
  const data = { ...req.body };
  if (data.items && typeof data.items === "string") {
    try {
      data.items = JSON.parse(data.items);
    } catch (error) {
      console.error("Failed to parse items:", error);
    }
  }
  const invoice = await invoiceService.createInvoice(data, req.fileData);
  res.sendResponse(invoice, 'Invoice created successfully');
};

const createPayment = async (req, res) => {
  const payment = await invoiceService.createPayment(req.body);
  res.sendResponse(payment, 'Payment created successfully');
};

const acceptInvoice = async (req, res) => {
  const invoice = await invoiceService.acceptInvoice(req.params.id, req.user);
  res.sendResponse(invoice, "Invoice accepted and inventory updated");
};

module.exports = {
  createInvoice,
  createPayment,
  acceptInvoice,
  // Add other controller methods
};