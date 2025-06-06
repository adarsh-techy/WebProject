const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Setup mail transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "adarshns.raj@gmail.com", // <-- replace with your Gmail
    pass: "YOUR-GMAIL-APP-PASSWORD", // <-- use an App Password, not real password
  },
});

router.post("/send", async (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: email,
    to: "adarshns.raj@gmail.com", // your real inbox
    subject: `New message from ${name}`,
    text: `${message}\n\nFrom: ${name} (${email})`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.redirect("/?msg=success");
  } catch (err) {
    console.error(err);
    res.redirect("/?msg=error");
  }
});

module.exports = router;
