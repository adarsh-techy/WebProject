const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  concertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Concert",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  cardName: {
    type: String,
    required: true,
  },
  cardNumber: {
    type: String,
    required: true,
  },
  expiry: {
    type: String,
    required: true,
  },
  cvv: {
    type: String,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['CONFIRMED', 'PENDING', 'CANCELLED'],
    default: 'CONFIRMED',  // Add default status
    required: true
  },
  qrImage:{
    type: String,
    // required: true,
  },
  serviceFee: {
    type: Number,
    default: 5.00
  },
});

module.exports = mongoose.model("Booking", bookingSchema);
