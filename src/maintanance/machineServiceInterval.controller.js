const machineServiceIntervalService = require('./machineServiceInterval.service');

const getMachineServiceIntervals = async (req, res) => {
  try {
    const { machineId } = req.params;
    const intervals = await machineServiceIntervalService.getMachineServiceIntervals(machineId);
    res.sendResponse(intervals, "Machine service intervals retrieved successfully");
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

const getMachineServiceIntervalById = async (req, res) => {
  try {
    const { id } = req.params;
    const interval = await machineServiceIntervalService.getMachineServiceIntervalById(id);
    if (!interval) {
      return res.sendError("Machine service interval not found", 404);
    }
    res.sendResponse(interval, "Machine service interval retrieved successfully");
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

const createMachineServiceInterval = async (req, res) => {
  try {
    const interval = await machineServiceIntervalService.createMachineServiceInterval(req.body);
    res.sendResponse(interval, "Machine service interval created successfully");
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

const updateMachineServiceInterval = async (req, res) => {
  try {
    const { id } = req.params;
    const interval = await machineServiceIntervalService.updateMachineServiceInterval(id, req.body);
    res.sendResponse(interval, "Machine service interval updated successfully");
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

const deleteMachineServiceInterval = async (req, res) => {
  try {
    const { id } = req.params;
    await machineServiceIntervalService.deleteMachineServiceInterval(id);
    res.sendResponse(null, "Machine service interval deleted successfully");
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

const getDueMachineServiceIntervals = async (req, res) => {
  try {
    const intervals = await machineServiceIntervalService.getDueMachineServiceIntervals();
    res.sendResponse(intervals, "Due machine service intervals retrieved successfully");
  } catch (error) {
    res.sendError(error.message, 500);
  }
};

const calculateNextServiceForMachine = async (req, res) => {
  try {
    const { machineId } = req.params;
    const intervals = await machineServiceIntervalService.calculateNextServiceForMachine(machineId);
    res.sendResponse(intervals, "Next service calculations retrieved successfully");
  } catch (error) {
    res.sendError(error.message, 500);
  }
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
