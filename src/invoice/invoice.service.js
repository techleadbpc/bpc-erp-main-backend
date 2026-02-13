// services/invoice.service.js
const { Op } = require("sequelize");
const db = require("./../../models");
// const pdfService = require('./pdf.service');
// const storageService = require('./storage.service');

const createInvoice = async (data, fileData) => {
  const transaction = await db.sequelize.transaction();
  try {
    // 1. Create Invoice
    const invoice = await db.Invoice.create(
      { ...data, files: fileData },
      { transaction }
    );

    // 2. Process Invoice Items (if provided)
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        // Create InvoiceItem
        await db.InvoiceItem.create(
          {
            invoiceId: invoice.id,
            procurementItemId: item.procurementItemId,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
          },
          { transaction }
        );

        // Update ProcurementItem receivedQuantity
        const procurementItem = await db.ProcurementItem.findByPk(
          item.procurementItemId,
          { transaction }
        );

        if (procurementItem) {
          await procurementItem.increment("receivedQuantity", {
            by: item.quantity,
            transaction,
          });
        }
      }
    }

    // 3. Check if Procurement is fully delivered
    // Fetch all items for this procurement
    const procurementItems = await db.ProcurementItem.findAll({
      where: { procurementId: data.procurementId },
      transaction,
    });

    const allDelivered = procurementItems.every(
      (item) => item.receivedQuantity >= item.quantity
    );

    if (allDelivered) {
      await db.Procurement.update(
        { status: "delivered" },
        { where: { id: data.procurementId }, transaction }
      );
    }

    await transaction.commit();
    return invoice;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const createPayment = async (data) => {
  const transaction = await db.sequelize.transaction();
  try {
    const invoice = await db.Invoice.findByPk(data.invoiceId, {
      include: [{ model: db.Procurement, as: "procurement" }],
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Create payment
    const payment = await db.Payment.create(
      {
        invoiceId: data.invoiceId,
        paymentDate: data.paymentDate,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        remarks: data.remarks,
        status: "COMPLETED",
      },
      { transaction }
    );

    // Generate payment slip PDF
    // const pdfBuffer = await pdfService.generatePaymentSlip({
    //   payment,
    //   invoice,
    //   vendor: invoice.vendor,
    //   procurement: invoice.procurement
    // });

    // Upload to storage
    // const slipUrl = await storageService.uploadPaymentSlip(
    //   `payments/${payment.id}.pdf`,
    //   pdfBuffer
    // );

    // Update payment with slip URL
    await payment.update({ slipUrl: "" }, { transaction });

    // Update invoice status if fully paid
    const totalPaid = await db.Payment.sum("amount", {
      where: { invoiceId: invoice.id, status: "COMPLETED" },
    });

    if (totalPaid >= invoice.totalAmount) {
      await invoice.update({ status: "PAID" }, { transaction });
    } else if (totalPaid > 0) {
      await invoice.update({ status: "PARTIALLY_PAID" }, { transaction });
    }

    await transaction.commit();
    return await db.Payment.findByPk(payment.id, {
      include: [{ model: db.Invoice, as: "invoice" }],
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const acceptInvoice = async (id, user) => {
  const transaction = await db.sequelize.transaction();
  try {
    const invoice = await db.Invoice.findByPk(id, {
      include: [
        {
          model: db.InvoiceItem,
          as: "items",
          include: [
            {
              model: db.ProcurementItem,
              include: [db.RequisitionItem],
            },
          ],
        },
      ],
      transaction,
    });

    if (!invoice) throw new Error("Invoice not found");
    if (invoice.isInventoryUpdated)
      throw new Error("Inventory already updated for this invoice");

    // Get Virtual Site
    let virtualSite = await db.Site.findOne({
      where: { type: "virtual" },
      attributes: ["id"],
      transaction,
    });

    if (!virtualSite?.id) {
      const department = await db.Department.findOne({
        where: { name: "Mechanical" },
        transaction,
      });
      virtualSite = await db.Site.create(
        {
          name: "Virtual",
          type: "virtual",
          departmentId: department.id,
          address: "NA",
        },
        { transaction }
      );
    }

    // Update Inventory for each item
    for (const item of invoice.items) {
      await updateInventory(
        {
          siteId: virtualSite.id,
          itemId: item.ProcurementItem.RequisitionItem.itemId,
          change: item.quantity,
          type: "IN",
          sourceType: "Procurement",
          sourceId: invoice.procurementId,
          userId: user.id,
        },
        transaction
      );
    }

    await invoice.update({ isInventoryUpdated: true }, { transaction });
    await transaction.commit();
    return invoice;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Helper function for inventory updates (copied/shared from procurement service)
// ideally this should be in a shared inventory service
const updateInventory = async (data, transaction) => {
  // Update SiteInventory
  const [inventory] = await db.SiteInventory.findOrCreate({
    where: {
      siteId: data.siteId,
      itemId: data.itemId,
    },
    defaults: { quantity: 0 },
    transaction,
  });

  const newQuantity =
    data.type === "IN"
      ? inventory.quantity + data.change
      : inventory.quantity - data.change;

  // Simple status check
  const status = newQuantity <= 0 ? "Out of Stock" : "In Stock";

  await inventory.update(
    {
      quantity: newQuantity,
      status: status,
    },
    { transaction }
  );

  // Create StockLog
  await db.StockLog.create(data, { transaction });
};

module.exports = {
  createInvoice,
  createPayment,
  acceptInvoice,
  // Add other CRUD operations as needed
};
