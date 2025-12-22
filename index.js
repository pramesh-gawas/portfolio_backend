const nodemailer = require("nodemailer");
const express = require("express");
const User = require("./models/user");
const { generateToken, jwtAuthMiddleWare } = require("./jwt");
const db = require("./db");
require("dotenv").config();
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const adminRoutes = require("./routes/adminRoutes");
app.use("/admin", adminRoutes);

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
