const { Op } = require("sequelize");
const db = require("../../models");

async function createUser(userData) {
  return await db.User.create(userData);
}

async function getAllUsers(siteId) {
  return await db.User.findAll({
    where: siteId ? { siteId } : {},
    include: [
      { model: db.Role, attributes: ["name", "id"] },
      { model: db.Site, attributes: ["name", "id"] },
    ],
    attributes: { exclude: ["password"] },
  });
}

async function getUserById(userId, siteId) {
  if (!userId) {
    throw new Error("User ID is required");
  }
  const whereCondition = { id: userId };

  if (siteId) {
    whereCondition.siteId = siteId;
  }
  return await db.User.findOne({
    where: whereCondition,
    include: [
      { model: db.Role, attributes: ["name", "id"] },
      { model: db.Site },
    ],
    attributes: { exclude: ["password"] },
  });
}

async function updateUser(userId, updateData) {
  const user = await db.User.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });
  if (!user) {
    const error = new Error();
    error.message = "User not found";
    error.name = "ResourceNotFoundError";
    error.statusCode = 404;
    throw error;
  }
  return await user.update(updateData);
}

async function deleteUser(userId) {
  const user = await db.User.findByPk(userId);
  if (!user) {
    const error = new Error();
    error.message = "User not found";
    error.name = "ResourceNotFoundError";
    error.statusCode = 404;
    throw error;
  }
  await user.destroy();
  return user;
}

async function restoreUser(userId) {
  const user = await db.User.findByPk(userId, { paranoid: false });
  if (!user) {
    const error = new Error();
    error.message = "User not found";
    error.name = "ResourceNotFoundError";
    error.statusCode = 404;
    throw error;
  }
  await user.restore();
  return user;
}

async function getAllUsersV2({
  siteId,
  page = 1,
  limit = 10,
  orderBy = "name",
  orderDirection = "ASC",
  search = "",
  filters = {},
}) {
  const offset = (page - 1) * limit;

  const whereClause = {
    ...(siteId && { siteId }),
    ...filters,
    ...(search && {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
      ],
    }),
  };

  const { count, rows } = await db.User.findAndCountAll({
    where: whereClause,
    include: [
      { model: db.Role, attributes: ["id", "name"] },
      { model: db.Site, attributes: ["id", "name"] },
    ],
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
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  restoreUser,
  getAllUsersV2,
};
