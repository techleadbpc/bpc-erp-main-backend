const { Requisition, MaterialIssue, Item, Site, User, RequisitionItem, MaterialIssueItem } = require('../models'); // Assuming your models are in a 'models' folder
const { Op } = require('sequelize');  // To use `Op` for filtering in queries

// Helper function to generate random dates within a range
const randomDate = (startDate, endDate) => {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return new Date(start + Math.random() * (end - start));
};

// Helper function to generate random numbers
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to generate random array element
const randomArrayElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Seed function for requisition and material issue
const seedData = async () => {
    try {
        // Fetch available sites, users, and items for the seed data
        const sites = await Site.findAll();
        const items = await Item.findAll();
        const users = await User.findAll();

        if (!sites.length || !items.length || !users.length) {
            console.log("Please ensure you have sites, items, and users in the database.");
            return;
        }

        // Generate random requisitions
        const requisitionsCount = 10;  // Number of requisitions to create
        for (let i = 0; i < requisitionsCount; i++) {
            const randomSite = randomArrayElement(sites);
            const randomUser = randomArrayElement(users);
            
            const requisition = await Requisition.create({
                requisitionNo: `REQ-${randomNumber(1000, 9999)}`,
                requestedAt: randomDate(new Date(2025, 0, 1), new Date()), // Random date within 2025
                requestingSiteId: randomSite.id,
                requestedFor: `${randomUser.firstName} ${randomUser.lastName}`,
                chargeType: randomArrayElement(['Project', 'Maintenance', 'Other']),
                requestPriority: randomArrayElement(['High', 'Medium', 'Low']),
                dueDate: randomDate(new Date(), new Date(2025, 11, 31)),
                preparedById: randomUser.id,
                status: randomArrayElement(['Pending', 'Approved', 'Rejected']),
            });

            // Randomly assign items to the requisition (RequisitionItems)
            const numItems = randomNumber(1, 5); // Randomly assign 1 to 5 items
            for (let j = 0; j < numItems; j++) {
                const randomItem = randomArrayElement(items);
                const quantity = randomNumber(1, 50); // Random quantity for each item

                await RequisitionItem.create({
                    requisitionId: requisition.id,
                    itemId: randomItem.id,
                    quantity: quantity,
                });
                console.log(`Requisition Item Created: REQ-${requisition.requisitionNo} - Item ${randomItem.name}`);
            }

            console.log(`Requisition Created: ${requisition.requisitionNo}`);
        }

        // Generate random material issues
        const materialIssuesCount = 10;  // Number of material issues to create
        for (let i = 0; i < materialIssuesCount; i++) {
            const randomSite = randomArrayElement(sites);
            const randomUser = randomArrayElement(users);
            const otherSite = randomArrayElement(sites.filter(site => site.id !== randomSite.id)); // Different site for `otherSite`
            
            const materialIssue = await MaterialIssue.create({
                materialIssueNo: `ISSUE-${randomNumber(1000, 9999)}`,
                issuedAt: randomDate(new Date(2025, 0, 1), new Date()), // Random date within 2025
                siteId: randomSite.id,
                issuedById: randomUser.id,
                issuedTo: `${randomUser.firstName} ${randomUser.lastName}`,
                issueType: randomArrayElement(["Consumption", "Site Transfer"]),
                status: randomArrayElement(['Issued', 'Returned']),
            });

            // Randomly assign items to the material issue (MaterialIssueItems)
            const numItems = randomNumber(1, 3); // Randomly assign 1 to 3 items
            for (let j = 0; j < numItems; j++) {
                const randomItem = randomArrayElement(items);
                const quantity = randomNumber(1, 20); // Random quantity for each item
                const issueTo = randomArrayElement(['Vehicle A', 'Person X', 'Workstation 1']); // Random issue target
                
                await MaterialIssueItem.create({
                    materialIssueId: materialIssue.id,
                    itemId: randomItem.id,
                    quantity: quantity,
                    issueTo: issueTo,  // Could be vehicle number, person, etc.
                    siteId: randomSite.id,
                    otherSiteId: otherSite.id,  // Random other site
                });
                console.log(`Material Issue Item Created: ISSUE-${materialIssue.materialIssueNo} - Item ${randomItem.name}`);
            }

            console.log(`Material Issue Created: ${materialIssue.materialIssueNo}`);
        }

        console.log("Seeding completed successfully!");
    } catch (error) {
        console.error("Error seeding data: ", error);
    }
};

// Execute the seed function
seedData();
