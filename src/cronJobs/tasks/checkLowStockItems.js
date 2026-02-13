const roles = require("../../../utils/roles");
const db = require("./../../../models");

const checkLowAndOutOfStock = async () => {
  const inventories = await db.SiteInventory.findAll({
    include: [
      { model: db.Item },
      { model: db.Site, where: { type: "physical" }, required: true },
    ],
  });

  for (const inv of inventories) {
    let eventAction = null;
    if (inv.quantity === 0) {
      eventAction = "Out of Stock";
    } else if (inv.quantity < inv.minimumLevel) {
      eventAction = "Low Stock";
    }

    if (eventAction) {
      await db.Notification.create({
        eventType: "LowStock",
        eventAction,
        referenceId: inv.itemId,
        siteId: inv.siteId,
        title: `${inv.Item.name} ${eventAction}`,
        description: `${inv.Item.name} is ${eventAction} at ${inv.Site?.name}`,
        roles: [
          roles.STORE_MANAGER,
          roles.PROJECT_MANAGER,
          roles.MECHANICAL_MANAGER,
        ],
      });
    }
  }
};

module.exports = {
  checkLowAndOutOfStock,
};
