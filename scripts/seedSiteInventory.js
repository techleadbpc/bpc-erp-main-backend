// scripts/seedSiteInventory.js

const { SiteInventory, Site, Item, sequelize } = require('../models');
// const faker = require('faker'); // optional, for realistic fake data

async function seedSiteInventories() {
  try {
    const sites = await Site.findAll();
    const items = await Item.findAll();

    if (!sites.length || !items.length) {
      console.log("No sites or items found. Please ensure both are seeded.");
      return;
    }

    const inventoryData = [];

    for (const site of sites) {
      // Assign 5–10 items to each site randomly
      const numberOfItems = Math.floor(Math.random() * 6) + 5;
      const shuffledItems = items.sort(() => 0.5 - Math.random());

      for (const item of shuffledItems.slice(0, numberOfItems)) {
        const quantity = parseFloat((Math.random() * 100).toFixed(2)); // up to 2 decimal places
        inventoryData.push({
          siteId: site.id,
          itemId: item.id,
          quantity,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Bulk insert
    await SiteInventory.bulkCreate(inventoryData);
    console.log(`✅ Seeded ${inventoryData.length} SiteInventory records.`);
  } catch (err) {
    console.error("❌ Error seeding SiteInventory:", err);
  } finally {
    await sequelize.close();
  }
}

seedSiteInventories();
