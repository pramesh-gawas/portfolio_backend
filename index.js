const nodemailer = require("nodemailer");
const express = require("express");
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

const adminRoutes = require("./routes/adminRoutes");
app.use("/admin", adminRoutes);

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
