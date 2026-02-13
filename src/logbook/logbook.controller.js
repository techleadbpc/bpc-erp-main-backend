const { Op, or } = require("sequelize");
const db = require("./../../models");
const ROLES = require("../../utils/roles");
const createNotification = require("../events");

const createEntry = async (req, res) => {
  const entry = await db.LogbookEntry.create({
    ...req.body,
    createdBy: req.user.id,
    status: "Pending",
  });

  const fullEntry = await db.LogbookEntry.findByPk(entry.id, {
    include: [
      {
        model: db.Machinery,
        as: "machine",
        attributes: [
          "id",
          "machineName",
          "machineNumber",
          "registrationNumber",
          "erpCode",
        ],
      },
      { model: db.User, as: "creater", attributes: ["id", "name"] },
      { model: db.Site, as: "site", attributes: ["id", "name"] },
    ],
  });

  // Notify Project Manager
  await createNotification({
    eventType: "LogbookEntry",
    eventAction: "Created",
    referenceId: fullEntry.id,
    siteId: fullEntry.siteId,
    createdBy: req.user.id,
    roles: [ROLES.PROJECT_MANAGER],
    title: "New Logbook Entry Created",
    description: `A new logbook entry (${fullEntry.name}) has been created for machine ${fullEntry.machine?.machineName} at site ${fullEntry.site?.name}. Needs approval.`,
  });

  res.sendResponse(fullEntry, "Logbook entry created. Pending approval.");
};

const approveEntry = async (req, res) => {
  const { id } = req.params;
  const entry = await db.LogbookEntry.findByPk(id, {
    include: [{ model: db.Machinery, as: "machine" }],
  });

  if (!entry) return res.sendError({ message: "Entry not found" }, 404);
  if (entry.status !== "Pending") return res.sendError({ message: "Entry already processed" }, 400);

  await db.sequelize.transaction(async (t) => {
    entry.status = "Approved";
    entry.approvedById = req.user.id;
    entry.approvedAt = new Date();
    await entry.save({ transaction: t });

    // Update Machinery totals
    await db.Machinery.update(
      {
        totalKmRun: entry.totalRunKM || 0,
        totalHoursRun: entry.closingHrsMeter || 0,
      },
      { where: { id: entry.machineId }, transaction: t }
    );
  });

  // Notify relevant users
  await createNotification({
    eventType: "LogbookEntry",
    eventAction: "Approved",
    referenceId: entry.id,
    siteId: entry.siteId,
    createdBy: req.user.id,
    roles: [ROLES.STORE_MANAGER, ROLES.SITE_INCHARGE],
    title: "Logbook Entry Approved",
    description: `Logbook entry ${entry.name} has been approved by Project Manager.`,
  });

  res.sendResponse(entry, "Logbook entry approved");
};

const rejectEntry = async (req, res) => {
  const { id } = req.params;
  const { rejectionRemarks } = req.body;
  const entry = await db.LogbookEntry.findByPk(id);

  if (!entry) return res.sendError({ message: "Entry not found" }, 404);
  if (entry.status !== "Pending") return res.sendError({ message: "Entry already processed" }, 400);

  entry.status = "Rejected";
  entry.rejectedById = req.user.id;
  entry.rejectedAt = new Date();
  entry.rejectionRemarks = rejectionRemarks;
  await entry.save();

  // Notify relevant users
  await createNotification({
    eventType: "LogbookEntry",
    eventAction: "Rejected",
    referenceId: entry.id,
    siteId: entry.siteId,
    createdBy: req.user.id,
    roles: [ROLES.STORE_MANAGER, ROLES.SITE_INCHARGE],
    title: "Logbook Entry Rejected",
    description: `Logbook entry ${entry.name} has been rejected. Remarks: ${rejectionRemarks || "None"}`,
  });

  res.sendResponse(entry, "Logbook entry rejected");
};

