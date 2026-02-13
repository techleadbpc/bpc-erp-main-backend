const express = require("express");
const logbookController = require("./logbook.controller");
const validateRequest = require("../../middlewares/validateRequest");
const asyncMiddleware = require("../../middlewares/asyncMiddleware");
const hasRole = require("./../../middlewares/hasRole");
const ROLES = require("../../utils/roles");

const router = express.Router();

router.post("/logbook", hasRole([ROLES.SITE_INCHARGE, ROLES.STORE_MANAGER, ROLES.PROJECT_MANAGER]), asyncMiddleware(logbookController.createEntry));
router.get("/logbook", asyncMiddleware(logbookController.allEntry));
router.get("/logbook/site/machines", asyncMiddleware(logbookController.allMachines));
router.get("/logbook/:id", asyncMiddleware(logbookController.entryDetails));
router.post("/logbook/:id/approve", hasRole([ROLES.PROJECT_MANAGER]), asyncMiddleware(logbookController.approveEntry));
router.post("/logbook/:id/reject", hasRole([ROLES.PROJECT_MANAGER]), asyncMiddleware(logbookController.rejectEntry));
router.put("/logbook/:id", hasRole([ROLES.SITE_INCHARGE, ROLES.STORE_MANAGER, ROLES.PROJECT_MANAGER]), asyncMiddleware(logbookController.updateEntry));
router.delete("/logbook/:id", hasRole([ROLES.SITE_INCHARGE, ROLES.STORE_MANAGER, ROLES.PROJECT_MANAGER]), asyncMiddleware(logbookController.deleteEntry));

module.exports = router;