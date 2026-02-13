const jwt = require("jsonwebtoken");
const db = require("../models");

async function tokenValidator(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.sendError({ message: "Access denied. No token provided.",name:"TokenNotFoundError" }, 401);
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded token to request object
    const user = await db.User.findByPk(req.user.id);
    if (!user) {
      res.clearCookie("token", {
        httpOnly: false,
        secure: true, // Match the same attributes used during cookie setting
        sameSite: "None",
      });
      return res.sendError({ message: "Access denied. User not found.", name: "UserNotFoundErro" }, 401);
    }
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    err.statusCode = 401;
    err.data = { tokenProvided: true };
    return res.sendError(err, 401);
  }
}

module.exports = tokenValidator;