const allEntry = async (req, res) => {
  const { machineId, date } = req.query;
  const { siteId } = req.user;
  const whereClause = {};

  if (siteId) {
    whereClause.siteId = siteId;
  }
  if (machineId) whereClause.machineId = machineId;
  if (date) whereClause.date = date;

  const entries = await db.LogbookEntry.findAll({
    where: whereClause,
    attributes: [
      "id",
      "name",
      "date",
      "totalRunKM",
      "dieselAvgKM",
      "dieselIssue",
      "totalRunHrsMeter",
      "dieselAvgHrsMeter",
      "dieselOpeningBalance",
      "dieselClosingBalance",
      "openingKmReading",
      "closingKmReading",
      "openingHrsMeter",
      "closingHrsMeter",
      "machineId", // Added
      "siteId", // Added
      "workingDetails", // Added
      "status", // Added
    ],
    include: [
      {
        model: db.Machinery,
        as: "machine",
        attributes: ["id", "machineName", "erpCode"], // Added id
      },
      { model: db.Site, as: "site", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });
  res.sendResponse(entries);
};

const entryDetails = async (req, res) => {
  const { siteId } = req.user;
  const entry = await db.LogbookEntry.findByPk(req.params.id, {
    include: [
      {
        model: db.Machinery,
        as: "machine",
        attributes: [
          "id",
          "machineName",
          "machineNumber",
          "registrationNumber",
          "erpCode",
        ],
      },
      { model: db.User, as: "creater", attributes: ["id", "name"] },
      { model: db.User, as: "approvedBy", attributes: ["id", "name"] },
      { model: db.User, as: "rejectedBy", attributes: ["id", "name"] },
      { model: db.Site, as: "site", attributes: ["id", "name", "address"] },
    ],
    where: {},
  });
  if (!entry)
    return res.sendError(
      { message: "Entry not found", name: "NotFoundError" },
      404
    );
  res.sendResponse(entry);
};

const updateEntry = async (req, res) => {
  const updated = await db.LogbookEntry.update(req.body, {
    where: { id: req.params.id },
  });
  res.sendResponse(updated, "Logbook entry updated");
};

const deleteEntry = async (req, res) => {
  await db.LogbookEntry.destroy({ where: { id: req.params.id } });
  res.sendResponse({}, "Logbook entry deleted");
};

const allEntryV2 = async (req, res) => {
  const {
    machineId,
    date,
    page = 1,
    limit = 20,
    orderBy = "date",
    orderDirection = "DESC",
    search = "",
  } = req.query;

  const { siteId } = req.user;
  const user = req.user;
  const offset = (page - 1) * limit;

  const whereClause = {};

  // Site Filtering Logic
  if (siteId && !user.siteId) {
    whereClause.siteId = siteId;
  } else if (!siteId && user.siteId) {
    whereClause.siteId = user.siteId;
  }

  if (machineId) whereClause.machineId = machineId;
  if (date) whereClause.date = date;

  // Main Query
  const { rows: entries, count } = await db.LogbookEntry.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: db.Machinery,
        as: "machine",
        attributes: [
          "id",
          "machineName",
          "machineNumber",
          "registrationNumber",
          "erpCode",
        ],
        where: search
          ? {
            [Op.or]: [
              { machineName: { [Op.iLike]: `%${search}%` } },
              { machineNumber: { [Op.iLike]: `%${search}%` } },
              { registrationNumber: { [Op.iLike]: `%${search}%` } },
            ],
          }
          : undefined,
      },
      {
        model: db.User,
        as: "creater",
        attributes: ["id", "name"],
      },
      {
        model: db.Site,
        as: "site",
        attributes: ["id", "name"],
      },
    ],
    order: [[orderBy, orderDirection]],
    offset,
    limit,
  });

  res.sendResponse({
    data: entries,
    currentPage: Number(page),
    totalPages: Math.ceil(count / limit),
    totalCount: count,
  });
};

const allMachines = async (req, res) => {
  // const { siteId } = req.user;
  const siteId = req.query.siteId || req.user.siteId; // Use query param or user context
  const { fn, col } = db.Sequelize;
  const whereClause = {};

  if (siteId) {
    whereClause.siteId = siteId;
  }
  const machines = await db.Machinery.findAll({
    attributes: [
      "id",
      "machineName",
      "machineNumber",
      "registrationNumber",
      "erpCode",
      // Aggregate sums from the joined LogbookEntry
      [
        fn("COALESCE", fn("SUM", col("logbookEntries.dieselIssue")), 0),
        "sumDieselIssue",
      ],
      [
        fn("COALESCE", fn("SUM", col("logbookEntries.totalRunKM")), 0),
        "sumTotalRunKM",
      ],
      [
        fn("COALESCE", fn("SUM", col("logbookEntries.totalRunHrsMeter")), 0),
        "sumTotalRunHrsMeter",
      ],
      [col("site.name"), "siteName"],
      [col("site.address"), "siteLocation"],
      [col("site.id"), "siteId"],
    ],
    where: whereClause, // machinery filter (e.g., siteId on Machinery if applicable)
    include: [
      {
        model: db.LogbookEntry,
        as: "logbookEntries",
        attributes: [], // no row-level attributes; we only want aggregates
        required: false, // LEFT JOIN
        // where: siteId ? { siteId } : undefined, // restrict joined rows by site if needed
      },
      {
        model: db.Site,
        as: "site",
        attributes: [],
      },
    ],
    group: [
      "Machinery.id",
      "Machinery.machineName",
      "Machinery.machineNumber",
      "Machinery.registrationNumber",
      "Machinery.erpCode",
      "site.name",
      "site.address",
      "site.id",
    ],
    order: [["machineName", "ASC"]],
    subQuery: false,
  });

  res.sendResponse(machines);
};
module.exports = {
  createEntry,
  allEntry,
  entryDetails,
  updateEntry,
  deleteEntry,
  allEntryV2,
  allMachines,
  approveEntry,
  rejectEntry,
};
