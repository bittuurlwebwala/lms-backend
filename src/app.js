const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoute = require("./routes/userRoute");
const courseRoute = require("./routes/courseRoute");
const lectureRoute = require("./routes/lectureRoute");
const progressRoute = require("./routes/progressRoute");
const quizRoute = require("./routes/quizRoute");
const contactRoute = require("./routes/contactRoute");
const paymentRoute = require("./routes/paymentRoute");


const path = require("path");

const app = express();

// Middleware
const allowedOrigins = [process.env.FRONTEND_URL];

// Regex to allow any localhost or 127.0.0.1 port in development
const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // Allow any localhost / 127.0.0.1 port
    if (localhostRegex.test(origin)) return callback(null, true);

    // Allow whitelisted production origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true
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
app.use("/api/payments", paymentRoute);

app.get("/", (req, res) => {
  res.send("API is running...");

});

app.get("/test", (req, res) => {
  res.json({
    message: "Welcome to the API"
  });
});

module.exports = app;