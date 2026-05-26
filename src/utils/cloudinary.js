const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Configuration 
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload Function
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // Automatically detect image or video
            folder: "lms_uploads"
        });

        // Upload hone ke baad local file ko delete kar dein
        fs.unlinkSync(localFilePath);
        return response; // returns the full object including secure_url
    } catch (error) {
        // Agar upload fail hua, to local file hatani zaruri hai taaki server na bhare
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
}

module.exports = { uploadOnCloudinary };
