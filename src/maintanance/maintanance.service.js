// services/maintanance.service.js
const { Op } = require('sequelize');
const db = require('./../../models'); // assuming you have index.js exporting all models
const { MaintenanceLog } = db;

// Maintenance Logs
const getMaintenanceLogById = async (id) => {
    return await MaintenanceLog.findByPk(id);
};

const createMaintenanceLog = async (data) => {
    return await MaintenanceLog.create(data);
};

const updateMaintenanceLog = async (id, data) => {
    const log = await MaintenanceLog.findByPk(id);
    if (!log) throw new Error('Maintenance log not found');
    return await log.update(data);
};

const getMaintenanceLogsByMachine = async (machineId) => {
    return await MaintenanceLog.findAll({ 
        where: { machineId }, 
        order: [['date', 'DESC']] 
    });
};

// Scheduled Maintenance functions - now using MaintenanceLog model
const getScheduledMaintenanceById = async (id) => {
    return await MaintenanceLog.findByPk(id);
};

const createScheduledMaintenance = async (data) => {
    // Set default status to 'scheduled' for scheduled maintenance
    data.status = 'scheduled';
    return await MaintenanceLog.create(data);
};

const updateScheduledMaintenance = async (id, data) => {
    const scheduled = await MaintenanceLog.findByPk(id);
    if (!scheduled) throw new Error('Maintenance log not found');
    
    // If status is being updated to completed, update the status
    if (data.status === 'completed') {
        data.status = 'completed';
        data.lastAlertDate = new Date(); // Mark when it was completed
    }
    
    return await scheduled.update(data);
};

const getScheduledMaintenancesByMachine = async (machineId) => {
    return await MaintenanceLog.findAll({ 
        where: { 
            machineId,
            status: { [Op.in]: ['scheduled', 'overdue', 'due_today'] }
        }, 
        order: [['dueDate', 'ASC']] 
    });
};

// New functions for maintenance summary and alerts
const getLastMaintenanceByMachine = async (machineId) => {
    return await MaintenanceLog.findOne({
        where: { machineId },
        order: [['date', 'DESC']],
        include: [{ model: db.Machinery, as: 'machine' }]
    });
};

const getNextMaintenanceByMachine = async (machineId) => {
    const now = new Date();
    return await MaintenanceLog.findOne({
        where: {
            machineId,
            status: { [Op.in]: ['scheduled', 'overdue', 'due_today'] },
            dueDate: { [Op.gte]: now }
        },
        order: [['dueDate', 'ASC']],
        include: [{ model: db.Machinery, as: 'machine' }]
    });
};

const getMaintenanceAlerts = async (machineId) => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const weekLater = new Date();
    weekLater.setDate(now.getDate() + 7);
    
    const alerts = await MaintenanceLog.findAll({
        where: {
            machineId,
            status: { [Op.in]: ['scheduled', 'overdue', 'due_today'] },
            dueDate: { [Op.gte]: now },
            dueDate: { [Op.lte]: weekLater }
        },
        order: [['dueDate', 'ASC']],
        include: [{ model: db.Machinery, as: 'machine' }]
    });
    
    // Add alert status based on due date
    return alerts.map(alert => {
        const alertDate = new Date(alert.dueDate);
        let status = 'upcoming';
        if (alertDate.toDateString() === now.toDateString()) {
            status = 'due_today';
        } else if (alertDate < new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)) {
            status = 'due_soon';
        }
        return {
            ...alert.toJSON(),
            alertStatus: status
        };
    });
};

const getMaintenanceSummaryByMachine = async (machineId) => {
    const now = new Date();
    const [lastMaintenance, nextMaintenance] = await Promise.all([
        getLastMaintenanceByMachine(machineId),
        getNextMaintenanceByMachine(machineId)
    ]);
    
    // Get maintenance alerts for the next 7 days
    const alerts = await getMaintenanceAlerts(machineId);
    
    // Get total maintenance count
    const totalMaintenanceCount = await MaintenanceLog.count({ where: { machineId } });
    
    // Get overdue maintenance
    const overdueCount = await MaintenanceLog.count({
        where: {
            machineId,
            dueDate: { [Op.lt]: now },
            status: { [Op.in]: ['scheduled', 'due_today'] } // Only count scheduled or due_today as overdue, not completed ones
        }
    });
    
    return {
        lastMaintenance: lastMaintenance ? lastMaintenance : null,
        nextMaintenance: nextMaintenance ? nextMaintenance : null,
        alerts,
        totalMaintenanceCount,
        overdueCount
    };
};

const getMaintenanceStatsByMachine = async (machineId) => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const totalRecords = await MaintenanceLog.count({ where: { machineId } });

    const lastMaintenance = await MaintenanceLog.findOne({
        where: { machineId },
        order: [['date', 'DESC']],
    });

    const nextScheduled = await MaintenanceLog.findOne({
        where: {
            machineId,
            status: { [Op.in]: ['scheduled', 'overdue', 'due_today'] },
            dueDate: { [Op.gte]: now }
        },
        order: [['dueDate', 'ASC']],
    });

    const totalCostYTDResult = await MaintenanceLog.findAll({
        where: {
            machineId,
            date: { [Op.gte]: startOfYear },
        },
        attributes: ['cost'],
    });

    const totalCostYTD = totalCostYTDResult.reduce((sum, log) => sum + parseFloat(log.cost || 0), 0);

    const typeCounts = await MaintenanceLog.findAll({
        where: { machineId },
        attributes: ['type'],
    });

    const counts = {
        repair: 0,
        preventive: 0,
        inspection: 0,
        oil_change: 0,
        parts_replacement: 0,
    };

    typeCounts.forEach((log) => {
        if (counts[log.type] !== undefined) {
            counts[log.type]++;
        }
    });

    return {
        totalRecords,
        lastMaintenanceDate: lastMaintenance ? lastMaintenance.date : null,
        nextScheduledDate: nextScheduled ? nextScheduled.dueDate : null,
        totalCostYTD: parseFloat(totalCostYTD.toFixed(2)),
        typeCounts: counts,
    };
};


module.exports = {
    getMaintenanceLogById,
    createMaintenanceLog,
    updateMaintenanceLog,
    getMaintenanceLogsByMachine,
    getScheduledMaintenanceById,
    createScheduledMaintenance,
    updateScheduledMaintenance,
    getScheduledMaintenancesByMachine,
    getLastMaintenanceByMachine,
    getNextMaintenanceByMachine,
    getMaintenanceAlerts,
    getMaintenanceSummaryByMachine,
    getMaintenanceStatsByMachine
};
