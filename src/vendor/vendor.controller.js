const vendorService = require("./vendor.service");

const createVendor = async (req, res) => {
  const vendor = await vendorService.createVendor(req.body);
  res.sendResponse(vendor, "Vendor created successfully");
};

const getAllVendors = async (req, res) => {
  const vendors = await vendorService.getAllVendors(req.query);
  res.sendResponse(vendors);
};

const getVendorById = async (req, res) => {
  const vendor = await vendorService.getVendorById(req.params.id);
  res.sendResponse(vendor);
};

const updateVendor = async (req, res) => {
  const vendor = await vendorService.updateVendor(req.params.id, req.body);
  res.sendResponse(vendor, "Vendor updated successfully");
};

const deleteVendor = async (req, res) => {
  await vendorService.deleteVendor(req.params.id);
  res.sendResponse(null, "Vendor deleted successfully");
};

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor
};