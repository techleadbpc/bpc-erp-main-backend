const db = require("./../../models");
const ROLES = require("../../utils/roles");
const createNotification = require("../events");
const { Op, col, fn } = require("sequelize");

const userDetails = async (id) => {
  return db.User.findByPk(id);
};

const siteDetail = async (id) => {
  return db.Site.findByPk(id);
};

const createMaterialIssue = async (data, issuedById) => {
  const issue = await db.sequelize.transaction(async (t) => {
    const { items, ...issueData } = data;

    // Check stock and lock quantities for each item
    for (const item of items) {
      const { itemId, quantity } = item;
      const siteId = issueData.siteId;

      const inventory = await db.SiteInventory.findOne({
        where: { siteId, itemId },
        transaction: t,
      });

      if (!inventory || inventory.quantity - inventory.lockedQuantity < quantity) {
        throw new Error(
          `Insufficient available stock at site ${siteId} for item ${itemId}. Available: ${inventory ? inventory.quantity - inventory.lockedQuantity : 0
          }`
        );
      }

      inventory.lockedQuantity += quantity;
      await inventory.save({ transaction: t });
    }

    const issue = await db.MaterialIssue.create(
      { ...issueData, issuedById, issuedAt: new Date() },
      { transaction: t }
    );

    const itemData = items.map((item) => ({
      ...item,
      materialIssueId: issue.id,
    }));

    await db.MaterialIssueItem.bulkCreate(itemData, { transaction: t });

    return await db.MaterialIssue.findByPk(issue.id, {
      transaction: t,
    });
  });

  const fromSite = await siteDetail(issue.siteId);
  console.log(fromSite)
  await createNotification({
    eventType: "MaterialIssue",
    eventAction: "Requested",
    referenceId: issue.id,
    siteId: issue.siteId,
    createdBy: issue.createdById,
    roles: [ROLES.STORE_MANAGER, ROLES.PROJECT_MANAGER],
    title: "Material Issue Requested",
    description: `A new material issue (#${issue.issueNumber}) has been created from site ${fromSite?.name}.`,
  });

  return issue;
};

const getMaterialIssueById = async (id) => {
  return await db.MaterialIssue.findByPk(id, {
    include: [
      {
        model: db.Requisition,
        as: "requisition",
        attributes: ["id", "requisitionNo"],
      },
      { model: db.User, as: "issuedBy", attributes: ["id", "name", "email"] },
      { model: db.User, as: "approvedBy", attributes: ["id", "name", "email"] },
      {
        model: db.User,
        as: "dispatchedBy",
        attributes: ["id", "name", "email"],
      },
      { model: db.User, as: "receivedBy", attributes: ["id", "name", "email"] },
      { model: db.User, as: "rejectedBy", attributes: ["id", "name", "email"] },
      { model: db.User, as: "consumedBy", attributes: ["id", "name", "email"] },
      { model: db.Site, as: "fromSite", attributes: ["id", "name", "code"] },
      { model: db.Site, as: "toSite", attributes: ["id", "name", "code"] },
      {
        model: db.MaterialIssueItem,
        as: "items",
        include: [
          { model: db.Item, include: { model: db.Unit } },
          {
            model: db.Machinery,
            as: "machine",
            attributes: [
              "id",
              "machineName",
              "registrationNumber",
              "erpCode",
              "machineNumber",
            ],
          },
        ],
      },
    ],
  });
};

