const { Op } = require('sequelize');
const db = require('../../models');

const getMachineServiceIntervals = async (machineId) => {
  return await db.MachineServiceInterval.findAll({
    where: { 
      machineId,
      isActive: true
    },
    order: [['serviceType', 'ASC']]
  });
};

const getMachineServiceIntervalById = async (id) => {
  return await db.MachineServiceInterval.findByPk(id);
};

const createMachineServiceInterval = async (data) => {
  // Calculate next service value based on last service value + interval
  if (data.lastServiceValue && data.intervalValue) {
    data.nextServiceValue = data.lastServiceValue + data.intervalValue;
  }

  return await db.MachineServiceInterval.create(data);
};

const updateMachineServiceInterval = async (id, data) => {
  const interval = await db.MachineServiceInterval.findByPk(id);
  if (!interval) throw new Error('Machine service interval not found');

  // Calculate next service value based on last service value + interval
  if (data.lastServiceValue && data.intervalValue) {
    data.nextServiceValue = data.lastServiceValue + data.intervalValue;
  } else if (data.intervalValue && interval.lastServiceValue) {
    data.nextServiceValue = interval.lastServiceValue + data.intervalValue;
  }

  return await interval.update(data);
};

const deleteMachineServiceInterval = async (id) => {
  const interval = await db.MachineServiceInterval.findByPk(id);
  if (!interval) throw new Error('Machine service interval not found');

  return await interval.destroy();
};

const getDueMachineServiceIntervals = async () => {
  const now = new Date();
  const dueIntervals = await db.MachineServiceInterval.findAll({
    where: {
      isActive: true,
      [Op.or]: [
        // Due based on hours
        {
          intervalType: 'hours',
          nextServiceValue: {
            [Op.lte]: db.sequelize.literal('(SELECT COALESCE(MAX(closingHrsMeter), 0) FROM logbook_entries WHERE machineId = MachineServiceInterval.machineId)')
          }
        },
        // Due based on kilometers
        {
          intervalType: 'kilometers',
          nextServiceValue: {
            [Op.lte]: db.sequelize.literal('(SELECT COALESCE(MAX(closingKmReading), 0) FROM logbook_entries WHERE machineId = MachineServiceInterval.machineId)')
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

  return dueIntervals;
};

const calculateNextServiceForMachine = async (machineId) => {
  // Get all service intervals for the machine
  const intervals = await db.MachineServiceInterval.findAll({
    where: { machineId, isActive: true }
  });

  // For each interval, calculate if it's due based on current readings
  const results = [];
  for (const interval of intervals) {
    let isDue = false;
    let currentValue = null;
    let remaining = null;

    if (interval.intervalType === 'hours' || interval.intervalType === 'kilometers') {
      // Get the latest logbook entry for the machine to get current reading
      const latestLogbook = await db.LogbookEntry.findOne({
        where: { machineId },
        order: [['date', 'DESC']]
      });

      if (latestLogbook) {
        currentValue = interval.intervalType === 'hours' ? latestLogbook.closingHrsMeter : latestLogbook.closingKmReading;
        
        if (currentValue && interval.nextServiceValue) {
          remaining = interval.nextServiceValue - currentValue;
          isDue = currentValue >= interval.nextServiceValue;
        }
      }
    } else if (interval.intervalType === 'calendar') {
      // For calendar-based intervals
      if (interval.nextServiceDate) {
        currentValue = new Date();
        remaining = (new Date(interval.nextServiceDate) - new Date()) / (1000 * 60 * 60 * 24); // days remaining
        isDue = new Date() >= new Date(interval.nextServiceDate);
      }
    }

    results.push({
      ...interval.toJSON(),
      isDue,
      currentValue,
      remaining
    });
  }

  return results;
};

module.exports = {
  getMachineServiceIntervals,
  getMachineServiceIntervalById,
  createMachineServiceInterval,
  updateMachineServiceInterval,
  deleteMachineServiceInterval,
  getDueMachineServiceIntervals,
  calculateNextServiceForMachine
};
