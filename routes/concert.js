var express = require("express");
var router = express.Router();
const upload = require("../middlewares/multerConfig.js")
// const multer = require("multer");
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });
const { body, validationResult } = require("express-validator"); // Add this import
const ejs = require("ejs");
const fs = require("fs").promises;
const pdf = require("html-pdf-node");
const puppeteer = require("puppeteer");
const qrCode = require("qrcode");
const Concert = require("../models/concertModel.js");
const isAuthenticated = require("../middlewares/auth.js");
const isAdminLoggedIn = require("../middlewares/adminAuth.js");
const Booking = require("../models/bookingModel.js");
const { time } = require("console");
const Review = require("../models/reviewModel.js");




router.get("/book/:id", isAuthenticated, async (req, res) => {
  try {
    console.log(req.session.user._id);

    const bookingData = await Booking.findById(req.params.id)
      .populate("concertId")
      .populate("userId");
    if (!bookingData) {
      return res.status(404).send("Booking not found");
    }

    res.render("booking", {
      bookingData,
      user: bookingData.userId,
      concert: bookingData.concertId,
      userEmail: req.user ? req.user.email : null,
      userName: req.user ? req.user.name : null,
      userProfileImage: req.user ? req.user.profileImage : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/book/:id", isAuthenticated, async (req, res) => {
  try {
    const concertId = req.params.id;
    const {
      fullName,
      email,
      phone,
      cardName,
      cardNumber,
      expiry,
      cvv,
      quantity,
    } = req.body;

    console.log("Booking request received:", {
      concertId,
      fullName,
      email,
      quantity,
    });

    const concert = await Concert.findById(concertId);
    if (!concert) {
      console.log("Concert not found for ID:", concertId);
      return res.status(404).send("Concert not found");
    }

    const ticketQuantity = parseInt(quantity) || 1;
    if (ticketQuantity < 1 || ticketQuantity > 3) {
      return res
        .status(400)
        .send("Invalid ticket quantity. Please select 1-3 tickets.");
    }

    // Check if enough tickets are available
    if (concert.availableTickets < ticketQuantity) {
      return res.status(400).send("Not enough tickets available");
    }

    const serviceFee = 5.0;
    const totalPrice = (concert.price * ticketQuantity + serviceFee).toFixed(2);

    // Create new booking
    const booking = new Booking({
      userId: req.session.userId,
      concertId: concert._id,
      quantity: ticketQuantity,
      fullName,
      email,
      phone,
      cardName,
      cardNumber,
      expiry,
      cvv,
      totalPrice,
      serviceFee,
    });

    await booking.save();

    const bookingUrl = `${req.protocol}://${req.get("host")}/booking/view/${
      booking._id
    }`;

    const qrImage = await qrCode.toDataURL(bookingUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      scale: 6,
    });

    booking.qrImage = qrImage;
    await booking.save();

    // Update available tickets
    concert.availableTickets -= ticketQuantity;
    await concert.save();

    console.log("Booking saved successfully:", booking._id);

    // Render booking confirmation page

    res.render("booking", {
      concert,
      userEmail: email,
      userName: fullName,
      quantity: ticketQuantity,
      serviceFee: serviceFee.toFixed(2),
      totalPrice: `$${totalPrice}`,
      bookingId: booking._id,
      qrImage,
      bookingUrl,
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).send("Server Error: " + error.message);
  }
});

// POST Booking Submission

// Show form to create new concert

// Handle new concert creation

// Show form to edit an existing concert
router.get("/edit/:id", isAdminLoggedIn, async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.id);
    if (!concert) return res.status(404).send("Concert not found");

    res.render("concert-form", {
      concert,
      errors: null,
formAction: `/concert/edit/${concert._id}`,  
  });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Handle concert update
router.post(
  "/edit/:id",
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
    try {

const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render("concert-form", {
          concert: {_id: req.params.id, ...req.body},
          errors: errors.array(),
          formAction: `/concert/edit/${req.params.id}`,
        });
      }


      const { title, name, date, venue, price, availableTickets, description } =
        req.body;

      const updateData = {
        title,
        name,
        date,
        venue,
        price,
        availableTickets,
        description,
        //  concertImage: {
        //   data: req.file.buffer,
        //   contentType: req.file.mimetype,
        // },
      };

      // If a new image was uploaded, update it
      if (req.file) {
        updateData.concertImage = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        };
      }

      const concert = await Concert.findByIdAndUpdate(
        req.params.id,
        updateData,
        { runValidators: true, new: true }
      );

      if (!concert) return res.status(404).send("Concert not found");

      res.redirect("/admin/adminlist");
    } catch (error) {
      req.body._id = req.params.id;
      res.render("concert-form", {
        concert: { _id: req.params.id, ...req.body },
        errors: error.errors,
formAction: `/concert/edit/${req.params.id}`,      
});
    }
  }
);

