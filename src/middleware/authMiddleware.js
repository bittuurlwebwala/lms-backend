const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
  let token;

  try {
    // Check authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Get token
      token = req.headers.authorization.split(" ")[1];

      // Check if token is blacklisted (logged out)
      const Blacklist = require("../models/blacklist.model");
      const isBlacklisted = await Blacklist.findOne({ token });

      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please login again.",
        });
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "default_secret",
      );

      // Find user
      req.user = await User.findById(decoded.id).select("-password");

      // User not found
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      next();
    } else {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }
  } catch (error) {
    console.error("Auth Error:", error);

    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

const optionalProtect = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const Blacklist = require("../models/blacklist.model");
      const isBlacklisted = await Blacklist.findOne({ token });

      if (isBlacklisted) {
        req.user = null;
        return next();
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "default_secret",
      );

      req.user = await User.findById(decoded.id).select("-password");
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
};

module.exports = { protect, optionalProtect, adminOnly };
