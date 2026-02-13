const db = require("./../../models");
const ROLES = require("../../utils/roles");
const createNotification = require("../events");

const userDetail = async (id) => {
  return await db.User.findByPk(id);
};

const createRequisition = async (data, userId) => {
  const requisition = await db.sequelize.transaction(async (t) => {
    const { items, ...reqData } = data;
    const requisition = await db.Requisition.create(reqData, {
      transaction: t,
    });

    const itemData = items.map((item) => ({
      requisitionId: requisition.id,
      itemId: item.itemId,
      quantity: item.quantity,
    }));

    await db.RequisitionItem.bulkCreate(itemData, { transaction: t });

    return await db.Requisition.findByPk(requisition.id, {
      include: [{ model: db.RequisitionItem, as: "items" }],
      transaction: t,
    });
  });
  const user = await userDetail(userId);
  await createNotification({
    eventType: "MaterialRequisition",
    eventAction: "Requested",
    referenceId: requisition.id,
    siteId: requisition.requestingSiteId,
    createdBy: requisition.preparedById,
    roles: [ROLES.MECHANICAL_HEAD, ROLES.ADMIN, ROLES.MECHANICAL_MANAGER],
    title: "Material Requisition Requested",
    description: `New requisition (#${requisition.requisitionNo}) has been created by user #${user.name}.`,
  });

  return requisition;
};

const getRequisitionById = async (id) => {
  return await db.Requisition.findByPk(id, {
    include: [
      { model: db.RequisitionItem, as: "items", include: [{ model: db.Item }] },
      { model: db.User, as: "preparedBy", attributes: ["id", "name", "email"] },
      {
        model: db.Site,
        as: "requestingSite",
        attributes: ["id", "name", "code"],
      },
      {
        model: db.User,
        as: "approvedByPMUser",
        attributes: ["id", "name", "email"],
      },
      {
        model: db.User,
        as: "approvedByHOUser",
        attributes: ["id", "name", "email"],
      },
      { model: db.User, as: "rejectedBy", attributes: ["id", "name", "email"] },
      {
        model: db.User,
        as: "completedBy",
        attributes: ["id", "name", "email"],
      },
      {
        model: db.Site,
        as: "requestingSite",
        attributes: ["id", "name", "code"],
      },
      {
        model: db.MaterialIssue,
        as: "materialIssues",
        include: [
          {
            model: db.User,
            as: "issuedBy",
            attributes: ["id", "name", "email"],
          },
          {
            model: db.User,
            as: "approvedBy",
            attributes: ["id", "name", "email"],
          },
          {
            model: db.User,
            as: "dispatchedBy",
            attributes: ["id", "name", "email"],
          },
          {
            model: db.User,
            as: "receivedBy",
            attributes: ["id", "name", "email"],
          },
          {
            model: db.Site,
            as: "fromSite",
            attributes: ["id", "name", "code"],
          },
          { model: db.Site, as: "toSite", attributes: ["id", "name", "code"] },
          {
            model: db.MaterialIssueItem,
            as: "items",
            include: [{ model: db.Item }],
          },
        ],
      },
      {
        model: db.Procurement,
        as: "procurements",
        include: [
          {
            model: db.Vendor,
          },
          {
            model: db.ProcurementItem,
          },
        ],
      },
      {
        model: db.RequisitionSiteRejection,
        as: "siteRejections",
        include: [
          {
            model: db.User,
            as: "rejectedBy",
            attributes: ["id", "name", "email"],
          },
        ],
      },
    ],
  });
};

