const { checkMachineryDocumentExpiries } = require("./checkDocumentExpiry");
const { checkLowAndOutOfStock } = require("./checkLowStockItems");
const { checkScheduledMaintenanceAlerts, checkMachineServiceIntervalAlerts } = require("./checkScheduledMaintenance");
const { checkMachineMaintenanceAlerts } = require("./checkMachineMaintenanceAlerts");

module.exports = {
  checkMachineryDocumentExpiry: checkMachineryDocumentExpiries,
  checkLowAndOutOfStock,
  checkScheduledMaintenanceAlerts,
  checkMachineServiceIntervalAlerts,
  checkMachineMaintenanceAlerts
};
