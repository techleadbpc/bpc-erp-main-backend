const { Op } = require("sequelize");
const db = require("./../../models");
const createNotification = require("../events");
const ROLES = require("../../utils/roles");

const userDetails = async (id) => {
  return db.User.findByPk(id);
};

const siteDetail = async (id) => {
  return db.Site.findByPk(id);
};

const requestTransfer = async (
  machineId,
  currentSiteId,
  destinationSiteId,
  reason,
  requestedBy,
  requestType,
  buyerDetails,
  scrapDetails,
  transportDetails,
  vehicleType
) => {
  const transfer = await db.MachineTransfer.create({
    machineId,
    currentSiteId,
    destinationSiteId,
    reason,
    requestedBy,
    requestType,
    buyerDetails,
    scrapDetails,
    transportDetails,
    vehicleType,
  });
  if (requestType == "Site Transfer") {
    await db.Machinery.update(
      { status: "In Transfer" },
      { where: { id: machineId } }
    );
  }
  const currentSite = await siteDetail(currentSiteId);
  const destinationSite = await siteDetail(destinationSiteId || 0);
  let title = "";
  let description = "";

  if (requestType === "Site Transfer") {
    title = "Machine Transfer Requested";
    description = `Machine transfer requested from Site ${currentSite.name} to Site ${destinationSite.name}.`;
  } else if (requestType === "Sell Machine") {
    title = "Machine Sell Requested";
    description = `Request to sell machine from Site ${currentSite.name}.`;
  } else if (requestType === "Scrap Machine") {
    title = "Machine Scrap Requested";
    description = `Request to scrap machine from Site ${currentSite.name}.`;
  }

  await createNotification({
    eventType: "MachineTransfer",
    eventAction: "Requested",
    referenceId: transfer.id,
    siteId: currentSiteId,
    createdBy: requestedBy,
    roles: [ROLES.ADMIN, ROLES.MECHANICAL_HEAD, ROLES.MECHANICAL_MANAGER, ROLES.SITE_INCHARGE, ROLES.STORE_MANAGER, ROLES.PROJECT_MANAGER], // example roles
    title,
    description,
  });

  return transfer;
};

const approveTranfer = async (id, approvedBy, remarks) => {
  const transfer = await db.MachineTransfer.findByPk(id);
  if (!transfer) {
    throw new Error("Transfer not found");
  }
  if (transfer.status !== "Pending") {
    throw new Error("Transfer not pending");
  }
  transfer.status = "Approved";
  transfer.approvedBy = approvedBy;
  transfer.approveRemarks = remarks;
  transfer.approvedAt = new Date();
  await transfer.save();
  if (
    transfer.requestType === "Sell Machine" ||
    transfer.requestType === "Scrap Machine"
  ) {
    const machine = await db.Machinery.findByPk(transfer.machineId);
    if (transfer.requestType === "Sell Machine") {
      machine.status = "Sold";
    }
    if (transfer.requestType === "Scrap Machine") {
      machine.status = "Scrap";
    }
    machine.siteId = null;
    await machine.save();
  }

  let title = "";
  let description = "";
  const currentSite = await siteDetail(transfer.currentSiteId);
  if (transfer.requestType === "Site Transfer") {
    title = "Machine Transfer Approved";
    description = `Transfer #${transfer.name} approved from Site ${currentSite.name}.`;
  } else if (transfer.requestType === "Sell Machine") {
    title = "Machine Sell Approved";
    description = `Machine sell request approved for machine #${transfer.name}.`;
  } else if (transfer.requestType === "Scrap Machine") {
    title = "Machine Scrap Approved";
    description = `Scrap request approved for machine #${transfer.name}.`;
  }

  await createNotification({
    eventType: "MachineTransfer",
    eventAction: "Approved",
    referenceId: transfer.id,
    siteId: transfer.currentSiteId,
    createdBy: approvedBy,
    roles: [ROLES.SITE_INCHARGE, ROLES.STORE_MANAGER, ROLES.PROJECT_MANAGER, ROLES.ADMIN, ROLES.MECHANICAL_HEAD, ROLES.MECHANICAL_MANAGER],
    title,
    description,
  });

  return transfer;
};

