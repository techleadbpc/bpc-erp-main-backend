// controllers/maintanance.controller.js
const maintananceService = require('./maintanance.service');

// Maintenance Logs
const getMaintenanceLogById = async (req, res) => {
  const log = await maintananceService.getMaintenanceLogById(req.params.id);
  res.sendResponse(log, "Maintenance log fetched successfully");
};

const createMaintenanceLog = async (req, res) => {
  const log = await maintananceService.createMaintenanceLog(req.body);
  res.sendResponse(log, "Maintenance log created successfully");
};

const updateMaintenanceLog = async (req, res) => {
  const log = await maintananceService.updateMaintenanceLog(req.params.id, req.body);
  res.sendResponse(log, "Maintenance log updated successfully");
};

const getMaintenanceLogsByMachine = async (req, res) => {
  const logs = await maintananceService.getMaintenanceLogsByMachine(req.params.machineId);
  res.sendResponse(logs, "Maintenance logs fetched successfully");
};

// Scheduled Maintenance
const getScheduledMaintenanceById = async (req, res) => {
  const scheduled = await maintananceService.getScheduledMaintenanceById(req.params.id);
  res.sendResponse(scheduled, "Scheduled maintenance fetched successfully");
};

const createScheduledMaintenance = async (req, res) => {
  const scheduled = await maintananceService.createScheduledMaintenance(req.body);
  res.sendResponse(scheduled, "Scheduled maintenance created successfully");
};

const updateScheduledMaintenance = async (req, res) => {
  const scheduled = await maintananceService.updateScheduledMaintenance(req.params.id, req.body);
  res.sendResponse(scheduled, "Scheduled maintenance updated successfully");
};

const completeScheduledMaintenance = async (req, res) => {
  const scheduled = await maintananceService.updateScheduledMaintenance(req.params.id, { status: 'completed' });
  res.sendResponse(scheduled, "Scheduled maintenance marked as completed successfully");
};

const getScheduledMaintenancesByMachine = async (req, res) => {
  const schedules = await maintananceService.getScheduledMaintenancesByMachine(req.params.machineId);
  res.sendResponse(schedules, "Scheduled maintenance list fetched successfully");
};

const getMaintenanceStatsByMachine = async (req, res) => {
    const stats = await maintananceService.getMaintenanceStatsByMachine(req.params.machineId);
    res.sendResponse(stats, "Maintenance stats fetched successfully");
};

// New controller functions for maintenance summary and alerts
const getLastMaintenanceByMachine = async (req, res) => {
  const lastMaintenance = await maintananceService.getLastMaintenanceByMachine(req.params.machineId);
  res.sendResponse(lastMaintenance, "Last maintenance fetched successfully");
};

const getNextMaintenanceByMachine = async (req, res) => {
  const nextMaintenance = await maintananceService.getNextMaintenanceByMachine(req.params.machineId);
  res.sendResponse(nextMaintenance, "Next maintenance fetched successfully");
};

const getMaintenanceAlerts = async (req, res) => {
  const alerts = await maintananceService.getMaintenanceAlerts(req.params.machineId);
  res.sendResponse(alerts, "Maintenance alerts fetched successfully");
};

const getMaintenanceSummaryByMachine = async (req, res) => {
  const summary = await maintananceService.getMaintenanceSummaryByMachine(req.params.machineId);
  res.sendResponse(summary, "Maintenance summary fetched successfully");
};

module.exports = {
  getMaintenanceLogById,
  createMaintenanceLog,
  updateMaintenanceLog,
  getMaintenanceLogsByMachine,
  getScheduledMaintenanceById,
  createScheduledMaintenance,
  updateScheduledMaintenance,
 completeScheduledMaintenance,
  getScheduledMaintenancesByMachine,
  getMaintenanceStatsByMachine,
  getLastMaintenanceByMachine,
  getNextMaintenanceByMachine,
  getMaintenanceAlerts,
  getMaintenanceSummaryByMachine
};
