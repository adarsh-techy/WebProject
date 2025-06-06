var express = require("express");
const { body, validationResult } = require("express-validator");
var router = express.Router();
const upload = require("../middlewares/multerConfig.js");
// const multer = require("multer")
// const storage = multer.memoryStorage();
// const upload = multer({storage: storage});
const bcrypt = require("bcrypt");
const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const isUserLoggedIn = require("../middlewares/userAuth");
const Concert = require("../models/concertModel");
const Ticket = require("../models/ticketModel");
const Review = require("../models/reviewModel");
const isAuthenticated = require("../middlewares/auth");



// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: "adarshadarsh0929@gmail.com",
//   port: 587,
//   secure: false,
//   auth: {
//    user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD
//   }
// })

router.get("/", async (req, res) => {
  try {
    const currentDate = new Date();
    const events = await Concert.find({
      published: true,
      date: { $gt: currentDate },
    })
      .sort({ date: 1 })
      .limit(8);

    res.render("page", {
      str: "ConcertVerse",
      events: events,
      user: req.session.userId
        ? {
            id: req.session.userId,
            name: req.session.userName,
            email: req.session.userEmail,
            userEmail: req.session.userEmail,
            userProfileImage: req.session.userProfileImage,
          }
        : null,
    });
  } catch (err) {
    console.error("Error loading page:", err);
    res.render("page", {
      str: "ConcertVerse",
      events: [],
      user: null,
      error: "Failed to load events",
    });
  }
});

router.get("/concert/:id", isUserLoggedIn, async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.id);
    const user = await User.findById(req.session.userId);

    res.render("concert-details", {
      title: "Concert Details",
      concert,
      userEmail: req.session.userEmail,
      userName: req.session.userName,
      userProfileImage: user?.profileImage || null, // ✅ pass this
    });
  } catch (error) {
    console.error("Error loading concert details:", error);
    res.status(500).send("Internal Server Error");
  }
});

// \\EVENTS PAGE NEW

// Add this to your index.js
router.get("/events", isUserLoggedIn, async (req, res) => {
  try {
    const currentDate = new Date();
    const events = await Concert.find({
      published: true,
      // date: { $gt: currentDate },
    }).sort({ date: 1 });

    res.render("events", {
      title: "All Events",
      events: events,
      searchQuery: req.query.q || "",

      userEmail: req.session.userEmail,
      userProfileImage: req.session.userId
        ? (await User.findById(req.session.userId)).profileImage
        : null,
    });
  } catch (err) {
    console.error("Error loading events page:", err);
    res.render("events", {
      title: "All Events",
      events: [],
      searchQuery: "",
      error: "Failed to load events",
    });
  }
});

router.get("/events/search", async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    if (!searchQuery) {
      return res.redirect("/events");
    }
    const events = await Concert.find({
      $or: [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { venue: { $regex: searchQuery, $options: "i" } },
      ],
      published: true,
    });

    res.render("events", {
      title: `Search Results for "${searchQuery}"`,
      events: events,
      searchQuery: searchQuery, // Pass the search query

      userEmail: req.session.userEmail,
      userProfileImage: req.session.userId
        ? (await User.findById(req.session.userId)).profileImage
        : null,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.redirect("/events", {
      title: "All Events",
      events: [],
      searchQuery: req.query.q || "",
      error: "Failed to load events",
    });
  }
});

// router.post('/contact',[
//   body('name').trim().notEmpty(),
//   body('email').isEmail().normalizeEmail(),
//   body('message').trim().notEmpty()
// ], async (req,res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({
//       success: false,
//       errors: errors.array()
//     })
//   }
//   const {name, email, message} = req.body;

// try {
//   await transporter.sendMail({
//     from: `'${name}'<${email}>`,
//     to: process.env.EMAIL_USERNAME || 'adarshadarsh0929@gmail.com',
//     subject: 'new message from Gigforce',
//     html:`
//     <h2>New Contact Form Submission</h2>
//         <p><strong>From:</strong>${name} (${name})</p>
//         <p><strong>Message:</strong></p>
//         <p>${message.replace(/\n/g, '<br>')}</p>
//     `
//   });
// res.json({success: true});

// } catch (error) {
//   console.error('email failed:', error);
//   res.status(500).json({
//     success: false,
//     error: 'failed to send message'
//   });
// }
// });

// router.get('/profile', isAuthenticated, async (req, res) => {
//  try {
//   const user = await User.findById(req.session.userId);

// const tickets = await Ticket.find({ user: req.session.userId }).populate('event')
// .sort({'event.date': 1}); // Sort tickets by event date

//  const reviews = await Review.find({ user: req.user._id }).populate('event');

//  const uniqueEventIds = [...new Set(tickets.map(ticket => ticket.event._id.toString()))];
//     const eventCount = uniqueEventIds.length;

// res.render('profile', {
//   title: 'My Profile',
//   userName: user.name,
//   userEmail: user.email,
//   userProfileImage: user.profileImage,
//   userCreatedAt: user.createdAt,
//   ticketCount: tickets.length,
//   eventCount: eventCount,
//   tickets: tickets,
//    reviews: reviews
// })

//  } catch (err) {
//   console.error('Error loading profile:', err);
//   res.status(500).send('Internal Server Error');
//  }
//     });

router.post(
  "/update-profile",
  isUserLoggedIn,
  upload.single('profileImage'),
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email").normalizeEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { name, email } = req.body;
      const updates = { name, email };

      // Handle file upload if exists
      if (req.file) {
        updates.profileImage = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        };
      }

      await User.findByIdAndUpdate(req.session.userId, updates);

      // Update session data
      req.session.userName = name;
      req.session.userEmail = email;

      res.json({ success: true });
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({
        success: false,
        error: "Failed to update profile",
      });
    }
  }
);

module.exports = router;
