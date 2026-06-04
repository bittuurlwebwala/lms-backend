const mongoose = require("mongoose");
const Course = require("../models/course.model");
const Lecture = require("../models/lecture.model");
const User = require("../models/user.model");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const os = require("os");
const { uploadOnCloudinary } = require("../utils/cloudinary");
// Use OS temporary directory for Vercel compatibility
const uploadDir = os.tmpdir();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `course-${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage }).single("image");

// @desc    Create or Update a Course
// @route   POST /api/courses/create
// @access  Public/Private
const createCourse = async (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: "Image upload failed",
                error: err.message
            });
        }

        try {
            let { id, _id, title, description, price, instructor, category, isFree, isPublished } = req.body || {};
            id = id || _id; // sometimes frontend sends _id instead of id

            // console.log("course body", req.body);
            //  console.log("course image", req.file);

            // Handle form-data boolean strings
            if (isFree === 'true') isFree = true;
            if (isFree === 'false') isFree = false;
            if (isPublished === 'true') isPublished = true;
            if (isPublished === 'false') isPublished = false;

            let image = req.body.image || null;
            if (req.file) {
                const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
                if (cloudinaryResponse) {
                    image = cloudinaryResponse.secure_url;
                }
            }

            // Try to find existing course by ID for update
            let existingCourse = null;

            // Prevent string 'null' or 'undefined' from acting as a valid ID
            if (id === 'null' || id === 'undefined') {
                id = null;
            }

            if (id) {
                existingCourse = await Course.findById(id);
                console.log("existing course", existingCourse);

                if (!existingCourse) {
                    return res.status(404).json({
                        success: false,
                        message: "Course not found for update"
                    });
                }
            }

            // Handle if instructor is passed as an object or string 'null'
            if (instructor && typeof instructor === 'object' && instructor._id) {
                instructor = instructor._id;
            }
            if (instructor === 'null' || instructor === 'undefined') {
                instructor = null;
            }

            console.log("Validating instructor ID:", instructor);

            // Verify if instructor exists in User collection
            if (instructor) {
                // Validate if instructor is a valid ObjectId format
                if (!mongoose.Types.ObjectId.isValid(instructor)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid Instructor ID format"
                    });
                }

                const user = await User.findById(instructor);
                if (!user) {
                    console.log("Instructor NOT found in DB for ID:", instructor);
                    return res.status(404).json({
                        success: false,
                        message: "Instructor (User) not found with the provided ID"
                    });
                }
                console.log("Instructor found:", user.name);
            }

            // If course exists, update it
            if (existingCourse) {
                if (title) existingCourse.title = title;
                if (description) existingCourse.description = description;
                if (price !== undefined) existingCourse.price = price;
                if (instructor) existingCourse.instructor = instructor;
                if (category) existingCourse.category = category;
                if (isFree !== undefined) existingCourse.isFree = isFree;
                if (isPublished !== undefined) existingCourse.isPublished = isPublished;
                if (image) existingCourse.image = image;

                const updatedCourse = await existingCourse.save();

                return res.status(200).json({
                    success: true,
                    message: "Course updated successfully",
                    data: updatedCourse,
                });
            }


            // Otherwise, create a new course
            if (!title || !description || !instructor || !category) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide title, description, category, and instructor",
                });
            }

            const course = await Course.create({
                title,
                description,
                price: isFree ? 0 : (price || 0),
                category,
                isFree: isFree || false,
                isPublished: isPublished || false,
                instructor,
                image
            });

            //console.log("course created", course);

            res.status(201).json({
                success: true,
                message: "Course created successfully",
                data: course,
            });
        } catch (err) {
            console.error("Course Create/Update error:", err);
            res.status(500).json({
                success: false,
                message: "Server error during course creation/update",
                error: err.message,
            });
        }
    });
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find({}).populate("instructor", "name email role").lean();

        // Add total lectures count for each course
        const coursesWithLectures = await Promise.all(courses.map(async (course) => {
            const totalLectures = await Lecture.countDocuments({ course: course._id });
            return { ...course, totalLectures };
        }));

        res.status(200).json({
            success: true,
            count: coursesWithLectures.length,
            data: coursesWithLectures,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error fetching courses",
            error: error.message,
        });
    }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
const getCourseById = async (req, res) => {
    try {
        const id = req.query.id || req.params.id;
        if (!id) {
            return res.status(400).json({ success: false, message: "Please provide a course ID" });
        }

        const course = await Course.findById(id).populate("instructor", "name email role").lean();

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        // Fetch lectures for this course
        const lectures = await Lecture.find({ course: id });

        res.status(200).json({
            success: true,
            data: {
                ...course,
                totalLectures: lectures.length,
                lectures: lectures
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error fetching course",
            error: error.message,
        });
    }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error deleting course",
            error: error.message,
        });
    }
};

// @desc    Toggle Publish Status
// @route   PATCH /api/courses/:id/publish
// @access  Private
const togglePublishCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        course.isPublished = !course.isPublished;
        await course.save();

        res.status(200).json({
            success: true,
            message: course.isPublished ? "Course published successfully" : "Course unpublished successfully",
            data: course,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error toggling course publish status",
            error: error.message,
        });
    }
};

// @desc    Enroll in a course
// @route   POST /api/courses/enroll?id=... or /api/courses/:id/enroll
// @access  Private (Student only)
const enrollCourse = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: "Only students can enroll in courses" });
        }

        const courseId = req.query.id || req.params.id || req.body.courseId;
        if (!courseId) {
            return res.status(400).json({ success: false, message: "Please provide a course ID" });
        }

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        // Check if already enrolled
        if (req.user.enrolledCourses && req.user.enrolledCourses.includes(courseId)) {
            return res.status(400).json({ success: false, message: "You are already enrolled in this course" });
        }

        if (!req.user.enrolledCourses) req.user.enrolledCourses = [];
        req.user.enrolledCourses.push(courseId);
        await req.user.save();

        res.status(200).json({
            success: true,
            message: "Successfully enrolled in the course",
            enrolledCourses: req.user.enrolledCourses
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error during enrollment", error: error.message });
    }
};

module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    deleteCourse,
    togglePublishCourse,
    enrollCourse
};
