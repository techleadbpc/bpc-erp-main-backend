const { Op } = require("sequelize");
const db = require("./../../models");

const getAllUnits = async () => {
  return await db.Unit.findAll({
    include: [{ model: db.Item }],
  });
};

const getUnitById = async (id) => {
  return await db.Unit.findByPk(id, {
    include: [{ model: db.Item }],
  });
};

const createUnit = async (data) => {
  return await db.Unit.create(data);
};

const updateUnit = async (id, data) => {
  const unit = await db.Unit.findByPk(id);
  if (!unit) throw new Error("Unit not found");
  return await unit.update(data);
};

const deleteUnit = async (id) => {
  const unit = await db.Unit.findByPk(id);
  if (!unit) throw new Error("Unit not found");
  await unit.destroy();
};

const getAllUnitsV2 = async ({
  page = 1,
  limit = 10,
  orderBy = "name",
  orderDirection = "ASC",
  search = "",
  filters = {},
}) => {
  const offset = (page - 1) * limit;

  const whereClause = {
    ...filters,
    ...(search && {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { shortName: { [Op.iLike]: `%${search}%` } },
      ],
    }),
  };

  const { count, rows } = await db.Unit.findAndCountAll({
    where: whereClause,
    include: [{ model: db.Item }],
    order: [[orderBy, orderDirection]],
    limit,
    offset,
  });

  return {
    data: rows,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
    totalCount: count,
  };
};

module.exports = {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
  getAllUnitsV2,
};