const getAllMaterialIssues = async (siteId) => {
  if (siteId) {
    return await db.MaterialIssue.findAll({
      attributes: [
        "id",
        "issueNumber",
        "issueDate",
        "status",
        "issueType",
        [fn("COUNT", col("items.id")), "itemCount"],
        // Add fromSite and toSite attributes
        [col("fromSite.name"), "fromSiteName"],
        [col("fromSite.code"), "fromSiteCode"],
        [col("toSite.name"), "toSiteName"],
        [col("toSite.code"), "toSiteCode"],
      ],
      include: [
        {
          model: db.MaterialIssueItem,
          attributes: [], // Keep empty for aggregation
          as: "items",
        },
        {
          model: db.Site,
          as: "fromSite",
          attributes: [], // Set to empty since we're selecting in main attributes
        },
        {
          model: db.Site,
          as: "toSite",
          attributes: [], // Set to empty since we're selecting in main attributes
        },
      ],
      group: [
        "MaterialIssue.id",
        "MaterialIssue.issueNumber",
        "MaterialIssue.issueDate",
        "MaterialIssue.status",
        "MaterialIssue.issueType",
        "fromSite.id",
        "fromSite.name",
        "fromSite.code",
        "toSite.id",
        "toSite.name",
        "toSite.code",
      ],
      order: [["issueDate", "DESC"]],
      where: {
        [Op.or]: [{ otherSiteId: siteId }, { siteId: siteId }],
      },
      subQuery: false,
    });
  }
  return await db.MaterialIssue.findAll({
    attributes: [
      "id",
      "issueNumber",
      "issueDate",
      "status",
      "issueType",
      [fn("COUNT", col("items.id")), "itemCount"],
      // Add fromSite and toSite attributes
      [col("fromSite.name"), "fromSiteName"],
      [col("fromSite.code"), "fromSiteCode"],
      [col("toSite.name"), "toSiteName"],
      [col("toSite.code"), "toSiteCode"],
    ],
    include: [
      {
        model: db.MaterialIssueItem,
        attributes: [], // Keep empty for aggregation
        as: "items",
      },
      {
        model: db.Site,
        as: "fromSite",
        attributes: [], // Set to empty since we're selecting in main attributes
      },
      {
        model: db.Site,
        as: "toSite",
        attributes: [], // Set to empty since we're selecting in main attributes
      },
    ],
    group: [
      "MaterialIssue.id",
      "MaterialIssue.issueNumber",
      "MaterialIssue.issueDate",
      "MaterialIssue.status",
      "MaterialIssue.issueType",
      "fromSite.id",
      "fromSite.name",
      "fromSite.code",
      "toSite.id",
      "toSite.name",
      "toSite.code",
    ],
    order: [["issueDate", "DESC"]],
    subQuery: false,
  });
};

//  {
//           "id": 44,
//           "issueNumber": "ISS-044",
//           "issueDate": "2025-07-12T16:35:00.000Z",
//           "issueType": "Site Transfer",
//           "status": "Approved",
//           "siteId": 73,
//           "otherSiteId": 34,
//           "requisitionId": 76,
//           "approvedById": 7,
//           "approvedAt": "2025-07-12T11:06:37.444Z",
//           "issuedById": 21,
//           "issuedAt": "2025-07-12T11:05:45.638Z",
//           "consumedById": null,
//           "consumedAt": null,
//           "dispatchedById": null,
//           "dispatchedAt": null,
//           "receivedById": null,
//           "receivedAt": null,
//           "rejectedById": null,
//           "rejectedAt": null,
//           "rejectionReason": null,
//           "createdAt": "2025-07-12T11:05:45.638Z",
//           "updatedAt": "2025-07-12T11:06:37.444Z",
//           "items": [
//               {
//                   "id": 76,
//                   "materialIssueId": 44,
//                   "itemId": 21,
//                   "quantity": 1000,
//                   "issueTo": "Other Site",
//                   "siteId": 73,
//                   "otherSiteId": 34,
//                   "machineId": null,
//                   "Item": {
//                       "id": 21,
//                       "name": "Petrol",
//                       "shortName": "Petrol",
//                       "partNumber": "",
//                       "hsnCode": "",
//                       "itemGroupId": 12,
//                       "unitId": 5
//                   },
//                   "fromSite": {
//                       "id": 73,
//                       "name": "Bijepur Road Project Bargarh Odisha Project Site",
//                       "code": "SITE-073",
//                       "address": "Bijepur Road Project Bargarh Odisha Project Site",
//                       "pincode": "768018",
//                       "mobileNumber": "08292696711",
//                       "departmentId": 1,
//                       "status": "active",
//                       "createdAt": "2025-05-12T07:21:11.039Z",
//                       "updatedAt": "2025-05-12T07:21:11.204Z",
//                       "deletedAt": null
//                   },
//                   "toSite": {
//                       "id": 34,
//                       "name": "NTPC Patratu, Ramgarh",
//                       "code": "SITE-034",
//                       "address": "NTPC Patratu, Ramgarh, Jharkhand Project Site",
//                       "pincode": "829118",
//                       "mobileNumber": "8210765404",
//                       "departmentId": 1,
//                       "status": "active",
//                       "createdAt": "2025-05-09T06:14:13.615Z",
//                       "updatedAt": "2025-05-22T17:27:20.815Z",
//                       "deletedAt": null
//                   }
//               }
//           ]
//       },

