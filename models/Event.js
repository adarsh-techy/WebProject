// // models/Event.js
// const mongoose = require("mongoose");

// const eventSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   artist: { type: String, required: true },
//   description: { type: String, required: true },
//   image: { type: String, required: true },
//   date: { type: Date, required: true },
//   venue: { type: String, required: true },
//   price: { type: Number, required: true },
//   availableTickets: { type: Number, required: true },
// });

// const bookingSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
//   tickets: { type: Number, required: true },
//   totalPrice: { type: Number, required: true },
//   bookingDate: { type: Date, default: Date.now },
//   status: {
//     type: String,
//     enum: ["confirmed", "cancelled"],
//     default: "confirmed",
//   },
// });

// const Event = mongoose.model("Event", eventSchema);
// const Booking = mongoose.model("Booking", bookingSchema);

// module.exports = { Event, Booking };
