const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const responseFormatter = require("./middlewares/responseFormatter");
const errorHandler = require("./middlewares/errorHandler");
const tokenValidator = require("./middlewares/tokenValidator");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const Cron = require("node-cron");

const transferRoutes = require("./src/machineTransfer/transfer.routes");
const logbookRoutes = require("./src/logbook/logbook.routes");
const materialRequisitionRoutes = require("./src/requisition/requisition.routes");
const notificationRoutes = require("./src/notification/notification.routes");

const startCronJobs = require("./src/cronJobs/index");
startCronJobs();

const app = express();
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 15 minutes
  // windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Send rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again later.",
});
// app.use("/api", apiLimiter);
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173", "https://erp.glimstarai.com", "https://bpc-erp.vercel.app"], // Your frontend URL
    credentials: true, // Allow cookies and headers to be sent
    methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "PATCH"], //
  })
);

//External APIs
Cron.schedule("*/10 * * * *", () => {
  fetch("https://cpc-erp-server.onrender.com/test", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
});
app.get("/test", (req, res) => {
  res.send("Hello world!");
});
app.use(responseFormatter); // Response Formatter
app.use("/api/auth/", require("./src/auth/auth.routes"));

app.use(tokenValidator);

app.use("/api/sites/", require("./src/site/site.routes"));
app.use("/api/users/", require("./src/user/user.routes"));
app.use("/api/machinery/", require("./src/machinery/machinery.routes"));
app.use("/api/category/", require("./src/category/category.routes"));
app.use(
  "/api/machinery-item-codes/",
  require("./src/machineryItemCode/machineryItemCode.routes")
);
app.use("/api/", [
  transferRoutes,
  logbookRoutes,
  materialRequisitionRoutes,
  notificationRoutes,
  require("./src/ItemGroup/itemGroup.routes"),
  require("./src/Item/item.routes"),
  require("./src/Unit/unit.routes"),
  require("./src/procurement/procurement.routes"),
  require("./src/vendor/vendor.routes"),
  require("./src/invoice/invoice.routes"),
  require("./src/dashboard/dashboard.routes"),
  require("./src/reports/reports.routes"),
]);
app.use(
  "/api/quotation-comparison/",
  require("./src/quotationComparison/quotationComparison.routes")
);
app.use("/api/maintanance/", require("./src/maintanance/maintanance.routes"));
app.use("/api/material-issues/", require("./src/materialIssue/issue.routes"));
app.use("/api/inventory/", require("./src/inventory/inventory.routes"));
app.use("/api/files/", require("./src/file/file.routes"));

//Public Routes

//--------ProtectedRoutes----------------------

app.use(errorHandler);
app.listen(3000, () => {
  console.log(`server start at port no 3000`);
});
