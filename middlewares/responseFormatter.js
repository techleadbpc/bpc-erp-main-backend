const zlib = require("zlib");

function responseFormatter(req, res, next) {
  // Success response
  res.sendResponse = (data, message = "Success", statusCode = 200) => {
    const response = {
      status: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    handleCompression(req, res, response, statusCode);
  };

  // Error response
  res.sendError = (error, statusCode = 500) => {
    const response = {
      status: false,
      message: error.message || "An error occurred",
      error: {
        name: error.name || "Error",
        stack: process.env.NODE_ENV === "dev" ? error.stack : undefined,
        details: error.details || null,
      },
      timestamp: new Date().toISOString(),
    };

    handleCompression(req, res, response, statusCode);
  };

  next();
}

// Helper function to handle compression
function handleCompression(req, res, response, statusCode) {
  const acceptEncoding = req.headers["accept-encoding"] || "";
  const jsonResponse = JSON.stringify(response);

  if (acceptEncoding.includes("gzip")) {
    zlib.gzip(jsonResponse, (err, compressedData) => {
      if (err) {
        // console.error("Compression error:", err);
        res.status(500).send("Internal Server Error");
        return;
      }
      res.setHeader("Content-Encoding", "gzip");
      res.setHeader("Content-Type", "application/json");
      res.status(statusCode).send(compressedData);
    });
  } else {
    res.setHeader("Content-Type", "application/json");
    res.status(statusCode).send(jsonResponse);
  }
}

module.exports = responseFormatter;
