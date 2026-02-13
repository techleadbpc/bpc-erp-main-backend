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

const checkScheduledMaintenanceAlerts = async () => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999); // End of next week

  // Find scheduled maintenance that are due soon
  const scheduledMaintenances = await db.MaintenanceLog.findAll({
    where: {
      status: 'scheduled', // Only check scheduled maintenance, not completed ones
      dueDate: {
        [Op.lte]: nextWeek,
        [Op.gte]: now,
      },
    },
    include: [{ model: db.Machinery, as: 'machine' }],
  });

  for (const schedule of scheduledMaintenances) {
    const dueDate = new Date(schedule.dueDate);
    let eventAction = null;
    let titlePrefix = "";

    // Determine alert type based on due date
    const scheduleDate = new Date(dueDate);
    scheduleDate.setHours(0, 0, 0, 0); // Compare just the date part
    const nowDate = new Date(now);
    nowDate.setHours(0, 0, 0, 0);
    const tomorrowDate = new Date(tomorrow);
    tomorrowDate.setHours(0, 0, 0, 0);

    if (scheduleDate.getTime() === nowDate.getTime()) {
      eventAction = "Due Today";
      titlePrefix = "Due Today";
    } else if (scheduleDate.getTime() === tomorrowDate.getTime()) {
      eventAction = "Due Tomorrow";
      titlePrefix = "Due Tomorrow";
    } else if (dueDate >= now && dueDate <= nextWeek) {
      eventAction = "Due Soon";
      titlePrefix = "Due Soon";
    }

    if (eventAction) {
      const message = `${titlePrefix}: ${schedule.title} for Machine: ${schedule.machine?.machineName}`;
      const title = `${titlePrefix}: ${schedule.title}`;

      const alreadyExists = await alreadyNotified(schedule.id, eventAction, "MaintenanceAlert");
      if (!alreadyExists) {
        await db.Notification.create({
          eventType: "MaintenanceAlert",
          eventAction,
          title,
          referenceId: schedule.id,
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

  // Also check for overdue maintenance
  // const overdueMaintenances = await db.MaintenanceLog.findAll({
  //   where: {
  //     status: 'scheduled', // Only check scheduled maintenance that should have been completed
  //     dueDate: {
  //       [Op.lt]: now,
  //     },
  //   },
  //   include: [{ model: db.Machinery, as: 'machine' }],
  // });

  // for (const schedule of overdueMaintenances) {
  //   const dueDateString = new Date(schedule.dueDate).toISOString().split('T')[0]; // Format as YYYY-MM-DD
  //   const message = `OVERDUE: ${schedule.title} for Machine: ${schedule.machine?.machineName} (Due: ${dueDateString})`;
  //   const title = `OVERDUE: ${schedule.title}`;

  //   const alreadyExists = await alreadyNotified(schedule.id, "Overdue", "MaintenanceAlert");
  //   if (!alreadyExists) {
  //     await db.Notification.create({
  //       eventType: "MaintenanceAlert",
  //       eventAction: "Overdue",
  //       title,
  //       referenceId: schedule.id,
  //       description: message,
  //       roles: [
  //         roles.STORE_MANAGER,
  //         roles.PROJECT_MANAGER,
  //         roles.MECHANICAL_MANAGER,
  //       ],
  //     });
  //   }
  // }
};

// Check for machine service intervals that are due based on hours/km readings
const checkMachineServiceIntervalAlerts = async () => {
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Find all active machine service intervals that are due based on hours or kilometers
  const dueIntervals = await db.MachineServiceInterval.findAll({
    where: {
      isActive: true,
      [Op.or]: [
        // Due based on hours
        {
          intervalType: 'hours',
          nextServiceValue: {
            [Op.lte]: db.sequelize.literal('(SELECT COALESCE(MAX("closingHrsMeter"), 0) FROM logbook_entries WHERE machineId = MachineServiceInterval.machineId)')
          }
        },
        // Due based on kilometers
        {
          intervalType: 'kilometers',
          nextServiceValue: {
            [Op.lte]: db.sequelize.literal('(SELECT COALESCE(MAX("closingKmReading"), 0) FROM logbook_entries WHERE machineId = MachineServiceInterval.machineId)')
          }
        },
        // Due based on calendar date
        {
          intervalType: 'calendar',
          nextServiceDate: {
            [Op.lte]: now
          }
        }
      ]
    },
    include: [{ model: db.Machinery, as: 'machine' }]
  });

  for (const interval of dueIntervals) {
    const message = `SERVICE DUE: ${interval.serviceType} for Machine: ${interval.machine?.machineName} (Interval: ${interval.intervalValue} ${interval.intervalType})`;
    const title = `Service Due: ${interval.serviceType}`;

    const alreadyExists = await alreadyNotified(interval.id, "Service Due", "MachineServiceIntervalAlert");
    if (!alreadyExists) {
      await db.Notification.create({
        eventType: "MachineServiceIntervalAlert",
        eventAction: "Service Due",
        title,
        referenceId: interval.id,
        description: message,
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
  checkScheduledMaintenanceAlerts,
  checkMachineServiceIntervalAlerts
};