const getMaterialIssuesBySite = async (siteId) => {
  return await db.MaterialIssue.findAll({
    include: [
      {
        model: db.MaterialIssueItem,
        as: "items",
        include: [{ model: db.Item }],
      },
    ],
    where: {
      fromSiteId: siteId,
    },
  });
};

const approveMaterialIssue = async (issueId, approvedById) => {
  return await db.sequelize.transaction(async (t) => {
    const issue = await db.MaterialIssue.findByPk(issueId, {
      transaction: t,
    });

    if (!issue) throw new Error("Material Issue not found");
    if (issue.status !== "Pending") throw new Error("Issue already processed");

    issue.status = "Approved";
    issue.approvedById = approvedById;
    issue.approvedAt = new Date();
    await issue.save({ transaction: t });

    await createNotification({
      eventType: "MaterialIssue",
      eventAction: "Approved",
      referenceId: issue.id,
      siteId: issue.siteId,
      createdBy: issue.approvedById,
      roles: [ROLES.STORE_MANAGER],
      title: "Material Issue Approved",
      description: `Material issue #${issue.issueNumber} has been approved.`,
    });

    return issue;
  });
};

const dispatchMaterialIssue = async (issueId, dispatchedById) => {
  return await db.sequelize.transaction(async (t) => {
    const issue = await db.MaterialIssue.findByPk(issueId, {
      include: [{ model: db.MaterialIssueItem, as: "items" }],
      transaction: t,
    });

    if (!issue) throw new Error("Material Issue not found");
    if (issue.status !== "Approved") throw new Error("Issue not approved");

    if (issue.issueType !== "Site Transfer")
      throw new Error("Invalid issue type");

    for (const item of issue.items) {
      const { itemId, quantity, siteId } = item;

      const fromInventory = await db.SiteInventory.findOne({
        where: { siteId, itemId },
        transaction: t,
      });

      if (!fromInventory || fromInventory.quantity < quantity) {
        throw new Error(
          `Insufficient stock at site ${siteId} for item ${itemId}`
        );
      }

      fromInventory.quantity -= quantity;
      fromInventory.lockedQuantity -= quantity; // Release lock upon dispatch
      if (fromInventory.lockedQuantity < 0) fromInventory.lockedQuantity = 0; // Guard against negative
      await fromInventory.save({ transaction: t });

      await db.StockLog.create(
        {
          siteId,
          itemId,
          change: -quantity,
          type: "OUT",
          sourceType: "Issue",
          sourceId: issue.id,
        },
        { transaction: t }
      );
    }
    issue.status = "Dispatched";
    issue.dispatchedById = dispatchedById;
    issue.dispatchedAt = new Date();
    await issue.save({ transaction: t });

    await createNotification({
      eventType: "MaterialIssue",
      eventAction: "Dispatched",
      referenceId: issue.id,
      siteId: issue.siteId,
      createdBy: issue.dispatchedById,
      roles: [ROLES.STORE_MANAGER],
      title: "Material Issue Dispatched",
      description: `Material issue #${issue.issueNumber} has been dispatched.`,
    });

    return issue;
  });
};

const receiveMaterialIssue = async (issueId, receivedById) => {
  return await db.sequelize.transaction(async (t) => {
    const issue = await db.MaterialIssue.findByPk(issueId, {
      include: [{ model: db.MaterialIssueItem, as: "items" }],
      transaction: t,
    });

    if (!issue) throw new Error("Material Issue not found");
    if (issue.status !== "Dispatched")
      throw new Error("Issue not dispatched yet");

    if (issue.issueType !== "Site Transfer")
      throw new Error("Invalid issue type");

    for (const item of issue.items) {
      const { itemId, quantity, otherSiteId } = item;

      const toInventory = await db.SiteInventory.findOne({
        where: { siteId: otherSiteId, itemId },
        transaction: t,
      });

      if (toInventory) {
        toInventory.quantity += quantity;
        await toInventory.save({ transaction: t });
      } else {
        await db.SiteInventory.create(
          {
            siteId: otherSiteId,
            itemId,
            quantity,
            minimumLevel: 0,
            status: "In Stock",
          },
          { transaction: t }
        );
      }

      await db.StockLog.create(
        {
          siteId: otherSiteId,
          itemId,
          change: quantity,
          type: "IN",
          sourceType: "Issue",
          sourceId: issue.id,
        },
        { transaction: t }
      );
    }

    issue.status = "Received";
    issue.receivedById = receivedById;
    issue.receivedAt = new Date();
    await issue.save({ transaction: t });

    await createNotification({
      eventType: "MaterialIssue",
      eventAction: "Received",
      referenceId: issue.id,
      siteId: issue.siteId,
      createdBy: issue.receivedById,
      roles: [ROLES.STORE_MANAGER],
      title: "Material Issue Received",
      description: `Material issue #${issue.issueNumber} has been received.`,
    });

    return issue;
  });
};

