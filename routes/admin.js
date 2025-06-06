var express = require("express");
const { body, validationResult } = require("express-validator");
var router = express.Router();
const upload = require("../middlewares/multerConfig.js");
// const multer = require("multer");
const bcrypt = require("bcrypt");

// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage});


const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const isAdminLoggedIn = require("../middlewares/adminAuth.js");
const Concert = require("../models/concertModel.js");
const Booking = require("../models/bookingModel.js");


router.get("/", (req, res) => {
  res.render("login", { errors: [], message: null });
});

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.render("login", {
          message: null,
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find the admin user
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.render("login", {
          message: "Incorrect Email Address.",
          errors: [],
        });
      }

      // ✅ Only allow if admin.isAdmin is true
      if (!admin.isAdmin) {
        return res.render("login", {
          message: "Access denied. Not an admin user.",
          errors: [],
        });
      }

      // Validate password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return res.render("login", {
          message: "Incorrect password.",
          errors: [],
        });
      }

      // Set session data
      req.session.adminId = admin._id;
      req.session.adminEmail = admin.email;

      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      res.redirect("/admin/adminlist");
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).send("Internal Server Error");
    }
  }
);
//MANAGE THE LIST

router.get("/adminlist", isAdminLoggedIn, async (req, res) => {
  try {
    const concerts = await Concert.find().sort({ date: 1 });
    res.render("concert-list", {
      concerts,
      adminEmail: req.session.adminEmail,
    });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

//CONCERT CREATE

router.get("/new", isAdminLoggedIn, (req, res) => {
  res.render("concert-form", {
    concert: {},
    errors: null,
    formAction: "/admin/new",
  });
});

router.post(
  "/new",
  isAdminLoggedIn,
  upload.single("concertImage"),
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("name").notEmpty().withMessage("Name is required"),
    body("date").notEmpty().withMessage("Date is required"),
    body("venue").notEmpty().withMessage("Venue is required"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("availableTickets")
      .isNumeric()
      .withMessage("Available tickets must be a number"),
    body("description").notEmpty().withMessage("Description is required"),
  ],
  async (req, res) => {
    try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("concert-form", {
        concert: req.body,
        errors: errors.array(),
        formAction: "/admin/new",
      });
    }

if (!req.file) {
  return res.render('concert-form',{
    concert: req.body,
    errors: [{msg: 'concert image is required'}],
    formAction: '/admin/new',
  })
}

    
      const { title, name, date, venue, price, availableTickets, description } =
        req.body;
      const concert = new Concert({
        title,
        description,
        name,
        date,
        venue,
        price,
        availableTickets,
        concertImage: {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        },
      });

      await concert.save();
      res.redirect("/admin/adminlist");
    } catch (error) {
      res.render("concert-form", {
        concert: req.body,
        errors: error.errors,
        formAction: "/admin/new",
      });
    }
  }
);



router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/admin'); // Redirect to your admin page
  });
});



router.get('/bookings', isAdminLoggedIn, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: 'concertId',
         select: 'title date venue'
        })
      .populate({path:'userId',
        model: 'User',
        select: 'name email'
      })
      .sort({ createdAt: -1 }); // Newest first

       const validatedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      status: booking.status || 'PENDING'
    }));
    
    res.render('admin/bookings', {
      title: 'All Bookings',
      bookings,
      adminEmail: req.session.adminEmail
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).send('Server Error');
  }
});


router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('concertId')
      .populate('userId');
      
    if (!booking) {
      return res.status(404).send('Booking not found');
    }
    
    res.render('booking-details', {
      title: 'Booking Details',
      booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).send('Server Error');
  }
});


// In routes/admin.js
router.post('/bookings/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'CANCELLED' },
      { new: true }
    ).populate('concertId userId');
    if (!booking) {
      return res.status(404).send('Booking not found');
    }

    // Increase available tickets
    await Concert.findByIdAndUpdate(
      booking.concertId._id,
      { $inc: { availableTickets: booking.quantity } }
    );

    // res.redirect('/concert-list');
    // res.redirect(`/admin/bookings/${req.params.id}`); // 
    
if(req.xhr || req.headers.accept.indexOf('json') > -1) {
    return  res.json({ status: 'Booking cancelled' });
    }else{
return res.redirect('back');
    }

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).send('Server Error');
  }
});
module.exports = router;
