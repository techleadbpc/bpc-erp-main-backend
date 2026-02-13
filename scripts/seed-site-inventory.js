// seeders/seed-site-inventory.js
const { Site, Item, SiteInventory } = require('../models');

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = async () => {
  try {
    const sites = await Site.findAll();
    const items = await Item.findAll();

    const inventories = [];

    for (const site of sites) {
      for (const item of items) {
        const quantity = randomNumber(10, 1000);

        inventories.push({
          siteId: site.id,
          itemId: item.id,
          quantity,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Clear existing data if needed
    await SiteInventory.destroy({ where: {} });

    await SiteInventory.bulkCreate(inventories);
    console.log(`✅ Seeded ${inventories.length} site inventory records.`);
  } catch (error) {
    console.error("❌ Error seeding site inventories:", error);
  }
};
