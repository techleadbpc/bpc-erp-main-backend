const jwt = require("jsonwebtoken");
const db = require("../../models");

module.exports = { login, logout, refreshToken, checkToken };
// exports.exportLevelReport = function (req, res)
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await db.User.findOne({
      where: { email },
      include: [
        { model: db.Role, attributes: ["name", "id"] },
        { model: db.Site, attributes: ["name", "id", "address"] },
        { model: db.Department, attributes: ["name", "id"] },
      ],
    });
    if (!user || !(await user.validPassword(password))) {
      const error = new Error();
      error.message = "Invalid email or password";
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken(user);

    // Set JWT in HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: false,
      secure: true, // Set to true in production with HTTPS
      sameSite: "None", // Required for cross-origin requests
      maxAge: 3600000 * 24 * 180, // 1 hour in milliseconds
      path: "/",
    });

    res.sendResponse(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        role: user.Role,
        // departmentId: user.departmentId,
        // siteId: user.siteId,
        image: user.image,
        site: user.Site,
        department: user.Department,
      },
      "Login successful"
    );
  } catch (error) {
    next(error);
  }
}

async function logout(req, res) {
  const token = req.cookies.token;

  //   if (token) {
  //     try {
  //       const decoded = jwt.decode(token);
  //     //   const expirationDate = new Date(decoded.exp * 1000);

  //     //   await db.JwtTokenBlacklist.create({
  //     //     token,
  //     //     expiration_date: expirationDate,
  //     //   });
  //     } catch (error) {
  //       console.error("Error blacklisting token:", error);
  //     }
  //   }

  res.clearCookie("token", {
    httpOnly: false,
    secure: true, // Match the same attributes used during cookie setting
    sameSite: "None",
  });
  res.sendResponse([], "Logout successful");
}

async function refreshToken(req, res) {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No refresh token provided" });
  }

  // Check if token is blacklisted
  //   const blacklistedToken = await db.JwtTokenBlacklist.findOne({
  //     where: { token },
  //   });
  //   if (blacklistedToken) {
  //     return res
  //       .status(403)
  //       .json({ message: "Forbidden: Token has been invalidated" });
  //   }

  try {
    const decoded = jwt.verify(token, "process.env.JWT_SECRET");
    const user = {
      id: decoded.userid,
      email: decoded.email,
      role: decoded.role,
    };

    const newToken = generateToken(user);

    // Set the new JWT in HttpOnly cookie
    res.cookie("token", newToken, {
      httpOnly: true,
      secure: true,
      // secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 3600000,
    });

    res.sendResponse({}, "Token refreshed successfully");
  } catch (error) {
    // console.log(error);
    return res
      .status(403)
      .json({ message: "Forbidden: Invalid refresh token" });
  }
}

async function checkToken(req, res) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.json({ isAuthenticated: false, token: false });
    }

    const blacklistedToken = await db.JwtTokenBlacklist.findOne({
      where: { token },
    });
    if (blacklistedToken) {
      return res.json({ isAuthenticated: false });
    }

    // Verify the token
    jwt.verify(token, "process.env.JWT_SECRET", (err, decoded) => {
      if (err) {
        return res.json({ isAuthenticated: false });
      }

      return res.json({ isAuthenticated: true });
    });
  } catch (error) {
    // console.log("Error checking token: ", error);
    return res.status(500).json({ isAuthenticated: false });
  }
}

function generateToken(user) {
  const payload = {
    id: user.id,
    roleId: user.roleId,
    departmentId: user.departmentId,
    siteId: user.siteId,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "180d" });
}
