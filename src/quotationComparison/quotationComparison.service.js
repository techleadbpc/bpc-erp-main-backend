const db = require("../../models");
const { Op } = require("sequelize");
const cloudinary = require("../../utils/cloudinary");
const fs = require("fs");

class QuotationComparisonService {
  // Create a new quotation comparison from a requisition
  async createComparison(requisitionId, userId) {
    try {
      // Get the requisition with items
      const requisition = await db.Requisition.findByPk(requisitionId, {
        include: [
          {
            model: db.RequisitionItem,
            as: "items",
            include: [
              {
                model: db.Item,
                include: { model: db.Unit },
              },
            ],
          },
        ],
      });

      if (!requisition) {
        throw new Error("Requisition not found");
      }

      // Create the quotation comparison
      const comparison = await db.QuotationComparison.create({
        requisitionId: requisitionId,
        submittedById: userId,
        status: "draft",
      });

      // Create comparison items from requisition items
      for (const reqItem of requisition.items) {
        await db.QuotationComparisonItem.create({
          comparisonId: comparison.id,
          requisitionItemId: reqItem.id,
          itemId: reqItem.itemId,
          description:
            reqItem.Item.name ||
            reqItem.Item.description ||
            `Item ${reqItem.itemId}`,
          unit: reqItem.Item.Unit.name || "NOS", // Default to NOS if no unit
          quantity: reqItem.quantity,
        });
      }

      // Return the comparison with items
      return await this.getComparisonWithDetails(comparison.id);
    } catch (error) {
      throw error;
    }
  }

