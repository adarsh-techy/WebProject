// const express = require("express");
// const router = express.Router();

// const { Event, Booking } = require("../models/Event");
// const { isAuthenticated } = require("../middlewares/auth");

// router.get('/', async (req, res) => {
//   try {
//     const events = await Event.find(); // Fetch all events from database
//     res.render('events', {
//       str: 'Your Page Title',  // Keep your existing variables
//       userEmail: req.user ? req.user.email : null,
//       events: events           // Pass the events to the template
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Server Error');
//   }
// });
// router.get('/:id', isAuthenticated, async (req,res) => {
//     try {
//         const event = await Event.findById(req.params.id);
//         if (!event) {
//             return res.status(400).send('event not found');
//         }
//         res.render('booking',{event, user:req.user});
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('server error')
//     }
// });

// router.post('/:id/book', isAuthenticated, async (req, res) => {
//   try {
//     const event = await Event.findById(req.params.id);
//     if (!event) {
//       return res.status(404).send('Event not found');
//     }

//     const tickets = parseInt(req.body.tickets);
//     if (tickets > event.availableTickets) {
//       return res.status(400).send('Not enough tickets available');
//     }

//     // Create booking
//     const booking = new Booking({
//       user: req.user._id,
//       event: event._id,
//       tickets,
//       totalPrice: tickets * event.price
//     });

//     await booking.save();

//     // Update available tickets
//     event.availableTickets -= tickets;
//     await event.save();

//     res.redirect('/user/bookings');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Server Error');
//   }
// });

// module.exports = router;
