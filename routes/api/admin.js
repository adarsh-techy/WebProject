// api/admin.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Admin = require("../../models/adminModel"); // ← use your existing Admin schema
const Concert = require("../../models/concertModel");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// POST /api/admin/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Find the admin user
    const admin = await Admin.findOne({ email, isAdmin: true });
    if (!admin) {
      return res
        .status(400)
        .json({ message: "Admin not found or not an admin" });
    }

    // 2. Check password
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3. Sign a JWT
    const token = jwt.sign(
      { _id: admin._id, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4. Return token & maybe some basic info
    return res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (err) {
    console.error("JWT login error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

const uploadPath = path.join(__dirname, "../../uploads/concerts");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Storage for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/concerts");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.post("/concerts", upload.single("concertImage"), async (req, res) => {
  try {
    const concert = new Concert({
      title: req.body.title,
      name: req.body.name,
      date: req.body.date,
      venue: req.body.venue,
      price: req.body.price,
      availableTickets: req.body.availableTickets,
      description: req.body.description,
      concertImage: req.file ? req.file.filename : null,
    });

    await concert.save();
    return res.status(201).json({ message: "Concert created", concert });
  } catch (err) {
    console.error("Create concert error:", err);
    return res
      .status(500)
      .json({ message: "Failed to create concert", error: err.message });
  }
});

router.get("/concerts", async (req, res) => {
  try {
    const concerts = await Concert.find().sort({ date: -1 });
    res.json(concerts);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch concerts", error: err.message });
  }
});

router.put("/concerts/:id", upload.single("concertImage"), async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      name: req.body.name,
      date: req.body.date,
      venue: req.body.venue,
      price: req.body.price,
      availableTickets: req.body.availableTickets,
      description: req.body.description,
    };

    if (req.file) {
      updateData.concertImage = req.file.filename;
    }

    const concert = await Concert.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!concert) {
      return res.status(404).json({ message: "Concert not found" });
    }

    res.json({ message: "Concert updated", concert });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update concert", error: err.message });
  }
});

router.delete("/concerts/:id", async (req, res) => {
  try {
    const concert = await Concert.findByIdAndDelete(req.params.id);
    if (!concert) {
      return res.status(404).json({ message: "Concert not found" });
    }

    // Optionally remove image file
    if (concert.concertImage) {
      const imagePath = path.join("uploads/concerts", concert.concertImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    res.json({ message: "Concert deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete concert", error: err.message });
  }
});

module.exports = router;
