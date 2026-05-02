const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoute = require("./routes/userRoute");
const courseRoute = require("./routes/courseRoute");
const lectureRoute = require("./routes/lectureRoute");
const path = require("path");

const app = express();

// Middleware
app.use(cors());

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/users", userRoute);
app.use("/api/courses", courseRoute);
app.use("/api/lectures", lectureRoute);

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.get("/test", (req, res) => {
  res.send("Test Route");
});

module.exports = app;