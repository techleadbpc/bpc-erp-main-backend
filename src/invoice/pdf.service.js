// services/pdf.service.js
const PDFDocument = require('pdfkit');
const fs = require('fs');

const generatePaymentSlip = async (data) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // Header
    doc
      .fontSize(20)
      .text('PAYMENT SLIP', { align: 'center' })
      .moveDown();

    // Payment Reference
    doc
      .fontSize(14)
      .text(`Payment Reference: PAY-${data.payment.id}`, { align: 'left' })
      .moveDown();

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // Payment Details
    doc.fontSize(12);
    doc.text(`Invoice Number: ${data.invoice.invoiceNumber}`);
    doc.text(`Vendor: ${data.vendor.name}`);
    doc.text(`Payment Date: ${new Date(data.payment.paymentDate).toLocaleDateString()}`);
    doc.text(`Amount: ₹${data.payment.amount.toLocaleString('en-IN')}`);
    doc.text(`Payment Method: ${data.payment.paymentMethod}`);
    doc.moveDown();

    // Payment Instructions
    doc
      .fontSize(14)
      .text('Payment Instructions:', { underline: true })
      .moveDown(0.5);
    doc
      .fontSize(12)
      .text('1. This payment slip serves as proof of payment')
      .moveDown(0.5);
    doc.text('2. Please retain this document for your records');
    doc.moveDown();

    // Footer
    doc
      .fontSize(10)
      .text('Generated on: ' + new Date().toLocaleDateString(), { align: 'center' });

    doc.end();
  });
};

module.exports = {
  generatePaymentSlip
};