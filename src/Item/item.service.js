const { Op } = require("sequelize");
const db = require("./../../models");

const getAllItems = async () => {
  return await db.Item.findAll({
    include: [{ model: db.ItemGroup }, { model: db.Unit }],
  });
};

const getItemById = async (id) => {
  return await db.Item.findByPk(id, {
    include: [{ model: db.ItemGroup }, { model: db.Unit }],
  });
};

const createItem = async (data) => {
  return await db.Item.create(data);
};

const updateItem = async (id, data) => {
  const item = await db.Item.findByPk(id);
  if (!item) throw new Error("Item not found");
  return await item.update(data);
};

const deleteItem = async (id) => {
  const item = await db.Item.findByPk(id);
  if (!item) throw new Error("Item not found");
  await item.destroy();
};

const getAllItemsV2 = async ({
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
        { partNumber: { [Op.iLike]: `%${search}%` } },
        { hsnCode: { [Op.iLike]: `%${search}%` } },
      ],
    }),
  };

  const { count, rows } = await db.Item.findAndCountAll({
    where: whereClause,
    include: [{ model: db.ItemGroup }, { model: db.Unit }],
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
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getAllItemsV2,
};
