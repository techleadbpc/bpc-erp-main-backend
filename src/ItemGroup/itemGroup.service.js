const { Op } = require("sequelize");
const db = require("./../../models");

const getAllItemGroups = async () => {
  return await db.ItemGroup.findAll({
    include: [{ model: db.Item }],
  });
};

const getAllItemGroupsV2 = async ({
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
        { itemType: { [Op.iLike]: `%${search}%` } },
      ],
    }),
  };

  const { count, rows } = await db.ItemGroup.findAndCountAll({
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

const getItemGroupById = async (id) => {
  return await db.ItemGroup.findByPk(id, {
    include: [{ model: db.Item }],
  });
};

const createItemGroup = async (data) => {
  return await db.ItemGroup.create(data);
};

const updateItemGroup = async (id, data) => {
  const group = await db.ItemGroup.findByPk(id);
  if (!group) throw new Error("Item group not found");
  return await group.update(data);
};

const deleteItemGroup = async (id) => {
  const group = await db.ItemGroup.findByPk(id);
  if (!group) throw new Error("Item group not found");
  await group.destroy();
};

module.exports = {
  getAllItemGroups,
  getItemGroupById,
  createItemGroup,
  updateItemGroup,
  deleteItemGroup,
  getAllItemGroupsV2,
};
