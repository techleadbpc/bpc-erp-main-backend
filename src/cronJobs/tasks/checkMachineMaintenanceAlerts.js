const { Op } = require("sequelize");
const db = require("./../../../models");
const roles = require("../../../utils/roles");

// Check if a maintenance alert notification already exists to prevent duplicates
const alreadyNotified = async (referenceId, eventAction, eventType = "MaintenanceAlert") => {
  // Get start of today (00:00:00)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await db.Notification.findOne({
    where: {
      eventType,
      referenceId,
      eventAction,
      createdAt: {
        [Op.gte]: today,
      },
    },
  });
  return !!existing;
};

// Get the latest log entry for a machine
const getLatestLogEntry = async (machineId) => {
  return await db.LogbookEntry.findOne({
    where: { machineId },
    order: [['date', 'DESC']],
    attributes: ['id', 'date', 'machineId', 'closingKmReading', 'closingHrsMeter']
  });
};

// Get the latest maintenance log for a machine
const getLatestMaintenanceLog = async (machineId) => {
  return await db.MaintenanceLog.findOne({
    where: { machineId },
    order: [['date', 'DESC']],
    attributes: ['id', 'date', 'machineId', 'hoursAtService', 'kilometersAtService']
  });
};

// Check for machine maintenance alerts based on intervals and current readings
const checkMachineMaintenanceAlerts = async () => {
  console.log("Running Machine Maintenance Alert Checks...");

  try {
    // Get all active machine service intervals
    const serviceIntervals = await db.MachineServiceInterval.findAll({
      where: { isActive: true },
      include: [{ model: db.Machinery, as: 'machine' }]
    });

    for (const interval of serviceIntervals) {
      const machineId = interval.machineId;

      // Get the latest log entry for the machine
      const latestLogEntry = await getLatestLogEntry(machineId);
      // Get the latest maintenance log for the machine
      const latestMaintenanceLog = await getLatestMaintenanceLog(machineId);

      let shouldAlert = false;
      let alertType = '';
      let alertMessage = '';
      let alertTitle = '';

      // If we have both log entry and maintenance log, perform comparison
      if (latestLogEntry && latestMaintenanceLog) {
        // Check hours-based interval
        if (interval.intervalHours > 0) {
          const currentHours = latestLogEntry.closingHrsMeter || 0;
          const lastServiceHours = latestMaintenanceLog.hoursAtService || 0;
          const nextServiceHours = lastServiceHours + interval.intervalHours;

          if (currentHours >= nextServiceHours) {
            shouldAlert = true;
            alertType = 'Hours';
            alertMessage = `SERVICE DUE: ${interval.serviceType} for Machine: ${interval.machine?.machineName} (Current Hours: ${currentHours}, Due at: ${nextServiceHours})`;
            alertTitle = `Service Due: ${interval.serviceType} - Hours Based`;
          }
        }

        // Check km-based interval
        if (interval.intervalKm > 0 && !shouldAlert) { // Only check if not already alerting for hours
          const currentKm = latestLogEntry.closingKmReading || 0;
          const lastServiceKm = latestMaintenanceLog.kilometersAtService || 0;
          const nextServiceKm = lastServiceKm + interval.intervalKm;

          if (currentKm >= nextServiceKm) {
            shouldAlert = true;
            alertType = 'Kilometers';
            alertMessage = `SERVICE DUE: ${interval.serviceType} for Machine: ${interval.machine?.machineName} (Current KM: ${currentKm}, Due at: ${nextServiceKm})`;
            alertTitle = `Service Due: ${interval.serviceType} - KM Based`;
          }
        }
      }

      // Check calendar-based interval
      if (interval.intervalCalendarDays > 0 && !shouldAlert) { // Only check if not already alerting for hours/km
        if (latestMaintenanceLog) {
          const lastServiceDate = new Date(latestMaintenanceLog.date);
          const nextServiceDate = new Date(lastServiceDate);
          nextServiceDate.setDate(nextServiceDate.getDate() + interval.intervalCalendarDays);
          const currentDate = new Date();

          if (currentDate >= nextServiceDate) {
            shouldAlert = true;
            alertType = 'Calendar';
            const nextServiceDateStr = nextServiceDate.toISOString().split('T')[0];
            alertMessage = `SERVICE DUE: ${interval.serviceType} for Machine: ${interval.machine?.machineName} (Due Date: ${nextServiceDateStr})`;
            alertTitle = `Service Due: ${interval.serviceType} - Calendar Based`;
          }
        } else {
          // If no maintenance log exists, check from the interval creation date
          const intervalCreationDate = new Date(interval.createdAt);
          const nextServiceDate = new Date(intervalCreationDate);
          nextServiceDate.setDate(nextServiceDate.getDate() + interval.intervalCalendarDays);
          const currentDate = new Date();

          if (currentDate >= nextServiceDate) {
            shouldAlert = true;
            alertType = 'Calendar';
            const nextServiceDateStr = nextServiceDate.toISOString().split('T')[0];
            alertMessage = `SERVICE DUE: ${interval.serviceType} for Machine: ${interval.machine?.machineName} (Due Date: ${nextServiceDateStr})`;
            alertTitle = `Service Due: ${interval.serviceType} - Calendar Based`;
          }
        }
      }

      // Create notification if alert is needed
      if (shouldAlert) {
        const notificationExists = await alreadyNotified(interval.id, `Service Due - ${alertType}`, "MachineMaintenanceAlert");
        if (!notificationExists) {
          await db.Notification.create({
            eventType: "MachineMaintenanceAlert",
            eventAction: `Service Due - ${alertType}`,
            title: alertTitle,
            referenceId: machineId,
            description: alertMessage,
            roles: [
              roles.ADMIN,
              roles.STORE_MANAGER,
              roles.PROJECT_MANAGER,
              roles.MECHANICAL_MANAGER,
            ],
          });
          console.log(`Created notification for machine ${interval.machine?.machineName}, service type: ${interval.serviceType}`);
        }
      }
    }

    console.log("Machine Maintenance Alert Checks completed.");
  } catch (error) {
    console.error("Error in checkMachineMaintenanceAlerts:", error);
    throw error;
  }
};

module.exports = {
  checkMachineMaintenanceAlerts,
  getLatestLogEntry,
  getLatestMaintenanceLog
};
