const { Op } = require("sequelize");
const db = require("./../../models");

const createVendor = async (data) => {
  return await db.Vendor.create(data);
};

const getAllVendors = async (query = {}) => {
  const { page = 1, limit = 10, search, isActive } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (isActive !== undefined) where.isActive = isActive;

  //   return await db.Vendor.findAndCountAll({
  //     where,
  //     limit: +limit,
  //     offset,
  //     order: [['name', 'ASC']]
  //   });
  return await db.Vendor.findAll({
    where,
    limit: +limit,
    offset,
    order: [["name", "ASC"]],
  });
};

const getVendorById = async (id) => {
  return await db.Vendor.findByPk(id);
};

const updateVendor = async (id, data) => {
  const vendor = await db.Vendor.findByPk(id);
  if (!vendor) throw new Error("Vendor not found");
  return await vendor.update(data);
};

const deleteVendor = async (id) => {
  const vendor = await db.Vendor.findByPk(id);
  if (!vendor) throw new Error("Vendor not found");
  return await vendor.destroy();
};

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
};
