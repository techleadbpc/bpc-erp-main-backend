const categoryService = require("./category.service");

// ✅ Create Primary Category
const createPrimaryCategory = async (req, res) => {
  const category = await categoryService.createPrimaryCategory(req.body);
  res.sendResponse(category, "Primary Category created successfully");
};

// ✅ Get All Primary Categories
const getAllPrimaryCategories = async (req, res) => {
  const categories = await categoryService.getAllPrimaryCategories();
  res.sendResponse(categories, "All Primary Categories fetched successfully");
};

// ✅ Get Primary Category by ID
const getPrimaryCategoryById = async (req, res) => {
  const category = await categoryService.getPrimaryCategoryById(req.params.id);
  res.sendResponse(category, "Primary Category fetched successfully");
};

// ✅ Update Primary Category
const updatePrimaryCategory = async (req, res) => {
  const category = await categoryService.updatePrimaryCategory(req.params.id, req.body);
  res.sendResponse(category, "Primary Category updated successfully");
};

// ✅ Delete Primary Category
const deletePrimaryCategory = async (req, res) => {
  const result = await categoryService.deletePrimaryCategory(req.params.id);
  res.sendResponse(null, result.message);
};

// ✅ Create Machine Category
const createMachineCategory = async (req, res) => {
  const category = await categoryService.createMachineCategory(req.body);
  res.sendResponse(category, "Machine Category created successfully");
};

// ✅ Get All Machine Categories
const getAllMachineCategories = async (req, res) => {
  const categories = await categoryService.getAllMachineCategories();
  res.sendResponse(categories, "All Machine Categories fetched successfully");
};

// ✅ Get Machine Category by ID
const getMachineCategoryById = async (req, res) => {
  const category = await categoryService.getMachineCategoryById(req.params.id);
  res.sendResponse(category, "Machine Category fetched successfully");
};

// ✅ Update Machine Category
const updateMachineCategory = async (req, res) => {
  const category = await categoryService.updateMachineCategory(req.params.id, req.body);
  res.sendResponse(category, "Machine Category updated successfully");
};

// ✅ Delete Machine Category
const deleteMachineCategory = async (req, res) => {
  const result = await categoryService.deleteMachineCategory(req.params.id);
  res.sendResponse(null, result.message);
};

module.exports = {
  createPrimaryCategory,
  getAllPrimaryCategories,
  getPrimaryCategoryById,
  updatePrimaryCategory,
  deletePrimaryCategory,
  createMachineCategory,
  getAllMachineCategories,
  getMachineCategoryById,
  updateMachineCategory,
  deleteMachineCategory,
};
