const logger = require("../utils/logger"); // Adjust path as needed

async function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  // const endpoint = req.originalUrl; // Gets the triggered API endpoint
  // const method = req.method;
  // const requestBody = JSON.stringify(req.body); // Convert body to string for logging

  // if (statusCode === 500) {
  //   // Log internal server errors
  //   logger.error(`Internal Server Error: ${err} | Endpoint: ${method} ${endpoint} | Request Body: ${requestBody}`);
  // } else {
  //   // Log client errors
  //   logger.warn(`Client Error: ${err} | Endpoint: ${method} ${endpoint} | Request Body: ${requestBody}`);
  // }

  // Send error response
  res.sendError(err, statusCode);
}

module.exports = errorHandler;
