const nodemailer = require("nodemailer");
const express = require("express");
const User = require("./user");
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

app.post("/sendMail", async (req, res) => {
  try {
    const { email, obj } = req.body;
    console.log(obj, email);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.RESETEMAIL, // env
        pass: process.env.RESETPASSWORD, //env
      },
    });

    mailOptions = {
      from: {
        name: email,
        address: process.env.RESETEMAIL,
      },
      to: process.env.RESETEMAIL,
      replyTo: email,
      subject: "Mail from the Portfolio",
      html: `
    <div style="font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
     <p><strong>From:</strong> ${email}</p>
      <p>${obj}</p>
    </div>
  `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.send({
          error: "Error Sending Email",
        });
      } else {
        return res.send({
          message: "Email has been sent to Pramesh Gawas",
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/create-admin", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }
    const NewUser = {
      name: name,
      email: email,
      password: password,
      role: role,
    };

    const newAdmin = new User(NewUser);
    const response = await newAdmin.save();
    return res
      .status(201)
      .json({ message: "Admin created successfully", adminId: response._id });
  } catch (error) {
    console.error("Error creating admin:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login-admin", async (req, res) => {
  try {
    const { name, password, role } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    console.log(name, password);
    const admin = await User.findOne({ name: name });
    console.log(admin);
    if (admin == null || admin.role !== "admin") {
      return res.status(401).json({ error: "Invalid  credentials" });
    }
    const isPasswordValid = await admin.comparePassword(password);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const payload = {
      id: admin._id,
      name: admin.name,
      role: admin.role,
    };

    const Token = generateToken(payload);

    return res.status(200).json({ token: Token, message: "Login successful" });
  } catch (error) {
    console.error("Error during admin login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