// Delete concert
router.post("/delete/:id", isAdminLoggedIn, async (req, res) => {
  try {
    await Concert.findByIdAndDelete(req.params.id);
    res.redirect("/admin/adminlist");
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// PDF ROUTE
router.get("/booking/pdf/:bookingId", async (req, res) => {
  let browser;
  try {

 browser = await puppeteer.launch({
    headless: "new", // optional
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // needed in some systems
  });


    // 1. Get booking data with error handling
    const booking = await Booking.findById(req.params.bookingId)
      .populate("concertId")
      .populate("userId")
      .maxTimeMS(10000); // 10 second timeout for DB query

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // 2. Generate QR code with error handling
    let qrImage;
    try {
      const bookingUrl = `${req.protocol}://${req.get("host")}/booking/view/${booking._id}`;
      qrImage = await qrCode.toDataURL(bookingUrl, {
        errorCorrectionLevel: "H",
        margin: 1,
        scale: 6,
        timeout: 5000 // 5 second timeout
      });
    } catch (qrError) {
      console.error("QR generation failed:", qrError);
      return res.status(500).json({ error: "Failed to generate QR code" });
    }

    // 3. Render HTML template
    let html;
    try {
      const template = await fs.readFile("views/pdf-template.ejs", "utf-8");
      html = ejs.render(template, {
        booking,
        concert: booking.concertId,
        qrImage,
      });
    } catch (templateError) {
      console.error("Template rendering failed:", templateError);
      return res.status(500).json({ error: "Failed to render template" });
    }

    // 4. Configure Puppeteer with robust settings
    const launchOptions = {
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-setuid-sandbox',
        '--disable-extensions'
      ],
      timeout: 30000, // 30 second launch timeout
      dumpio: true // log browser output
    };

    // Use Chromium executable path in production if needed
    if (process.env.NODE_ENV === 'production') {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
    }

    // 5. Launch browser with retry logic
    let retries = 3;
    while (retries > 0) {
      try {

puppeteer.launch(launchOptions).then(browsern =>{
  browser.on('disconnected', () => {
    console.error('browser disconnected');
    
  } )
})

      } catch (launchError) {
        retries--;
        if (retries === 0) {
          throw launchError;
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second before retry
      }
    }

    const page = await browser.newPage();
    
    // Configure page settings
    await page.setDefaultNavigationTimeout(30000); // 30 second timeout
    await page.setDefaultTimeout(30000); // 30 second timeout
    await page.setViewport({ width: 1200, height: 1200 });

    // 6. Set content with proper waiting
    await page.setContent(html, {
      waitUntil: ['domcontentloaded', 'networkidle0'],
      timeout: 30000
    });

    // 7. Generate PDF with proper options
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      preferCSSPageSize: true,
      timeout: 30000 // 30 second timeout for PDF generation
    });

    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length < 100) {
      throw new Error('Generated PDF is invalid or empty');
    }

    // 8. Send response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="EventHub-Ticket-${booking._id}.pdf"`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation failed:', error);
    
    // More specific error responses
    if (error.message.includes('Target closed')) {
      return res.status(500).json({ 
        error: 'PDF generation failed due to browser crash',
        details: 'The browser closed unexpectedly during PDF generation'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    });
  } finally {
    // 9. Clean up browser instance
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
});

router.get("/:id", async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.id);
    if (!concert) {
      return res.status(404).send("Concert not found");
    }

    if (!req.session.userId) {
      const currentDate = new Date();
      const events = await Concert.find({
        published: true,
        date: { $gt: currentDate },
      })
        .sort({ date: 1 })
        .limit(8);

      return res.render("page", {
        str: "ConcertVerse",
        events: events,
        userEmail: null,
        userName: null,
        userProfileImage: null,
        showLoginModal: true,
        redirectAfterLogin: `/concert/${req.params.id}`,
      });
    }

    res.render("concert-details", {
      title: "Concert Details",
      concert,
      userEmail: req.session.userEmail,
      userName: req.session.userName,
      userProfileImage: req.session.userProfileImage,
    });
  } catch (error) {
    console.error("Error loading concert details:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ event: req.params.id })
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("error fetching event reviews:", error);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
