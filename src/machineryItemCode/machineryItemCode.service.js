const db = require("../../models");

async function createMachineryItemCode(data) {
  return await db.MachineryItemCode.create(data);
}

async function getAllMachineryItemCodes() {
  return await db.MachineryItemCode.findAll();
}

async function getMachineryItemCodeById(id) {
  return await db.MachineryItemCode.findByPk(id);
}

async function updateMachineryItemCode(id, data) {
  const itemCode = await getMachineryItemCodeById(id);
  if (!itemCode) throw new Error("Machinery Item Code not found");
  return await itemCode.update(data);
}

async function deleteMachineryItemCode(id) {
  return await db.MachineryItemCode.destroy({ where: { id } });
}

async function restoreMachineryItemCode(id) {
  return await db.MachineryItemCode.restore({ where: { id } });
}

module.exports = {
  createMachineryItemCode,
  getAllMachineryItemCodes,
  getMachineryItemCodeById,
  updateMachineryItemCode,
  deleteMachineryItemCode,
  restoreMachineryItemCode,
};
