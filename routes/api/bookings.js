const express = require("express");
const Booking = require("../../models/bookingModel");
const Concert = require("../../models/concertModel");
const verifyToken = require("../../middlewares/verifyToken");
const router = express.Router();
const { body, validationResult } = require("express-validator");

// POST /api/bookings/:concertId
router.post(
  "/:concertId",
  verifyToken,
  [
    body("quantity")
      .isInt({ min: 1, max: 10 })
      .withMessage("Quantity must be between 1-10"),
      body('fullName').notEmpty().trim().escape(),
      body('email').isEmail().normalizeEmail(),
     body('phone').matches(/^[\d\s\+-]{8,15}$/).withMessage('Enter a valid phone number'),
    body("totalPrice").isFloat({ min: 0 }),
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { concertId } = req.params;

    try {
      // Verify concert exists and has available tickets
      const concert = await Concert.findById(concertId);
      if (!concert) {
        return res.status(404).json({ message: "Concert not found" });
      }

      // Create booking with all required fields
      const booking = new Booking({
        userId: req.user._id,
        concertId: concert._id,
        bookingDate: new Date(),
        quantity: req.body.quantity,
        fullName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        cardName: req.body.cardName,
        cardNumber: req.body.cardNumber, // Note: In production, use payment processor tokens
        expiry: req.body.expiry,
        cvv: req.body.cvv,
        totalPrice: req.body.totalPrice,
        status: "CONFIRMED",
        serviceFee: 5.0,
      });

      await booking.save();

      // Populate concert details in response
      const bookingWithConcert = await Booking.findById(booking._id).populate(
        "concertId"
      );

      return res.status(201).json({
        message: "Booking successful",
        booking: bookingWithConcert,
      });
    } catch (err) {
      console.error("Booking creation error:", err);
      return res.status(500).json({
        message: "Failed to create booking",
        error: err.message,
      });
    }
  }
);

// GET /api/bookings/my
router.get("/my", verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate({
        path: "concertId",
        select: "title date venue price concertImage",
      })
      .sort({ bookingDate: -1 }); // Newest first

    if (!bookings.length) {
      return res
        .status(200)
        .json({ message: "No bookings found", bookings: [] });
    }

    return res.json(bookings);
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
    return res.status(500).json({
      message: "Failed to retrieve bookings",
      error: err.message,
    });
  }
});

module.exports = router;
