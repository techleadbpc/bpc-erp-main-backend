const userService = require("./user.service");

async function createUser(req, res) {
  const user = await userService.createUser(req.body);
  res.sendResponse(user, "User created successfully", 201);
}

async function getAllUsers(req, res) {
  const users = await userService.getAllUsers(req.user.siteId);
  res.sendResponse(users, "Users retrieved successfully");
}

async function getUserById(req, res) {
  const user = await userService.getUserById(req.params.id, req.user.siteId);
  if (!user) {
    const error = new Error();
    error.message = "User not found";
    error.name = "ResourceNotFoundError";
    error.statusCode = 404;
    throw error;
  }
  res.sendResponse(user, "User retrieved successfully");
}

async function updateUser(req, res) {
  const user = await userService.updateUser(req.params.id, req.body);
  res.sendResponse(user, "User updated successfully");
}

async function deleteUser(req, res) {
  await userService.deleteUser(req.params.id);
  res.sendResponse("User deleted successfully");
}

async function restoreUser(req, res) {
  const user = await userService.restoreUser(req.params.id);
  res.sendResponse(user, "User restored successfully");
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  restoreUser,
};