const issueForConsumption = async (issueId, consumedById) => {
  return await db.sequelize.transaction(async (t) => {
    const issue = await db.MaterialIssue.findByPk(issueId, {
      include: [{ model: db.MaterialIssueItem, as: "items" }],
      transaction: t,
    });

    if (!issue) throw new Error("Material Issue not found");
    if (issue.status !== "Approved") throw new Error("Issue not approved");
    if (issue.issueType !== "Consumption")
      throw new Error("Invalid issue type");

    for (const item of issue.items) {
      const { itemId, quantity, siteId } = item;

      const inventory = await db.SiteInventory.findOne({
        where: { siteId, itemId },
        transaction: t,
      });

      if (!inventory || inventory.quantity < quantity) {
        throw new Error(
          `Insufficient stock at site ${siteId} for item ${itemId}`
        );
      }

      inventory.quantity -= quantity;
      inventory.lockedQuantity -= quantity; // Release lock upon consumption
      if (inventory.lockedQuantity < 0) inventory.lockedQuantity = 0; // Guard against negative
      await inventory.save({ transaction: t });

      await db.StockLog.create(
        {
          siteId,
          itemId,
          change: -quantity,
          type: "OUT",
          sourceType: "Consumption",
          sourceId: issue.id,
        },
        { transaction: t }
      );
    }

    issue.status = "Consumed";
    issue.consumedById = consumedById;
    issue.consumedAt = new Date();
    await issue.save({ transaction: t });

    await createNotification({
      eventType: "MaterialIssue",
      eventAction: "Consumed",
      referenceId: issue.id,
      siteId: issue.siteId,
      createdBy: issue.consumedById,
      roles: [ROLES.STORE_MANAGER],
      title: "Material Consumed",
      description: `Material issue #${issue.issueNumber} has been consumed.`,
    });

    return issue;
  });
};

const rejectMaterialIssue = async (issueId, rejectedById, rejectionReason) => {
  return await db.sequelize.transaction(async (t) => {
    const issue = await db.MaterialIssue.findByPk(issueId, { transaction: t });

    if (!issue) throw new Error("Material Issue not found");
    if (
      ["Rejected", "Approved", "Dispatched", "Received", "Consumed"].includes(
        issue.status
      )
    ) {
      throw new Error(
        `Cannot reject. Issue already in '${issue.status}' state`
      );
    }

    issue.status = "Rejected";
    issue.rejectedById = rejectedById;
    issue.rejectedAt = new Date();
    issue.rejectionReason = rejectionReason;

    await issue.save({ transaction: t });

    // Release locked quantities
    const issueItems = await db.MaterialIssueItem.findAll({
      where: { materialIssueId: issueId },
      transaction: t,
    });

    for (const item of issueItems) {
      const { itemId, quantity, siteId } = item;
      const inventory = await db.SiteInventory.findOne({
        where: { siteId, itemId },
        transaction: t,
      });

      if (inventory) {
        inventory.lockedQuantity -= quantity;
        if (inventory.lockedQuantity < 0) inventory.lockedQuantity = 0;
        await inventory.save({ transaction: t });
      }
    }

    await createNotification({
      eventType: "MaterialIssue",
      eventAction: "Rejected",
      referenceId: issue.id,
      siteId: issue.siteId,
      createdBy: rejectedById,
      roles: [ROLES.STORE_MANAGER],
      title: "Material Issue Rejected",
      description: `Material issue #${issue.issueNumber
        } has been rejected. Reason: ${rejectionReason || "Not specified"}.`,
    });

    return issue;
  });
};

module.exports = {
  createMaterialIssue,
  getMaterialIssueById,
  getAllMaterialIssues,
  dispatchMaterialIssue,
  receiveMaterialIssue,
  getMaterialIssuesBySite,
  approveMaterialIssue,
  issueForConsumption,
  rejectMaterialIssue,
};
