const User = require("../models/user.model");
const Blacklist = require("../models/blacklist.model");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const sendEmail = require("../utils/sendEmail");

const os = require("os");
// Use OS temporary directory for Vercel compatibility
const uploadDir = os.tmpdir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `user-${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage }).any();

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign(
    {
      id,
      role,
    },
    process.env.JWT_SECRET || "default_secret",
    {
      expiresIn: "7d",
    },
  );
};

const createUser = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: "Image upload failed",
        error: err.message,
      });
    }

    try {
      const { id, name, email, password, role } = req.body || {};

      const uploadedFiles = Array.isArray(req.files) ? req.files : [];
      const uploadedImageFile =
        uploadedFiles.find((file) =>
          ["image", "file", "avatar"].includes(file.fieldname),
        ) ||
        uploadedFiles[0] ||
        null;

      let image =
        typeof req.body.image === "string" ? req.body.image.trim() : null;
      if (uploadedImageFile) {
        const cloudinaryResponse = await uploadOnCloudinary(
          uploadedImageFile.path,
        );
        if (cloudinaryResponse?.secure_url) {
          image = cloudinaryResponse.secure_url;
        }
      }

      // Try to find the user by ID (if provided) or by Email
      let existingUser = null;
      if (id) {
        existingUser = await User.findById(id);
      } else if (email) {
        existingUser = await User.findOne({ email });
      }

      // If user exists, update them
      if (existingUser) {
        existingUser.name = name || existingUser.name;
        if (email) existingUser.email = email; // Only really changes if found by ID
        existingUser.role = role || existingUser.role;
        if (password) existingUser.password = password;
        if (image) existingUser.image = image;

        const updatedUser = await existingUser.save();

        return res.status(200).json({
          success: true,
          message: "User updated successfully",
          data: {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            image: updatedUser.image,
          },
        });
      }

      // Otherwise, create a new user
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: "Please provide name, email, password, and role",
        });
      }

      // Check for specific valid roles
      const validRoles = ["admin", "teacher", "student"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Allowed roles are: ${validRoles.join(", ")}`,
        });
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role,
        image,
      });
      //console.log("user created", user);

      if (user) {
        res.status(201).json({
          success: true,
          message: "User registered successfully",
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
            // token: generateToken(user._id, user.role),
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Invalid user data",
        });
      }
    } catch (err) {
      console.error("Registration/Update error:", err);
      res.status(500).json({
        success: false,
        message: "Server error during registration/update",
        error: err.message,
      });
    }
  });
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: "Your account has been blocked. Please contact admin.",
        });
      }

      // Capitalize the first letter of the role for the message
      const roleName = user.role.charAt(0).toUpperCase() + user.role.slice(1);

      // 📧 Login notification email bhejo (async, response wait nahi karega)
      const loginTime = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
      const roleColors = {
        admin: "#ef4444",
        teacher: "#f59e0b",
        student: "#10b981",
      };
      const roleColor = roleColors[user.role] || "#667eea";
      const roleIcons = { admin: "👑", teacher: "🧑‍🏫", student: "🎓" };
      const roleIcon = roleIcons[user.role] || "👤";

      sendEmail({
        to: user.email,
        subject: `🔐 New Login on LMS Platform`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Login Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ═══ HEADER ═══ -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:20px 20px 0 0;padding:40px 30px;text-align:center;">
              <div style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;width:70px;height:70px;line-height:70px;text-align:center;font-size:32px;margin-bottom:15px;">🎓</div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;">LMS Platform</h1>
              <p style="margin:8px 0 0;color:#a0aec0;font-size:14px;letter-spacing:2px;text-transform:uppercase;">Login Activity Alert</p>
            </td>
          </tr>

          <!-- ═══ HERO BANNER ═══ -->
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:25px 30px;text-align:center;">
              <div style="font-size:40px;margin-bottom:10px;">🔐</div>
              <h2 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">New Login Detected!</h2>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">We noticed a new sign-in to your account</p>
            </td>
          </tr>

          <!-- ═══ MAIN BODY ═══ -->
          <tr>
            <td style="background:#1a1a2e;padding:35px 30px;">

              <!-- Greeting -->
              <p style="color:#e2e8f0;font-size:18px;margin:0 0 6px;">Hey <strong style="color:#ffffff;">${user.name}</strong>! 👋</p>
              <p style="color:#a0aec0;font-size:14px;margin:0 0 30px;line-height:1.6;">Aapke LMS account mein ek successful login hua hai. Neeche details dekhen:</p>

              <!-- Info Cards Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <!-- Name Card -->
                  <td width="48%" style="background:#16213e;border:1px solid #2d3748;border-radius:12px;padding:16px 18px;vertical-align:top;">
                    <p style="margin:0 0 4px;color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:1px;">👤 Full Name</p>
                    <p style="margin:0;color:#ffffff;font-size:15px;font-weight:600;">${user.name}</p>
                  </td>
                  <td width="4%"></td>
                  <!-- Role Card -->
                  <td width="48%" style="background:#16213e;border:1px solid #2d3748;border-radius:12px;padding:16px 18px;vertical-align:top;">
                    <p style="margin:0 0 4px;color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:1px;">${roleIcon} Role</p>
                    <p style="margin:0;font-size:15px;font-weight:600;">
                      <span style="display:inline-block;background:${roleColor}22;color:${roleColor};border:1px solid ${roleColor}55;border-radius:20px;padding:2px 12px;font-size:13px;">${roleName}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Email & Time Full Width -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td style="background:#16213e;border:1px solid #2d3748;border-radius:12px;padding:16px 18px;margin-bottom:12px;">
                    <p style="margin:0 0 4px;color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:1px;">📧 Email Address</p>
                    <p style="margin:0;color:#667eea;font-size:15px;font-weight:600;">${user.email}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
                <tr>
                  <td style="background:#16213e;border:1px solid #2d3748;border-radius:12px;padding:16px 18px;">
                    <p style="margin:0 0 4px;color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:1px;">🕐 Login Time</p>
                    <p style="margin:0;color:#10b981;font-size:15px;font-weight:600;">${loginTime} <span style="color:#718096;font-size:12px;">(IST)</span></p>
                  </td>
                </tr>
              </table>

              <!-- Security Alert Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#2d1515;border:1px solid #ef444433;border-radius:12px;padding:18px 20px;">
                    <p style="margin:0 0 6px;color:#ef4444;font-size:13px;font-weight:700;">⚠️ Security Notice</p>
                    <p style="margin:0;color:#fc8181;font-size:13px;line-height:1.6;">Agar aapne yeh login nahi kiya hai, toh <strong>turant apna password change karein</strong> aur hamse contact karein.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="background:#0f0f1a;border-radius:0 0 20px 20px;padding:25px 30px;text-align:center;border-top:1px solid #2d3748;">
              <p style="margin:0 0 8px;color:#4a5568;font-size:12px;">You are receiving this because you are registered on LMS Platform.</p>
              <p style="margin:0;color:#4a5568;font-size:12px;">© ${new Date().getFullYear()} LMS Platform. All rights reserved.</p>
              <div style="margin-top:15px;">
                <span style="display:inline-block;width:8px;height:8px;background:#667eea;border-radius:50%;margin:0 3px;"></span>
                <span style="display:inline-block;width:8px;height:8px;background:#764ba2;border-radius:50%;margin:0 3px;"></span>
                <span style="display:inline-block;width:8px;height:8px;background:#10b981;border-radius:50%;margin:0 3px;"></span>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
                `,
      }).catch((err) =>
        console.error("❌ Login email send karne mein error:", err.message),
      );

      res.status(200).json({
        success: true,
        message: `${roleName} login successful`,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
          token: generateToken(user._id, user.role),
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: err.message,
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateUserProfile = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: "Image upload failed",
        error: err.message,
      });
    }

    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const { name } = req.body || {};

      const uploadedFiles = Array.isArray(req.files) ? req.files : [];
      const uploadedImageFile =
        uploadedFiles.find((file) =>
          ["image", "file", "avatar"].includes(file.fieldname),
        ) ||
        uploadedFiles[0] ||
        null;

      let image =
        typeof req.body.image === "string" ? req.body.image.trim() : null;
      if (uploadedImageFile) {
        const cloudinaryResponse = await uploadOnCloudinary(
          uploadedImageFile.path,
        );
        if (cloudinaryResponse?.secure_url) {
          image = cloudinaryResponse.secure_url;
        }
      }

      if (name) user.name = name;
      if (image) user.image = image;

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          image: updatedUser.image,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error during profile update",
        error: error.message,
      });
    }
  });
};

const getDashboard = async (req, res) => {
  try {
    const user = req.user;
    const roleName = user.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
      : "User";

    res.status(200).json({
      success: true,
      message: `Welcome to your dashboard, ${roleName} ${user.name}!`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error loading dashboard",
      error: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    // all users
    const users = await User.find({}).select("-password");

    // role counts
    const roleCounts = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // convert array to object
    const roleSummary = {
      admin: 0,
      teacher: 0,
      student: 0,
    };

    roleCounts.forEach((item) => {
      roleSummary[item._id] = item.count;
    });

    res.status(200).json({
      success: true,

      totalUsers: users.length,

      roleCounts: roleSummary,

      data: users,
    });
  } catch (err) {
    console.error("Fetch users error:", err);

    res.status(500).json({
      success: false,
      message: "Server error fetching users",
      error: err.message,
    });
  }
};

const userLogout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    // Add token to blacklist
    await Blacklist.create({ token });

    res.status(200).json({
      success: true,
      message: "User logged out successfully. Token is now invalid.",
      data: req.user,
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({
      success: false,
      message: "Error in logout",
      error: err.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.query.id || req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Please provide a user ID" });

    const user = await User.findByIdAndDelete(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error deleting user",
      error: error.message,
    });
  }
};

const toggleBlockUser = async (req, res) => {
  try {
    const id = req.query.id || req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Please provide a user ID" });

    const user = await User.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBlocked
        ? "User blocked successfully"
        : "User unblocked successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error toggling block status",
      error: error.message,
    });
  }
};

const getEnrolledCourses = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students have enrolled courses",
      });
    }

    const user = await User.findById(req.user.id).populate({
      path: "enrolledCourses",
      populate: { path: "instructor", select: "name email role" },
    });

    res.status(200).json({
      success: true,
      count: user.enrolledCourses.length,
      data: user.enrolledCourses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching enrolled courses",
      error: error.message,
    });
  }
};

module.exports = {
  createUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getDashboard,
  getAllUsers,
  userLogout,
  deleteUser,
  toggleBlockUser,
  getEnrolledCourses,
};
