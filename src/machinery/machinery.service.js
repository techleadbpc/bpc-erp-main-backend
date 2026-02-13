const { fn, col } = require("sequelize");
const db = require("../../models");

const REQUIRED_FIELDS_BY_TYPE = {
  Vehicle: ["erpCode", "registrationNumber", "machineNumber", "model", "make"],
  Machine: ["erpCode", "machineNumber", "capacity", "make", "yom"],
  Drilling: ["erpCode", "serialNumber", "model", "make", "unitPerHour"],
};

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = {
  async createMachinery(machineryData) {
    const transaction = await db.sequelize.transaction();
    try {
      const machinery = await db.Machinery.create(machineryData, {
        transaction,
      });
      await transaction.commit();
      return machinery;
    } catch (error) {
      await transaction.rollback();
      throw new CustomError(
        error.original.sqlMessage || "Failed to create machinery",
        500
      );
    }
  },

  async getAllMachinery(siteId, searchQuery) {
    // Prepare WHERE conditions
    const where = {};
    if (siteId) where.siteId = siteId;

    if (searchQuery) {
      const likeQuery = { [db.Sequelize.Op.like]: `%${searchQuery}%` };
      where[db.Sequelize.Op.or] = [
        { machineName: likeQuery },
        { erpCode: likeQuery },
        { machineCode: likeQuery },
        { serialNumber: likeQuery },
        { registrationNumber: likeQuery },
      ];
    }

    // Prepare INCLUDE option once
    const include = [
      {
        model: db.PrimaryCategory,
        as: "primaryCategory",
        attributes: ["name", "id"],
      },
      {
        model: db.MachineCategory,
        as: "machineCategory",
        attributes: ["name", "id"],
      },
      {
        model: db.Site,
        as: "site",
        attributes: ["name", "id", "code", "address"],
      },
    ];

    const attributes = [
      "id",
      "erpCode",
      "machineName",
      "status",
      "siteId",
      "machineCode",
      "machineNumber",
      "registrationNumber",
      "chassisNumber",
      "engineNumber",
      "serialNumber",
      "model",
      // "make",
      // "yom",
      // "fitnessCertificateExpiry",
      // "motorVehicleTaxDue",
      // "permitExpiryDate",
      // "nationalPermitExpiry",
      // "insuranceExpiry",
      // "pollutionCertificateExpiry",
      "isActive",
    ];

    // Fire single query
    return await db.Machinery.findAll({ where, include, attributes });
  },

  async getAllMachineryV2(siteId, searchQuery, page = 1, limit = 10) {
    const { Op } = db.Sequelize;
    const offset = (page - 1) * limit;

    const whereClause = {
      ...(searchQuery && {
        [Op.or]: [
          { machineName: { [Op.like]: `%${searchQuery}%` } },
          { erpCode: { [Op.like]: `%${searchQuery}%` } },
          { machineCode: { [Op.like]: `%${searchQuery}%` } },
          { serialNumber: { [Op.like]: `%${searchQuery}%` } },
          { registrationNumber: { [Op.like]: `%${searchQuery}%` } },
        ],
      }),
      ...(siteId && { siteId }),
    };

    const { count, rows } = await db.Machinery.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.PrimaryCategory,
          as: "primaryCategory",
          attributes: ["id", "name"],
        },
        {
          model: db.MachineCategory,
          as: "machineCategory",
          attributes: ["id", "name"],
        },
        {
          model: db.Site,
          as: "site",
          attributes: ["id", "name", "code", "address"],
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      data: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    };
  },

  async getMachineryById(machineryId) {
    const machine = await db.Machinery.findByPk(machineryId, {
      include: [
        { model: db.PrimaryCategory, as: "primaryCategory" },
        { model: db.MachineCategory, as: "machineCategory" },
        { model: db.Site, as: "site" },
      ],
    });
    if (!machine) {
      const error = new Error();
      error.message = "Machinery not found";
      error.name = "ResourceNotFoundError";
      error.statusCode = 404;
      throw error;
    }
    const sums = await db.LogbookEntry.findOne({
      attributes: [
        [fn("COALESCE", fn("SUM", col("dieselIssue")), 0), "sumDieselIssue"],
        [fn("COALESCE", fn("SUM", col("totalRunKM")), 0), "sumTotalRunKM"],
        [
          fn("COALESCE", fn("SUM", col("totalRunHrsMeter")), 0),
          "sumTotalRunHrsMeter",
        ],
      ],
      where: {
        machineId: machineryId, // assuming your LogbookEntry has a machineryId foreign key
      },
      raw: true, // returns plain object instead of Sequelize instance
    });

    return { ...machine?.dataValues, ...sums };
  },
  async getMachineryLogEntries(machineryId) {
    const machineLogs = await db.LogbookEntry.findAll({
      where: {
        machineId: machineryId, // assuming your LogbookEntry has a machineryId foreign key
      },
      order: [["createdAt", "DESC"]],
    });
    return machineLogs;
  },

  async updateMachinery(machineryId, machineryUpdates) {
    const machinery = await db.Machinery.findByPk(machineryId);
    if (!machinery) return null;
    return await machinery.update(machineryUpdates);
  },

  async deleteMachinery(machineryId) {
    const machinery = await db.Machinery.findByPk(machineryId);
    if (!machinery) return null;
    await machinery.destroy();
    return true;
  },
  async getExistingFiles(machineId) {
    const machine = await db.Machinery.findByPk(machineId, {
      attributes: [
        "fitnessCertificateFile",
        "pollutionCertificateFile",
        "insuranceFile",
        "permitFile",
        "nationalPermitFile",
      ],
    });
    return machine ? machine.toJSON() : {};
  },
};
