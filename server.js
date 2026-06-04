
const app = require("./src/app");
const connectDB = require("./src/config/db");

require("dotenv").config();

const PORT = process.env.PORT || 5000;
console.log(process.env.PORT)


// Connect to Database and then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});


