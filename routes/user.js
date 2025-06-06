const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const { isUserLoggedIn } = require("../middlewares/userAuth");
const Concert = require("../models/concertModel");
const isAuthenticated = require("../middlewares/auth");
const Ticket = require("../models/ticketModel")
const Review = require("../models/reviewModel")

router.get("/register", (req, res) => {
  res.render("user-register", { title: "User registration", error: null });
});

router.post("/register", async (req, res) => {
  try {
    const name = req.body.name.trim();
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    if (password.length < 8) {
      return res.render("user-register", {
        title: "User registration",
        error: "Password must be at least 8 characters long",

      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("user-register", {
        title: "User registration",
        error: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name, email, password: hashedPassword }); // Store hashed password

    await user.save();

    req.session.userId = user._id;

    res.redirect("/user/login");
  } catch (error) {
    console.error("Registration error:", error);
    res.render("user-register", {
      title: "User registration",
      error: "Something went wrong",
    });
  }
});

// router.get("/user/login", (req, res) => {
//   console.log("Defining route: GET /user/login"); // Debug log
//   res.render("user-login", {
//     title: "User Login",
//     error: null,
//   });
// });

router.get("/login", (req, res) => {
  res.render("user-login", { title: "User Login", error: null });
});

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    console.log(`Trying to login: ${email}`);
    console.log(
      `Password from form: '${password}' (length: ${password.length})`
    );

    

    // Trim inputs
    email = email.trim();
    password = password.trim();

    // Input validation
    if (!email || !password) {
      return res.render("user-login", {
        title: "User Login",
        error: "Please provide both email and password",
      });
    }

    let user = await User.findOne({ email });
    console.log("User found:", user);

    if (!user) {
      return res.render("user-login", {
        title: "User Login",
        error: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    console.log("Password match?", isMatch);

    if (!isMatch) {
      return res.render("user-login", {
        title: "User Login",
        error: "Invalid email or password",
      });
    }

    // Set session data
    req.session.userId = user._id;
    req.session.userEmail = user.email;
    req.session.userName = user.name;
    req.session.userProfileImage = user.profileImage || null;

    // Redirect to homepage with 8 events
    // const currentDate = new Date();
    // const events = await Concert.find({
    //   published: true,
    //   date: { $gt: currentDate },
    // })
    //   .sort({ date: 1 })
    //   .limit(8);

    req.session.save((err) => {

      if (err) {
        console.error("Session save error:", err);
        return res.render("user-login", {
          title: "User Login",
          error: "Something went wrong. Please try again.",
        });
      }
      res.redirect("/user/page"); // Redirect to /user/page instead of rendering
    });
  } catch (error) {
    console.error("Login error:", error);
    res.render("user-login", {
      title: "User Login",
      error: "Something went wrong. Please try again.",
    });
  }
});

// router.post(
//   "/login",
  
    
//   async (req, res) => {
//     try {
      
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           error: "Invalid email or password",
//         });
//       }

//       const { email, password } = req.body;
//       const user = await User.findOne({ email });
//       if (!user) {
//         return res.status(400).json({
//           success: false,
//           error: "Invalid email or password",
//         });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(400).json({
//           success: false,
//           error: "Invalid email or password",
//         });
//       }

//       // Set session data
//       req.session.userId = user._id;
//       req.session.userName = user.name;
//       req.session.userEmail = user.email;
//       req.session.userProfileImage = user.profileImage;

//       // Get redirect URL from request body or fallback to homepage
//       const redirectUrl = req.body.redirect || "/";
//       res.json({ success: true, redirect: redirectUrl });
//     } catch (error) {
//       console.error("Login error:", error);
//       res.status(500).json({
//         success: false,
//         error: "Server error",
//       });
//     }
//   }
// );






router.get("/page", isAuthenticated, async (req, res) => {
  try {
    const events = await Concert.find();
    const user = await User.findById(req.session.userId);
    console.log("Events:", events); // Debug log
    console.log("Session data:", req.session); // Debug log

    res.render("page", {
      title: "User Dashboard",
      str: "User Dashboard",
      userEmail: req.session.userEmail,
      userName: req.session.userName,
      userProfileImage: user.profileImage,
      events,
    });
  } catch (error) {
    console.error("Error:", error);
    res.redirect("/user/login");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect("/user/page");
    }
  });
  res.clearCookie("connect.sid");

  res.redirect("/");
});

// function isAuthenticated(req, res, next) {
//   if (req.session && req.session.userId) {
//     next();
//   } else {
//     res.redirect("/user/login");
//   }
//  }

router.get('/profile', isAuthenticated, async (req, res) => {
 try {
  const user = await User.findById(req.session.userId);

const tickets = await Ticket.find({ user: req.session.userId }).populate('event')
.sort({'event.date': 1}); // Sort tickets by event date

 const reviews = await Review.find({ user: req.userId }).populate('event');

 const uniqueEventIds = [...new Set(tickets.map(ticket => ticket.event._id.toString()))];
    const eventCount = uniqueEventIds.length;


res.render('profile', {
  title: 'My Profile',
  userName: user.name,
  userEmail: user.email,
  userProfileImage: user.profileImage,
  userCreatedAt: user.createdAt,
  ticketCount: tickets.length,
  eventCount: eventCount,
  tickets: tickets,
   reviews: reviews
})


 } catch (err) {
  console.error('Error loading profile:', err);
  res.status(500).send('Internal Server Error');
 }
    });






router.get('/reviews', isAuthenticated, async (req,res) => {
  try {
    const reviews = await Review.find({user: req.user._id})
    .populate('event', 'title date venue')
    .sort({createdAt: -1});

    res.json({
      success: true,
      reviews
    })

  } catch (error) {
    console.error('error fetching user review:', error);
    res.status(500).json({error: 'server error'});
  }
})

router.post('/reviews', isAuthenticated, async (req,res) => {
  try {
    const {eventId, rating, reviewText} = req.body;

if (!eventId || !rating || !reviewText) {
  return res.status(400).json({error: 'missing fields'});
}

const event = await Concert.findById(eventId);
if (!event) {
  return res.status(404).json({error: 'event not found'});
}

const hasAttended = await Booking.findOne({
  userId: req.user._id,
  concertId: eventId
});
if (!hasAttended) {
  return res.status(403).json({
    error: 'attend an event before reviewing'
  });
}

const existingReview = await Review.findOne({
  event: eventId,
  user: req.user._id
});


if(existingReview){
  return res.status(400).json({
    error: 'already reviewed'
  });
}

const review = new Review({
  event: eventId,
  user: req.user._id,
  rating,
  reviewText
})

await review.save();

const reviews = await Review.find({event: eventId});
event.averageRating = calculateAverageRating(reviews);
event.reviewCount = reviews.length;
event.reviews.push(review._id);
await event.save();


res.status(201).json({
  success: true,
  review,
  averageRating: event.averageRating,
  reviewCount: event.reviewCount
});


  } catch (error) {
   console.error('review submit error:', error);
   res.status(500).json({error: 'server error'})
    
  }
});


router.put('/reviews/:id', isAuthenticated, async (req,res) => {
  
try {
  
  const {rating, reviewText} = req.body;
  const review = await Review.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!review) {
    return res.status(404).json({error: 'review not found'});
  }

  review.rating = rating || review.rating;

  review.reviewText = reviewText || review.reviewText;
  await review.save();

  const event = await Concert.findById(review.event);
  const reviews = await Review.find({event: review.event});
  event.averageRating = calculateAverageRating(reviews);
  await event.save();

  res.json({
    success: true,
    review,
    averageRating: event.averageRating
  });


} catch (error) {
  console.error('error updating review:', error);
  res.status(500).json({error: 'server error'});
  
}
});


router.delete('/reviews/:id', isAuthenticated, async (req,res) => {
  try {
    const review = await Review.findByIdAndDelete({
      _id:req.params.id,
      user:req.user._id
    });

if (!review) {
  return res.status(404).json({error: 'review not found'});
}

const event = await Concert.findById(review.event);
const reviews = await Review.find({event: review.event});


event.averageRating = reviews.length > 0 ?
calculateAverageRating(reviews) : 0;
event.reviewCount = reviews.length;

event.reviews = event.reviews.filter(
  reviewId => reviewId.toString() !== review._id.toString()
);

await event.save();

res.json({
  success: true,
  message: 'review deleted'
});



  } catch (error) {
console.error('error deleting review:', error);
    res.status(500).json({error: 'server error'})
  }
});

function calculateAverageRating(reviews) {
  if (reviews.length === 0) {
    return 0;

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return parseFloat((total / reviews.length).toFixed(1));
  }
}




module.exports = router;
