const User = require("../models/user.model");
const Blacklist = require("../models/blacklist.model");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadOnCloudinary } = require("../utils/cloudinary");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage }).single("image");




// Generate JWT Token
const generateToken = (id, role) => {
    return jwt.sign({
        id,
        role,
    }, process.env.JWT_SECRET || "default_secret", {
        expiresIn: "7d",
    });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const createUser = async (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: "Image upload failed",
                error: err.message
            });
        }

        try {
            const { id, name, email, password, role } = req.body || {};

            let image = req.body.image || null;
            if (req.file) {
                const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
                if (cloudinaryResponse) {
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
                image
            });

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

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public

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

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: "Image upload failed",
                error: err.message
            });
        }

        try {
            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            const { name } = req.body || {};

            let image = req.body.image;
            if (req.file) {
                const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
                if (cloudinaryResponse) {
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

// @desc    Get user dashboard
// @route   GET /api/users/dashboard
// @access  Private
const getDashboard = async (req, res) => {
    try {
        const user = req.user;
        const roleName = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User";

        res.status(200).json({
            success: true,
            message: `Welcome to your dashboard, ${roleName} ${user.name}!`,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
            }
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
            error: err.message
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const id = req.query.id || req.params.id;
        if (!id) return res.status(400).json({ success: false, message: "Please provide a user ID" });

        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error deleting user", error: error.message });
    }
};

const toggleBlockUser = async (req, res) => {
    try {
        const id = req.query.id || req.params.id;
        if (!id) return res.status(400).json({ success: false, message: "Please provide a user ID" });

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.status(200).json({
            success: true,
            message: user.isBlocked ? "User blocked successfully" : "User unblocked successfully",
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error toggling block status", error: error.message });
    }
};

// @desc    Get enrolled courses for a student
// @route   GET /api/users/enrolled-courses
// @access  Private (Student only)
const getEnrolledCourses = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: "Only students have enrolled courses" });
        }

        const user = await User.findById(req.user.id).populate({
            path: 'enrolledCourses',
            populate: { path: 'instructor', select: 'name email role' }
        });

        res.status(200).json({ success: true, count: user.enrolledCourses.length, data: user.enrolledCourses });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error fetching enrolled courses", error: error.message });
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
    getEnrolledCourses
};