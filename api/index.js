const app = require("../src/app");
const connectDB = require("../src/config/db");
require("dotenv").config();

let isConnected = false;

module.exports = async (req, res) => {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }

    return app(req, res);
  } catch (error) {
   // console.log("Vercel Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};