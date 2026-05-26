const Contact = require("../models/contact.model");

// @desc    Submit a contact form
// @route   POST /api/contact
// @access  Public
const submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // console.log(req.body);

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields (name, email, subject, message)"
            });
        }

        const contact = await Contact.create({
            name,
            email,
            subject,
            message
        });

        res.status(201).json({
            success: true,
            message: "Contact form submitted successfully",
            data: contact
        });
    } catch (error) {
        console.error("Contact Form Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while submitting contact form",
            error: error.message
        });
    }
};

// @desc    Get all contact submissions (Admin only) - Optional helper
// @route   GET /api/contact
// @access  Private/Admin
const getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error while fetching contacts",
            error: error.message
        });
    }
};

module.exports = {
    submitContactForm,
    getAllContacts
};
