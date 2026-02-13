const cron = require("node-cron");
const {
  checkMachineryDocumentExpiry,
  checkLowAndOutOfStock,
  checkScheduledMaintenanceAlerts,
  // checkMachineServiceIntervalAlerts,
  checkMachineMaintenanceAlerts
} = require("./tasks");

module.exports = function startCronJobs() {
  // Run every day at 7 AM
  cron.schedule("0 7 * * *", async () => {
    console.log("Running Low Stock and Document Expiry Checks...");
    try {
      await checkMachineryDocumentExpiry();
      await checkLowAndOutOfStock();
    } catch (error) {
      console.log(error);
    }
  });

  // Run every day at 8 AM to check for maintenance alerts
  cron.schedule("0 8 * * *", async () => {
    console.log("Running Scheduled Maintenance Alert Checks...");
    try {
      // await checkScheduledMaintenanceAlerts();
      // await checkMachineServiceIntervalAlerts(); // Check machine service intervals as well
      await checkMachineMaintenanceAlerts(); // Check machine maintenance alerts based on intervals and current readings
    } catch (error) {
      console.log(error);
    }
  });
};
