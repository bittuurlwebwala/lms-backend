const nodemailer = require("nodemailer");

/**
 * Send an email using nodemailer
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {

    // ⚠️ Check karo ki credentials .env mein hain ya nahi
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("EMAIL_USER ya EMAIL_PASS .env mein set nahi hai!");
    }

    if (process.env.EMAIL_USER === "tumhari_gmail@gmail.com") {
        throw new Error("Please .env mein apni real Gmail ID daalo (EMAIL_USER)");
    }

    // Transporter banao (Gmail use kar raha hoon)
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,   // tumhari Gmail ID
            pass: process.env.EMAIL_PASS,   // Gmail App Password (16-char)
        },
    });

    const mailOptions = {
        from: `"LMS Platform" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    };

    const info = await transporter.sendMail(mailOptions);
    //console.log("✅ Email sent:", info.messageId);
    return info;
};

module.exports = sendEmail;