const getAllRequisitions = async (siteId) => {
  const includeOptions = [
    { model: db.User, as: "preparedBy", attributes: ["id", "name", "email"] },
    {
      model: db.Site,
      as: "requestingSite",
      attributes: ["id", "name", "code"],
    },
  ];
  //"pending", "approved", "received", "rejected", "approvedByPm", "approvedByHo", "completed"
  const whereOptions = {};
  if (siteId) {
    // OR operation
    whereOptions[db.Sequelize.Op.or] = [
      { requestingSiteId: siteId },
      { status: { [db.Sequelize.Op.in]: ["approvedByHo", "completed"] } },
    ];
  }

  if (!siteId) {
    whereOptions.status = { [db.Sequelize.Op.notIn]: ["pending"] };
  }

  return await db.Requisition.findAll({
    where: whereOptions,
    attributes: [
      "id",
      "requisitionNo",
      "status",
      "requestedFor",
      "chargeType",
      "requestPriority",
      "requestedAt",
    ],
    include: includeOptions,
    order: [["requestedAt", "DESC"]],
  });
};
const approveRequisition = async (requisitionId, userId) => {
  const requisition = await db.Requisition.findByPk(requisitionId);

  if (!requisition) {
    throw new Error("Requisition not found");
  }

  if (requisition.status !== "pending") {
    throw new Error("Requisition already processed");
  }

  requisition.status = "approved";
  requisition.approvedById = userId;
  requisition.approvedAt = new Date();
  await requisition.save();
  const user = await userDetail(userId);
  await createNotification({
    eventType: "MaterialRequisition",
    eventAction: "Approved",
    referenceId: requisition.id,
    siteId: requisition.requestingSiteId,
    createdBy: userId,
    roles: [ROLES.STORE_MANAGER],
    title: "Material Requisition Approved",
    description: `Requisition (#${requisition.requisitionNo}) has been approved by user #${user.name}.`,
  });

  return requisition;
};

const pmApproveRequisition = async (requisitionId, userId, userName) => {
  const requisition = await db.Requisition.findByPk(requisitionId, {
    include: [{ model: db.RequisitionItem, as: "items" }],
  });

  if (!requisition) throw new Error("Requisition not found");

  if (requisition.status !== "pending") throw new Error("Already processed");

  requisition.status = "approvedByPm";
  requisition.approvedByPM = userId;
  requisition.approvedAtPM = new Date();
  await requisition.save();
  const user = await userDetail(userId);
  await createNotification({
    eventType: "MaterialRequisition",
    eventAction: "PMApproved",
    referenceId: requisition.id,
    siteId: requisition.requestingSiteId,
    createdBy: userId,
    roles: [ROLES.MECHANICAL_HEAD, ROLES.ADMIN, ROLES.MECHANICAL_MANAGER],
    title: "Material Requisition PM Approved",
    description: `Requisition (#${requisition.requisitionNo}) has been approved by PM #${user.name}.`,
  });

  return requisition;
};

const hoApproveRequisition = async (requisitionId, userId) => {
  const requisition = await db.Requisition.findByPk(requisitionId, {
    include: [{ model: db.RequisitionItem, as: "items" }],
  });

  if (!requisition) throw new Error("Requisition not found");

  if (requisition.status !== "approvedByPm")
    throw new Error("Requisition must be approved by PM first");

  requisition.status = "approvedByHo";
  requisition.approvedByHO = userId;
  requisition.approvedAtHO = new Date();
  await requisition.save();
  const user = await userDetail(userId);
  await createNotification({
    eventType: "MaterialRequisition",
    eventAction: "HOApproved",
    referenceId: requisition.id,
    siteId: requisition.requestingSiteId,
    createdBy: userId,
    roles: [ROLES.MECHANICAL_HEAD, ROLES.ADMIN, ROLES.MECHANICAL_MANAGER],
    title: "Material Requisition HO Approved",
    description: `Requisition (#${requisition.requisitionNo}) has been approved by HO #${user.name}.`,
  });

  return requisition;
};

const requisitionDelete = async (requisitionId) => {
  const requisition = await db.Requisition.findByPk(requisitionId);
  if (!requisition) throw new Error("Requisition not found");

  await db.sequelize.transaction(async (t) => {
    await db.RequisitionItem.destroy({
      where: { requisitionId },
      transaction: t,
    });
    await requisition.destroy({ transaction: t });
  });

  return { message: "Requisition deleted successfully" };
};

