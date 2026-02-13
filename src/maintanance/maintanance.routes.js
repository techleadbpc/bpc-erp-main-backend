// routes/maintanance.routes.js
const express = require('express');
const router = express.Router();
const maintananceController = require('./maintanance.controller');
const validateRequest = require('./../../middlewares/validateRequest');
const {
  createMaintenanceLogSchema,
  updateMaintenanceLogSchema,
  createScheduledMaintenanceSchema,
  updateScheduledMaintenanceSchema,
} = require('./maintanance.validator');
const asyncMiddleware = require('./../../middlewares/asyncMiddleware');

// Maintenance Logs
router.get('/logs/:id', asyncMiddleware(maintananceController.getMaintenanceLogById));
router.post('/logs', validateRequest(createMaintenanceLogSchema), asyncMiddleware(maintananceController.createMaintenanceLog));
router.put('/logs/:id', validateRequest(updateMaintenanceLogSchema), asyncMiddleware(maintananceController.updateMaintenanceLog));
router.get('/logs/machine/:machineId', asyncMiddleware(maintananceController.getMaintenanceLogsByMachine));

// Scheduled Maintenance
router.get('/scheduled/:id', asyncMiddleware(maintananceController.getScheduledMaintenanceById));
router.post('/scheduled', validateRequest(createScheduledMaintenanceSchema), asyncMiddleware(maintananceController.createScheduledMaintenance));
router.put('/scheduled/:id', validateRequest(updateScheduledMaintenanceSchema), asyncMiddleware(maintananceController.updateScheduledMaintenance));
router.put('/scheduled/:id/complete', asyncMiddleware(maintananceController.completeScheduledMaintenance));
router.get('/scheduled/machine/:machineId', asyncMiddleware(maintananceController.getScheduledMaintenancesByMachine));

// Maintenance Stats
router.get('/stats/:machineId', asyncMiddleware(maintananceController.getMaintenanceStatsByMachine));

// New routes for maintenance summary and alerts
router.get('/last-maintenance/:machineId', asyncMiddleware(maintananceController.getLastMaintenanceByMachine));
router.get('/next-maintenance/:machineId', asyncMiddleware(maintananceController.getNextMaintenanceByMachine));
router.get('/alerts/:machineId', asyncMiddleware(maintananceController.getMaintenanceAlerts));
router.get('/summary/:machineId', asyncMiddleware(maintananceController.getMaintenanceSummaryByMachine));

// Machine Service Interval routes
const machineServiceIntervalRoutes = require('./machineServiceInterval.routes');
router.use('/intervals', machineServiceIntervalRoutes);


module.exports = router;
