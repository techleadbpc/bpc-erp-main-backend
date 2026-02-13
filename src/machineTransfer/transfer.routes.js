const express = require("express");
const transferController = require("./transfer.controller");
const validateRequest = require("../../middlewares/validateRequest");
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const hasRole = require("../../middlewares/hasRole");
const {
  fileUploadMiddleware,
  upload,
} = require("../../middlewares/fileUploadMiddleware");

const router = express.Router();
const fileFields = ["files"];

router.post(
  "/transfer",
  hasRole([4, 5, 6]),
  asyncMiddleware(transferController.requestTransfer)
);
router.get(
  "/transfer/:id",
  asyncMiddleware(transferController.getTransferById)
);
router.put(
  "/transfer/:id/approve",
  hasRole([1, 2, 3]),
  asyncMiddleware(transferController.approveTranfer)
);
router.put(
  "/transfer/:id/reject",
  hasRole([1, 2, 3]),
  asyncMiddleware(transferController.rejectTransfer)
);
router.put(
  "/transfer/:id/dispatch",
  hasRole([4, 5, 6]),
  upload.fields(fileFields.map((name) => ({ name, maxCount: 5 }))),
  fileUploadMiddleware(fileFields, "mani", "transfer"),
  asyncMiddleware(transferController.dispatchMachine)
);
router.put(
  "/transfer/:id/receive",
  hasRole([4, 5, 6]),
  asyncMiddleware(transferController.receiveMachine)
);
router.get("/transfers", asyncMiddleware(transferController.transferHistory));
router.get(
  "/transfers/machine/:machineId",
  asyncMiddleware(transferController.transferHistoryOfMachine)
);
router.get(
  "/transfers/dispatched",
  hasRole([4, 5, 6]),
  asyncMiddleware(transferController.dispachtedList)
);
router.get(
  "/transfers/approved",
  hasRole([4, 5, 6]),
  asyncMiddleware(transferController.approvedList)
);

router.post(
  "/file/upload",
  upload.fields(fileFields.map((name) => ({ name, maxCount: 5 }))),
  fileUploadMiddleware(fileFields, "mani", "transfer"),
  async (req, res) => {
    res
      .status(200)
      .json({ files: req.fileData, message: "Files uploaded successfully" });
  }
);

module.exports = router;