const completeRequisition = async (requisitionId, userId) => {
  const requisition = await db.Requisition.findByPk(requisitionId);

  if (!requisition) {
    throw new Error("Requisition not found");
  }

  if (requisition.status !== "approvedByHo") {
    throw new Error("Only approved requisitions can be marked as completed");
  }

  requisition.status = "completed";
  requisition.completedById = userId;
  requisition.completedAt = new Date();
  await requisition.save();
  const user = await userDetail(userId);
  await createNotification({
    eventType: "MaterialRequisition",
    eventAction: "Completed",
    referenceId: requisition.id,
    siteId: requisition.requestingSiteId,
    createdBy: userId,
    roles: [ROLES.STORE_MANAGER],
    title: "Material Requisition Completed",
    description: `Requisition (#${requisition.requisitionNo}) has been marked as completed by user #${user.name}.`,
  });

  return requisition;
};

const rejectRequisition = async (
  requisitionId,
  rejectedById,
  rejectionReason
) => {
  const requisition = await db.Requisition.findByPk(requisitionId);

  if (!requisition) {
    throw new Error("Requisition not found");
  }

  if (["approved", "completed", "rejected"].includes(requisition.status)) {
    throw new Error(
      `Cannot reject. Requisition is already ${requisition.status}`
    );
  }

  requisition.status = "rejected";
  requisition.rejectedById = rejectedById;
  requisition.rejectedAt = new Date();
  requisition.rejectionReason = rejectionReason;
  const user = await userDetail(rejectedById);
  await requisition.save();

  await createNotification({
    eventType: "MaterialRequisition",
    eventAction: "Rejected",
    referenceId: requisition.id,
    siteId: requisition.requestingSiteId,
    createdBy: rejectedById,
    roles: [ROLES.STORE_MANAGER],
    title: "Material Requisition Rejected",
    description: `Requisition (#${requisition.requisitionNo
      }) has been rejected by user #${user.name}. Reason: ${rejectionReason || "Not provided"
      }`,
  });

  return requisition;
};

const rejectRequisitionBySite = async (requisitionId, rejectionData, user) => {
  // Get user's site
  const userWithSite = await db.User.findByPk(user.id, {
    include: [{ model: db.Site }],
  });
  if (!userWithSite || !userWithSite.Site) {
    throw new Error("User must be associated with a site");
  }

  // Find the requisition
  const requisition = await db.Requisition.findByPk(requisitionId);

  if (!requisition) {
    throw new Error("Requisition not found");
  }
  // Check if site is not the requesting site
  if (userWithSite.siteId === requisition.requestingSiteId) {
    throw new Error("Requesting site cannot reject its own requisition");
  }

  // Check if site already rejected this requisition
  const existingRejection = await db.RequisitionSiteRejection.findOne({
    where: {
      requisitionId: requisitionId,
      siteId: userWithSite.siteId,
    },
  });

  if (existingRejection) {
    throw new Error("Site has already rejected this requisition");
  }

  // Create the rejection record
  const rejection = await db.RequisitionSiteRejection.create({
    requisitionId: requisitionId,
    siteId: userWithSite.siteId,
    rejectedById: user.id,
    rejectionReason: rejectionData.rejectionReason,
  });
  return rejection;
};

const getRequisitionRejections = async (requisitionId) => {
  return await db.RequisitionSiteRejection.findAll({
    where: {
      requisitionId: requisitionId,
    },
    include: [
      {
        model: db.Site,
        as: "site",
        attributes: ["id", "name", "location"],
      },
      {
        model: db.User,
        as: "rejectedBy",
        attributes: ["id", "name", "email"],
      },
    ],
    order: [["rejectedAt", "DESC"]],
  });
};

const updateItemQuantity = async (requisitionId, items) => {
  return await db.sequelize.transaction(async (t) => {
    for (const item of items) {
      const { itemId, newQuantity } = item;
      const requisitionItem = await db.RequisitionItem.findOne({
        where: {
          requisitionId: requisitionId,
          id: itemId,
        },
        transaction: t,
      });
      if (!requisitionItem) {
        throw new Error("Requisition item not found");
      }
      requisitionItem.quantity = newQuantity;
      await requisitionItem.save({ transaction: t });
    }
  });
};

module.exports = {
  createRequisition,
  getRequisitionById,
  getAllRequisitions,
  approveRequisition,
  pmApproveRequisition,
  hoApproveRequisition,
  requisitionDelete,
  completeRequisition,
  rejectRequisition,
  rejectRequisitionBySite,
  getRequisitionRejections,
  updateItemQuantity,
};
