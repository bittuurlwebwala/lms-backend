const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoute = require("./routes/userRoute");
const courseRoute = require("./routes/courseRoute");
const lectureRoute = require("./routes/lectureRoute");
const progressRoute = require("./routes/progressRoute");
const quizRoute = require("./routes/quizRoute");
const contactRoute = require("./routes/contactRoute");
console.log("[DEBUG] Progress routes imported");
console.log("[DEBUG] Quiz routes imported");
const path = require("path");

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,   // Aapke Vite React App ka URL ho
  credentials: true                     // Jaruri hai kyonki axios withCredentials = true hai
}));

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// Routes
app.use("/api/users", userRoute);
app.use("/api/courses", courseRoute);
app.use("/api/lectures", lectureRoute);
app.use("/api/progress", progressRoute);
app.use("/api/quizzes", quizRoute);
app.use("/api/contact", contactRoute);
console.log("[DEBUG] Progress and Quiz routes registered");

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.get("/test", (req, res) => {
  res.send("Test Route");
});

module.exports = app;