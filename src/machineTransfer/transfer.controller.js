const TransferService = require("./transfer.service");

const requestTransfer = async (req, res) => {
  const user = req.user;
  const {
    machineId,
    currentSiteId,
    destinationSiteId,
    reason,
    requestType,
    buyerDetails,
    scrapDetails,
    vehicleType,
    transportDetails,
  } = req.body;
  if (user.siteId != currentSiteId) {
    return res.sendError(
      {
        message: "You are not allowed to request transfer from this site",
        name: "AuthorizationError",
      },
      403
    );
  }
  const transfer = await TransferService.requestTransfer(
    machineId,
    currentSiteId,
    destinationSiteId,
    reason,
    user.id,
    requestType,
    buyerDetails,
    scrapDetails,
    transportDetails,
    vehicleType
  );
  res.sendResponse(transfer, "Transfer request created", 201);
};

const approveTranfer = async (req, res) => {
  const { id } = req.params;
  const approvedBy = req.user.id;
  const { remarks } = req.body;
  const transfer = await TransferService.approveTranfer(
    id,
    approvedBy,
    remarks
  );
  res.sendResponse(transfer, "Transfer approved");
};

const rejectTransfer = async (req, res) => {
  const { id } = req.params;
  const rejectedBy = req.user.id;
  const { remarks } = req.body;
  const transfer = await TransferService.rejectTransfer(
    id,
    remarks,
    rejectedBy,
  );
  res.sendResponse(transfer, "Transfer rejected");
};

const dispatchMachine = async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const {
    vehicleNumber,
    driverName,
    mobileNumber,
    remarks,
    fuelGaugeReading,
    odometerReading,
    itemsIncluded,
    hrsMeter,
  } = req.body;
  const transportDetails = { vehicleNumber, driverName, mobileNumber };
  const transferData = {
    transportDetails,
    remarks,
    fuelGaugeReading,
    odometerReading,
    itemsIncluded: JSON.parse(itemsIncluded),
    hrsMeter,
    files: req.fileData?.files,
  };
  const transfer = await TransferService.dispatchMachine(
    id,
    user.id,
    user.siteId,
    transferData
  );
  res.sendResponse(transfer, "Machine dispatched");
};

const receiveMachine = async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const { remarks, itemsReceived } = req.body;
  const transfer = await TransferService.receiveMachine(
    id,
    user.id,
    remarks,
    user.siteId,
    itemsReceived
  );
  res.sendResponse(transfer, "Machine received");
};

const transferHistory = async (req, res) => {
  const user = req.user;
  const { status } = req.query;
  const transfers = await TransferService.transferHistory(status, user.siteId);
  res.sendResponse(transfers);
};

const transferHistoryOfMachine = async (req, res) => {
  const { machineId } = req.params;
  const history = await TransferService.transferHistoryOfMachine(machineId);
  res.sendResponse(history);
};

const dispachtedList = async (req, res) => {
  const user = req.user;
  const transfers = await TransferService.dispachtedList(user.siteId);
  res.sendResponse(transfers);
};

const approvedList = async (req, res) => {
  const user = req.user;
  const transfers = await TransferService.approvedList(user.siteId);
  res.sendResponse(transfers);
};

const getTransferById = async (req, res) => {
  const { id } = req.params;
  const transfer = await TransferService.getTransferById(id);
  res.sendResponse(transfer);
};

module.exports = {
  requestTransfer,
  approveTranfer,
  dispatchMachine,
  receiveMachine,
  transferHistory,
  transferHistoryOfMachine,
  rejectTransfer,
  dispachtedList,
  approvedList,
  getTransferById,
};