const dispatchMachine = async (id, dispatchedBy, userSiteId, updatedData) => {
  const transfer = await db.MachineTransfer.findByPk(id);
  if (!transfer) {
    throw new Error("Transfer not found");
  }
  if (transfer.status !== "Approved") {
    throw new Error("Transfer not approved yet");
  }
  if (transfer.currentSiteId !== userSiteId) {
    throw new Error("You are not allowed to dispatch this transfer");
  }
  Object.assign(transfer, {
    status: "Dispatched",
    fuelGaugeReading: updatedData.fuelGaugeReading,
    odometerReading: updatedData.odometerReading,
    itemsIncluded: updatedData.itemsIncluded,
    dispatchRemarks: updatedData.remarks,
    dispatchedBy,
    transportDetails: updatedData.transportDetails,
    dispatchedAt: new Date(),
    files: updatedData.files,
    hrsMeter: updatedData.hrsMeter,
  });

  await transfer.save();
  const currentSite = await siteDetail(transfer.currentSiteId);

  if (transfer.requestType === "Site Transfer") {
    await createNotification({
      eventType: "MachineTransfer",
      eventAction: "Dispatched",
      referenceId: transfer.id,
      siteId: transfer.currentSiteId,
      createdBy: dispatchedBy,
      roles: [
        ROLES.STORE_MANAGER,
        ROLES.SITE_INCHARGE,
        ROLES.PROJECT_MANAGER,
        ROLES.ADMIN,
        ROLES.MECHANICAL_HEAD,
        ROLES.MECHANICAL_MANAGER,
      ], // example roles
      title: "Machine Dispatched",
      description: `Machine dispatched from Site ${currentSite.name} for transfer #${transfer.name}.`,
    });
  }

  return transfer;
};

const receiveMachine = async (id, receivedBy, remarks, userSiteId, itemsReceived) => {
  const transfer = await db.MachineTransfer.findByPk(id);
  if (!transfer) {
    throw new Error("Transfer not found");
  }
  if (transfer.status !== "Dispatched") {
    throw new Error("Transfer not dispatched yet");
  }
  if (transfer.destinationSiteId !== userSiteId) {
    throw new Error("You are not allowed to dispatch this transfer");
  }
  transfer.status = "Received";
  transfer.receivedBy = receivedBy;
  transfer.finalRemarks = remarks;
  transfer.receivedAt = new Date();
  transfer.itemsReceived = itemsReceived;
  await transfer.save();
  // Update the machine's siteId to the destination siteId
  await db.Machinery.update(
    { siteId: transfer.destinationSiteId, status: "In Use" },
    { where: { id: transfer.machineId } }
  );

  const destinationSite = await siteDetail(transfer.destinationSiteId);

  if (transfer.requestType === "Site Transfer") {
    await createNotification({
      eventType: "MachineTransfer",
      eventAction: "Received",
      referenceId: transfer.id,
      siteId: transfer.destinationSiteId,
      createdBy: receivedBy,
      roles: [
        ROLES.STORE_MANAGER,
        ROLES.SITE_INCHARGE,
        ROLES.PROJECT_MANAGER,
        ROLES.ADMIN,
        ROLES.MECHANICAL_HEAD,
        ROLES.MECHANICAL_MANAGER,
      ], // example roles
      title: "Machine Received",
      description: `Machine received at Site ${destinationSite.name} for transfer #${transfer.name}.`,
    });
  }

  return transfer;
};