  // Get comparison with all details
  async getComparisonWithDetails(id) {
    try {
      const comparison = await db.QuotationComparison.findByPk(id, {
        include: [
          {
            model: db.Requisition,
            as: "requisition",
            include: [
              {
                model: db.Site,
                as: "requestingSite",
              },
            ],
          },
          {
            model: db.User,
            as: "submittedBy",
            attributes: ["id", "name", "email"],
          },
          {
            model: db.User,
            as: "approvedBy",
            attributes: ["id", "name", "email"],
          },
          {
            model: db.QuotationComparisonItem,
            as: "items",
            include: [
              {
                model: db.Item,
                as: "item",
                attributes: ["id", "name"],
                include: { model: db.Unit },
              },
              {
                model: db.QuotationComparisonRate,
                as: "rates",
                include: [
                  {
                    model: db.Vendor,
                    as: "vendor",
                    attributes: [
                      "id",
                      "name",
                      "email",
                      "contactPerson",
                      "phone",
                    ],
                  },
                ],
              },
            ],
            order: [[db.QuotationComparisonRate, "id", "ASC"]],
          },
          {
            model: db.QuotationComparisonVendor,
            as: "vendors",
            include: [
              {
                model: db.Vendor,
                as: "vendor",
              },
            ],
          },
        ],
      });

      if (!comparison) {
        throw new Error("Quotation comparison not found");
      }

      // Calculate totals and update lowest rates
      await this.calculateTotalsAndLowestRates(comparison.id);

      // Re-fetch with updated data
      return await db.QuotationComparison.findByPk(id, {
        include: [
          {
            model: db.Requisition,
            as: "requisition",
            include: [
              {
                model: db.Site,
                as: "requestingSite",
              },
            ],
          },
          {
            model: db.User,
            as: "submittedBy",
            attributes: ["id", "name", "email"],
          },
          {
            model: db.User,
            as: "approvedBy",
            attributes: ["id", "name", "email"],
          },
          {
            model: db.QuotationComparisonItem,
            as: "items",
            include: [
              {
                model: db.Item,
                as: "item",
                attributes: ["id", "name"],
                include: { model: db.Unit },
              },
              {
                model: db.QuotationComparisonRate,
                as: "rates",
                include: [
                  {
                    model: db.Vendor,
                    as: "vendor",
                    attributes: [
                      "id",
                      "name",
                      "email",
                      "contactPerson",
                      "phone",
                    ],
                  },
                ],
              },
            ],
            order: [[db.QuotationComparisonRate, "id", "ASC"]],
          },
          {
            model: db.QuotationComparisonVendor,
            as: "vendors",
            include: [
              {
                model: db.Vendor,
                as: "vendor",
              },
            ],
          },
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  // Add vendor to comparison
  async addVendorToComparison(comparisonId, vendorId) {
    try {
      const vendor = await db.Vendor.findByPk(vendorId);
      if (!vendor) {
        throw new Error("Vendor not found");
      }

      const existingVendor = await db.QuotationComparisonVendor.findOne({
        where: {
          comparisonId,
          vendorId,
        },
      });

      if (existingVendor) {
        throw new Error("Vendor already added to this comparison");
      }

      const comparisonVendor = await db.QuotationComparisonVendor.create({
        comparisonId,
        vendorId,
        vendorName: vendor.name,
      });

      return comparisonVendor;
    } catch (error) {
      throw error;
    }
  }

  // Update rate for a specific item and vendor
  async updateRate(
    comparisonId,
    comparisonItemId,
    vendorId,
    rate,
    remarks = null
  ) {
    try {
      const comparisonItem = await db.QuotationComparisonItem.findByPk(
        comparisonItemId
      );

      if (!comparisonItem || comparisonItem.comparisonId != comparisonId) {
        throw new Error("Invalid comparison item");
      }

      // Check if vendor exists in this comparison
      const comparisonVendor = await db.QuotationComparisonVendor.findOne({
        where: {
          comparisonId,
          vendorId,
        },
      });

      if (!comparisonVendor) {
        throw new Error("Vendor not associated with this comparison");
      }

      const amount = parseFloat(rate) * comparisonItem.quantity;

      // Check if rate record already exists
      let rateRecord = await db.QuotationComparisonRate.findOne({
        where: {
          comparisonItemId,
          vendorId,
        },
      });

      if (rateRecord) {
        // Update existing rate
        await rateRecord.update({
          rate: parseFloat(rate),
          amount: parseFloat(amount),
          remarks,
        });
      } else {
        // Create new rate
        rateRecord = await db.QuotationComparisonRate.create({
          comparisonItemId,
          vendorId,
          rate: parseFloat(rate),
          amount: parseFloat(amount),
          remarks,
        });
      }

      // Calculate totals and update lowest rates
      await this.calculateTotalsAndLowestRates(comparisonId);

      return rateRecord;
    } catch (error) {
      throw error;
    }
  }

  // Calculate totals and mark lowest rates
  async calculateTotalsAndLowestRates(comparisonId) {
    try {
      // Get all items for this comparison
      const items = await db.QuotationComparisonItem.findAll({
        where: { comparisonId },
        include: [
          {
            model: db.QuotationComparisonRate,
            as: "rates",
            include: [
              {
                model: db.Vendor,
                as: "vendor",
              },
            ],
          },
        ],
      });

      // Reset all isLowest flags
      await db.QuotationComparisonRate.update(
        { isLowest: false },
        {
          where: {
            comparisonItemId: { [Op.in]: items.map((item) => item.id) },
          },
        }
      );

      // Calculate totals for each vendor and find lowest rates
      const vendorTotals = {};

      for (const item of items) {
        // Find the lowest rate for this item
        if (item.rates && item.rates.length > 0) {
          // Sort rates by amount to find the lowest
          const sortedRates = [...item.rates].sort(
            (a, b) => a.amount - b.amount
          );
          const lowestRate = sortedRates[0];

          // Mark the lowest rate
          await db.QuotationComparisonRate.update(
            { isLowest: true },
            { where: { id: lowestRate.id } }
          );

          // Add to vendor totals
          for (const rate of item.rates) {
            if (!vendorTotals[rate.vendorId]) {
              vendorTotals[rate.vendorId] = 0;
            }
            vendorTotals[rate.vendorId] += parseFloat(rate.amount);
          }
        }
      }

      // Update vendor totals
      for (const [vendorId, total] of Object.entries(vendorTotals)) {
        await db.QuotationComparisonVendor.update(
          { totalAmount: total },
          {
            where: {
              comparisonId,
              vendorId,
            },
          }
        );
      }

      // Calculate overall total (lowest rate for each item)
      let overallTotal = 0;
      for (const item of items) {
        if (item.rates && item.rates.length > 0) {
          const lowestRate = item.rates.reduce(
            (lowest, rate) => (rate.amount < lowest.amount ? rate : lowest),
            item.rates[0]
          );
          overallTotal += parseFloat(lowestRate.amount);
        }
      }

      // Update comparison total
      await db.QuotationComparison.update(
        { totalAmount: overallTotal },
        { where: { id: comparisonId } }
      );
    } catch (error) {
      throw error;
    }
  }

  // Select vendor for a specific item
  async selectVendorForItem(comparisonId, comparisonItemId, vendorId) {
    try {
      const comparisonItem = await db.QuotationComparisonItem.findByPk(
        comparisonItemId
      );
      if (!comparisonItem || comparisonItem.comparisonId != comparisonId) {
        throw new Error("Invalid comparison item");
      }

      // Check if vendor exists in this comparison
      const comparisonVendor = await db.QuotationComparisonVendor.findOne({
        where: {
          comparisonId,
          vendorId,
        },
      });

      if (!comparisonVendor) {
        throw new Error("Vendor not associated with this comparison");
      }

      // Update the selected vendor for this item
      await comparisonItem.update({
        selectedVendorId: vendorId,
        selected: true,
      });

      return comparisonItem;
    } catch (error) {
      throw error;
    }
  }

  // Select vendor for multiple items in comparison (Bulk)
  async bulkSelectVendors(comparisonId, selections) {
    try {
      const results = [];
      const itemIds = Object.keys(selections);

      for (const itemId of itemIds) {
        const vendorId = selections[itemId];
        const item = await this.selectVendorForItem(
          parseInt(comparisonId),
          parseInt(itemId),
          parseInt(vendorId)
        );
        results.push(item);
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  // Select vendor for all items in comparison
  async selectVendorForAllItems(comparisonId, vendorId) {
    try {
      // Check if vendor exists in this comparison
      const comparisonVendor = await db.QuotationComparisonVendor.findOne({
        where: {
          comparisonId,
          vendorId,
        },
      });

      if (!comparisonVendor) {
        throw new Error("Vendor not associated with this comparison");
      }

      // Get all items for this comparison
      const items = await db.QuotationComparisonItem.findAll({
        where: { comparisonId },
      });

      if (items.length === 0) {
        throw new Error("No items found in this comparison");
      }

      // Update all items to use the selected vendor
      for (const item of items) {
        await item.update({
          selectedVendorId: vendorId,
          selected: true,
        });
      }

      // Return updated items
      return items;
    } catch (error) {
      throw error;
    }
  }

  // Submit comparison for approval
  async submitComparison(comparisonId, userId, remarks = null) {
    try {
      const comparison = await db.QuotationComparison.findByPk(comparisonId);
      if (!comparison) {
        throw new Error("Comparison not found");
      }

      if (comparison.status !== "draft") {
        throw new Error("Comparison can only be submitted from draft status");
      }

      await comparison.update({
        status: "submitted",
        submittedById: userId,
        submittedAt: new Date(),
        submissionRemarks: remarks || comparison.submissionRemarks,
        remarks: remarks || comparison.remarks,
      });

      return comparison;
    } catch (error) {
      throw error;
    }
  }

  // Approve comparison
  async approveComparison(comparisonId, userId, remarks = null) {
    try {
      const comparison = await db.QuotationComparison.findByPk(comparisonId);
      if (!comparison) {
        throw new Error("Comparison not found");
      }

      if (comparison.status !== "submitted") {
        throw new Error("Comparison must be submitted before approval");
      }

      await comparison.update({
        status: "approved",
        approvedById: userId,
        approvedAt: new Date(),
        approvalRemarks: remarks || comparison.approvalRemarks,
        remarks: remarks || comparison.remarks,
      });

      return comparison;
    } catch (error) {
      throw error;
    }
  }

  // Lock comparison after final approval
  async lockComparison(comparisonId, remarks = null) {
    try {
      const comparison = await db.QuotationComparison.findByPk(comparisonId);
      if (!comparison) {
        throw new Error("Comparison not found");
      }

      if (comparison.status !== "approved") {
        throw new Error("Comparison must be approved before locking");
      }

      await comparison.update({
        status: "locked",
        lockRemarks: remarks || comparison.lockRemarks,
        remarks: remarks || comparison.remarks,
      });

      return comparison;
    } catch (error) {
      throw error;
    }
  }

  // Get all comparisons for a requisition
  async getComparisonsForRequisition(requisitionId) {
    try {
      return await db.QuotationComparison.findAll({
        where: { requisitionId },
        include: [
          {
            model: db.User,
            as: "submittedBy",
            attributes: ["id", "name", "email"],
          },
          {
            model: db.User,
            as: "approvedBy",
            attributes: ["id", "name", "email"],
          },
          {
            model: db.QuotationComparisonVendor,
            as: "vendors",
            include: [
              {
                model: db.Vendor,
                as: "vendor",
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    } catch (error) {
      throw error;
    }
  }

  // Get all comparisons
  async getAllComparisons() {
    try {
      return await db.QuotationComparison.findAll({
        attributes: ["id", "requisitionId", "status", "createdAt", "comparisonNo", "totalAmount"],
        include: [
          {
            model: db.Requisition,
            as: "requisition",
            attributes: ["requisitionNo"],
          },
          {
            model: db.QuotationComparisonVendor,
            as: "vendors",
            attributes: ["vendorName", "totalAmount"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    } catch (error) {
      throw error;
    }
  }

  // Remove vendor from comparison
  async removeVendorFromComparison(comparisonId, vendorId) {
    try {
      // Check if vendor exists in this comparison
      const comparisonVendor = await db.QuotationComparisonVendor.findOne({
        where: {
          comparisonId,
          vendorId,
        },
      });

      if (!comparisonVendor) {
        throw new Error("Vendor not associated with this comparison");
      }

      // Delete all rate records for this vendor in this comparison
      const items = await db.QuotationComparisonItem.findAll({
        where: { comparisonId },
      });

      for (const item of items) {
        await db.QuotationComparisonRate.destroy({
          where: {
            comparisonItemId: item.id,
            vendorId: vendorId,
          },
        });
      }

      // Delete the vendor from the comparison
      await db.QuotationComparisonVendor.destroy({
        where: {
          comparisonId,
          vendorId,
        },
      });

      // Calculate totals and update lowest rates after removing vendor
      await this.calculateTotalsAndLowestRates(comparisonId);

      return { message: "Vendor removed successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Remove item from comparison
  async removeItem(comparisonId, itemId) {
    try {
      // Check if the item exists and belongs to the comparison
      const item = await db.QuotationComparisonItem.findByPk(itemId);
      if (!item || item.comparisonId !== comparisonId) {
        throw new Error("Item not found in this comparison");
      }

      // Delete all rate records associated with this item
      await db.QuotationComparisonRate.destroy({
        where: {
          comparisonItemId: itemId,
        },
      });

      // Delete the item itself
      await db.QuotationComparisonItem.destroy({
        where: {
          id: itemId,
          comparisonId: comparisonId,
        },
      });

      // Recalculate totals and update lowest rates after removing item
      await this.calculateTotalsAndLowestRates(comparisonId);

      return { message: "Item removed successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Bulk update rates and quantities
  async bulkUpdate(comparisonId, data) {
    try {
      const { rates = [], quantities = [] } = data;

      // Update rates
      for (const rateData of rates) {
        const { itemId, vendorId, rate, remarks = null } = rateData;

        // Verify the item belongs to the comparison
        const comparisonItem = await db.QuotationComparisonItem.findByPk(
          itemId
        );
        if (!comparisonItem || comparisonItem.comparisonId !== comparisonId) {
          throw new Error(`Item ${itemId} not found in this comparison`);
        }

        // Check if vendor exists in this comparison
        const comparisonVendor = await db.QuotationComparisonVendor.findOne({
          where: {
            comparisonId,
            vendorId,
          },
        });

        if (!comparisonVendor) {
          throw new Error(
            `Vendor ${vendorId} not associated with this comparison`
          );
        }

        // Calculate amount
        const amount = parseFloat(rate) * comparisonItem.quantity;

        // Check if rate record already exists
        let rateRecord = await db.QuotationComparisonRate.findOne({
          where: {
            comparisonItemId: itemId,
            vendorId,
          },
        });

        if (rateRecord) {
          // Update existing rate
          await rateRecord.update({
            rate: parseFloat(rate),
            amount: parseFloat(amount),
            remarks,
          });
        } else {
          // Create new rate
          await db.QuotationComparisonRate.create({
            comparisonItemId: itemId,
            vendorId,
            rate: parseFloat(rate),
            amount: parseFloat(amount),
            remarks,
          });
        }
      }
      // Update quantities
      for (const quantityData of quantities) {
        const { itemId, quantity } = quantityData;

        // Verify the item belongs to the comparison
        const comparisonItem = await db.QuotationComparisonItem.findByPk(
          itemId
        );

        if (!comparisonItem || comparisonItem.comparisonId !== comparisonId) {
          throw new Error(`Item ${itemId} not found in this comparison`);
        }

        // Update the quantity
        await comparisonItem.update({
          quantity: parseFloat(quantity),
        });

        // Update amounts for all rates of this item based on the new quantity
        const ratesForItem = await db.QuotationComparisonRate.findAll({
          where: {
            comparisonItemId: itemId,
          },
        });

        for (const rate of ratesForItem) {
          const newAmount = rate.rate * parseFloat(quantity);
          await rate.update({
            amount: parseFloat(newAmount),
          });
        }
      }

      // Calculate totals and update lowest rates after all updates
      await this.calculateTotalsAndLowestRates(comparisonId);

      return { message: "Bulk update completed successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Delete quotation comparison
  async deleteComparison(id) {
    try {
      const comparison = await db.QuotationComparison.findByPk(id);
      if (!comparison) {
        throw new Error("Quotation comparison not found");
      }
      // Delete all related records in the correct order to respect foreign key constraints
      // First delete rates
      await db.QuotationComparisonRate.destroy({
        where: {
          comparisonItemId: {
            [Op.in]: db.sequelize.literal(
              `(SELECT id FROM quotation_comparison_items WHERE "comparisonId" = ${id})`
            ),
          },
        },
      });

      // Then delete comparison items
      await db.QuotationComparisonItem.destroy({
        where: { comparisonId: id },
      });
      // Then delete vendors associated with this comparison
      await db.QuotationComparisonVendor.destroy({
        where: { comparisonId: id },
      });

      // Finally delete the comparison itself
      await db.QuotationComparison.destroy({
        where: { id },
      });

      return { message: "Quotation comparison deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Upload vendor attachment
  async uploadVendorAttachment(attachmentData) {
    try {
      const { comparisonId, vendorId, file, uploadedById } = attachmentData;

      // Check if the vendor is associated with the comparison
      const comparisonVendor = await db.QuotationComparisonVendor.findOne({
        where: {
          comparisonId,
          vendorId,
        },
      });

      if (!comparisonVendor) {
        throw new Error("Vendor not associated with this comparison");
      }

      // Update the comparison vendor record with attachment details
      await comparisonVendor.update({
        attachmentFilePath: file, // Store Cloudinary URL
        attachmentUploadedAt: new Date(),
        attachmentUploadedById: uploadedById,
      });

      // Return the updated vendor record with attachment details
      return await db.QuotationComparisonVendor.findByPk(comparisonVendor.id, {
        include: [
          {
            model: db.Vendor,
            as: "vendor",
          },
          {
            model: db.User,
            as: "attachmentUploadedBy",
            attributes: ["id", "name", "email"],
          },
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  // Get vendor attachments - now returns the attachment info from the vendor record
  async getVendorAttachments(comparisonId, vendorId) {
    try {
      // Check if the vendor is associated with the comparison
      const comparisonVendor = await db.QuotationComparisonVendor.findOne({
        where: {
          comparisonId,
          vendorId,
        },
        include: [
          {
            model: db.Vendor,
            as: "vendor",
          },
          {
            model: db.User,
            as: "attachmentUploadedBy",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      if (!comparisonVendor) {
        throw new Error("Vendor not associated with this comparison");
      }
      // Return the attachment information if it exists
      if (comparisonVendor.attachmentFilePath) {
        return [comparisonVendor]; // Return as array for consistency
      } else {
        return []; // Return empty array if no attachment
      }
    } catch (error) {
      throw error;
    }
  }

  // Delete attachment
  async deleteAttachment(comparisonId, vendorId) {
    try {
      // Check if the vendor is associated with the comparison
      const comparisonVendor = await db.QuotationComparisonVendor.findOne({
        where: {
          comparisonId,
          vendorId,
        },
      });

      if (!comparisonVendor) {
        throw new Error("Vendor not associated with this comparison");
      }

      // If there's an attachment, delete it from Cloudinary
      if (comparisonVendor.attachmentFilePath) {
        // Extract public ID from the Cloudinary URL for deletion
        const publicId = comparisonVendor.attachmentFilePath
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Clear the attachment fields in the database
      await comparisonVendor.update({
        attachmentFileName: null,
        attachmentFilePath: null,
        attachmentFileSize: null,
        attachmentMimeType: null,
        attachmentUploadedAt: null,
        attachmentUploadedById: null,
      });

      return { message: "Attachment deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Get attachment by vendorId (since we're storing one attachment per vendor)
  async getAttachmentByVendorId(comparisonId, vendorId) {
    try {
      const comparisonVendor = await db.QuotationComparisonVendor.findOne({
        where: {
          comparisonId,
          vendorId,
        },
        include: [
          {
            model: db.Vendor,
            as: "vendor",
          },
          {
            model: db.User,
            as: "attachmentUploadedBy",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      return comparisonVendor;
    } catch (error) {
      throw error;
    }
  }

  // Get attachment by ID (for download functionality)
  async getAttachmentById(comparisonId, vendorId) {
    try {
      const comparisonVendor = await db.QuotationComparisonVendor.findOne({
        where: {
          comparisonId,
          vendorId,
        },
        include: [
          {
            model: db.Vendor,
            as: "vendor",
          },
          {
            model: db.User,
            as: "attachmentUploadedBy",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      return comparisonVendor;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new QuotationComparisonService();
