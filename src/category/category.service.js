const { Op } = require("sequelize");
const db = require("../../models");

// ✅ Create Primary Category
const createPrimaryCategory = async (data) => {
  return await db.PrimaryCategory.create(data);
};

// ✅ Get All Primary Categories with Machine Categories
const getAllPrimaryCategories = async () => {
  return await db.PrimaryCategory.findAll({
    include: [{ model: db.MachineCategory, as: "machineCategories" }],
  });
};

// ✅ Get Primary Category by ID
const getPrimaryCategoryById = async (id) => {
  const category = await db.PrimaryCategory.findByPk(id, {
    include: [{ model: db.MachineCategory, as: "machineCategories" }],
  });
  if (!category) throw new Error("Primary Category not found.");
  return category;
};

// ✅ Update Primary Category
const updatePrimaryCategory = async (id, data) => {
  const category = await db.PrimaryCategory.findByPk(id);
  if (!category) throw new Error("Primary Category not found.");
  await category.update(data);
  return category;
};

// ✅ Delete Primary Category
const deletePrimaryCategory = async (id) => {
  const category = await db.PrimaryCategory.findByPk(id);
  if (!category) throw new Error("Primary Category not found.");
  await category.destroy();
  return { message: "Primary Category deleted successfully." };
};

// ✅ Create Machine Category
const createMachineCategory = async (data) => {
  return await db.MachineCategory.create(data);
};

// ✅ Get All Machine Categories
const getAllMachineCategories = async () => {
  return await db.MachineCategory.findAll({
    include: [{ model: db.PrimaryCategory, as: "primaryCategory" }],
  });
};

// ✅ Get Machine Category by ID
const getMachineCategoryById = async (id) => {
  const category = await db.MachineCategory.findByPk(id, {
    include: [{ model: db.PrimaryCategory, as: "primaryCategory" }],
  });
  if (!category) throw new Error("Machine Category not found.");
  return category;
};

// ✅ Update Machine Category
const updateMachineCategory = async (id, data) => {
  const category = await db.MachineCategory.findByPk(id);
  if (!category) throw new Error("Machine Category not found.");
  await category.update(data);
  return category;
};

// ✅ Delete Machine Category
const deleteMachineCategory = async (id) => {
  const category = await db.MachineCategory.findByPk(id);
  if (!category) throw new Error("Machine Category not found.");
  await category.destroy();
  return { message: "Machine Category deleted successfully." };
};

const getAllMachineCategoriesV2 = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = "",
    sortBy = "name",
    sortOrder = "ASC",
    machineType,
    averageBase,
    primaryCategoryId,
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {};

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { remarks: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (machineType) whereClause.machineType = machineType;
  if (averageBase) whereClause.averageBase = averageBase;
  if (primaryCategoryId) whereClause.primaryCategoryId = primaryCategoryId;

  const { count, rows: categories } = await db.MachineCategory.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: db.PrimaryCategory,
        as: "primaryCategory",
        attributes: ["id", "name"],
      },
    ],
    order: [[sortBy, sortOrder]],
    offset,
    limit,
  });

  res.sendResponse({
    data: categories,
    totalCount: count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
  });
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
  getAllMachineCategoriesV2,
};