const rejectTransfer = async (id, rejectionRemarks, rejectedBy) => {
  const transfer = await db.MachineTransfer.findByPk(id);
  if (!transfer) {
    throw new Error("Transfer not found");
  }
  if (transfer.status !== "Pending") {
    throw new Error("Transfer not pending");
  }
  transfer.status = "Rejected";
  transfer.rejectionRemarks = rejectionRemarks;
  transfer.rejectedBy = rejectedBy;
  transfer.rejectedAt = new Date();
  await transfer.save();
  await db.Machinery.update(
    { status: "In Use" },
    { where: { id: transfer.machineId } }
  );
  let title = "";
  let description = "";
  const currentSite = await siteDetail(transfer.currentSiteId);

  if (transfer.requestType === "Site Transfer") {
    title = "Machine Transfer Rejected";
    description = `Transfer #${transfer.name} from Site ${currentSite.name} rejected.`;
  } else if (transfer.requestType === "Sell Machine") {
    title = "Machine Sell Rejected";
    description = `Sell request for machine #${transfer.machineId} was rejected.`;
  } else if (transfer.requestType === "Scrap Machine") {
    title = "Machine Scrap Rejected";
    description = `Scrap request for machine #${transfer.machineId} was rejected.`;
  }

  await createNotification({
    eventType: "MachineTransfer",
    eventAction: "Rejected",
    referenceId: transfer.id,
    siteId: transfer.currentSiteId,
    createdBy: rejectedBy,
    roles: [ROLES.SITE_INCHARGE, ROLES.STORE_MANAGER, ROLES.PROJECT_MANAGER, ROLES.ADMIN, ROLES.MECHANICAL_HEAD, ROLES.MECHANICAL_MANAGER],
    title,
    description,
  });

  return transfer;
};
const transferHistory = async (status, siteId) => {
  const whereClause = {};

  // Apply status filter if provided
  if (status) {
    whereClause.status = status;
  }

  if (siteId) {
    whereClause[Op.or] = [
      { currentSiteId: siteId },
      { destinationSiteId: siteId },
    ];
    // }
  }

  // If no siteId (admin), show all (with optional status filter only)
  const transfers = await db.MachineTransfer.findAll({
    where: whereClause,
    include: [
      { model: db.Machinery, as: "machine", attributes: ["machineName"] },
      { model: db.Site, as: "currentSite", attributes: ["id", "name"] },
      { model: db.Site, as: "destinationSite", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  return transfers;
};

const transferHistoryV2 = async ({
  status,
  siteId,
  searchQuery,
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "DESC",
}) => {
  const offset = (page - 1) * limit;
  const whereClause = {};

  // Filter by status if provided
  if (status) {
    whereClause.status = status;
  }

  // Filter by siteId (either current or destination)
  if (siteId) {
    whereClause[Op.or] = [
      { currentSiteId: siteId },
      { destinationSiteId: siteId },
    ];
  }

  // Search clause
  const searchFilter = searchQuery
    ? {
      [Op.or]: [
        { reason: { [Op.like]: `%${searchQuery}%` } },
        { approveRemarks: { [Op.like]: `%${searchQuery}%` } },
        { dispatchRemarks: { [Op.like]: `%${searchQuery}%` } },
        { rejectionRemarks: { [Op.like]: `%${searchQuery}%` } },
        { finalRemarks: { [Op.like]: `%${searchQuery}%` } },
        { "$machine.machineName$": { [Op.like]: `%${searchQuery}%` } },
        { "$currentSite.name$": { [Op.like]: `%${searchQuery}%` } },
        { "$destinationSite.name$": { [Op.like]: `%${searchQuery}%` } },
      ],
    }
    : {};

  const { count, rows } = await db.MachineTransfer.findAndCountAll({
    where: {
      ...whereClause,
      ...searchFilter,
    },
    include: [
      { model: db.Machinery, as: "machine", attributes: ["id", "machineName"] },
      { model: db.Site, as: "currentSite", attributes: ["id", "name"] },
      { model: db.Site, as: "destinationSite", attributes: ["id", "name"] },
      { model: db.User, as: "requester", attributes: ["id", "name"] },
      { model: db.User, as: "approver", attributes: ["id", "name"] },
      { model: db.User, as: "dispatcher", attributes: ["id", "name"] },
      { model: db.User, as: "receiver", attributes: ["id", "name"] },
    ],
    limit,
    offset,
    order: [[sortBy, sortOrder]],
  });

  return {
    data: rows,
    totalCount: count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
  };
};

const transferHistoryOfMachine = async (machineId) => {
  const history = await db.MachineTransfer.findAll({
    where: { machineId },
    order: [["createdAt", "DESC"]],
  });
  return history;
};

const dispachtedList = async (siteId) => {
  const transfers = await db.MachineTransfer.findAll({
    where: { status: "Dispatched", destinationSiteId: siteId },
    include: [
      { model: db.Machinery, as: "machine", attributes: ["machineName"] },
      { model: db.Site, as: "currentSite", attributes: ["id", "name"] },
      { model: db.Site, as: "destinationSite", attributes: ["id", "name"] },
      { model: db.User, as: "requester", attributes: ["id", "name"] },
      { model: db.User, as: "approver", attributes: ["id", "name"] },
      { model: db.User, as: "dispatcher", attributes: ["id", "name"] },
      { model: db.User, as: "receiver", attributes: ["id", "name"] },
    ],
  });
  return transfers;
};

const approvedList = async (siteId) => {
  const transfers = await db.MachineTransfer.findAll({
    where: { status: "Approved", currentSiteId: siteId },
    include: [
      { model: db.Machinery, as: "machine", attributes: ["machineName"] },
      { model: db.Site, as: "currentSite", attributes: ["id", "name"] },
      { model: db.Site, as: "destinationSite", attributes: ["id", "name"] },
      { model: db.User, as: "requester", attributes: ["id", "name"] },
      { model: db.User, as: "approver", attributes: ["id", "name"] },
      { model: db.User, as: "dispatcher", attributes: ["id", "name"] },
      { model: db.User, as: "receiver", attributes: ["id", "name"] },
    ],
  });
  return transfers;
};

const getTransferById = async (id) => {
  const transfer = await db.MachineTransfer.findByPk(id, {
    include: [
      {
        model: db.Machinery,
        as: "machine",
        attributes: [
          "machineName",
          "registrationNumber",
          "erpCode",
          "machineNumber",
          "machineCode",
          "serialNumber",
          "model",
          "chassisNumber",
          "engineNumber",
        ],
      },
      { model: db.Site, as: "currentSite", attributes: ["id", "name", "code"] },
      {
        model: db.Site,
        as: "destinationSite",
        attributes: ["id", "name", "code"],
      },
      { model: db.User, as: "requester", attributes: ["id", "name"] },
      { model: db.User, as: "approver", attributes: ["id", "name"] },
      { model: db.User, as: "dispatcher", attributes: ["id", "name"] },
      { model: db.User, as: "receiver", attributes: ["id", "name"] },
    ],
  });
  return transfer;
};

module.exports = {
  requestTransfer,
  approveTranfer,
  dispatchMachine,
  receiveMachine,
  transferHistory,
  transferHistoryOfMachine,
  rejectTransfer,
  dispachtedList,
  approvedList,
  getTransferById,
};
