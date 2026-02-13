const { Op } = require("sequelize");
const db = require("./../../../models");
const moment = require("moment");
const roles = require("../../../utils/roles");

const EXPIRY_FIELDS = [
  { field: "fitnessCertificateExpiry", label: "Fitness Certificate" },
  { field: "motorVehicleTaxDue", label: "Motor Vehicle Tax" },
  { field: "permitExpiryDate", label: "Permit" },
  { field: "nationalPermitExpiry", label: "National Permit" },
  { field: "insuranceExpiry", label: "Insurance" },
  { field: "pollutionCertificateExpiry", label: "Pollution Certificate" },
];

// Check if a notification already exists to prevent duplicates
const alreadyNotified = async (machineId, eventAction) => {
  const today = moment().startOf("day").toDate();
  const existing = await db.Notification.findOne({
    where: {
      eventType: "DocumentExpiry",
      referenceId: machineId,
      eventAction,
      createdAt: {
        [Op.gte]: today,
      },
    },
  });
  return !!existing;
};

const checkMachineryDocumentExpiries = async () => {
  const upcomingDate = moment().add(15, "days").toDate(); // 15 days notice

  const machineries = await db.Machinery.findAll({
    where: {
      [Op.or]: EXPIRY_FIELDS.map(({ field }) => ({
        [field]: { [Op.lte]: upcomingDate },
      })),
    },
    include: [{ model: db.Site, as: "site" }],
  });

  for (const machine of machineries) {
    for (const { field, label } of EXPIRY_FIELDS) {
      const expiryDate = machine[field];
      if (expiryDate && moment(expiryDate).isSameOrBefore(upcomingDate)) {
        const message = `${label} is expiring on ${moment(expiryDate).format(
          "YYYY-MM-DD"
        )} for Machine: ${machine.machineName} at ${machine.site?.name}`;

        const alreadyExists = await alreadyNotified(machine.id, "Expired");
        if (!alreadyExists) {
          await db.Notification.create({
            eventType: "DocumentExpiry",
            eventAction: "Expired",
            title: label,
            referenceId: machine.id,
            siteId: machine.siteId,
            description: message,
            roles: [
              roles.STORE_MANAGER,
              roles.PROJECT_MANAGER,
              roles.MECHANICAL_MANAGER,
            ],
          });
        }
      }
    }
  }
};

module.exports = {
  checkMachineryDocumentExpiries,
};
