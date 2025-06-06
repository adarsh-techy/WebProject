const mongoose = require("mongoose");

const UserProfileSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
    maxlength: 200,
  },
  lname: {
    type: String,
    required: true,
    maxlength: 200,
  },
  technologies: {
    type: String,
    // required: true,
    maxlength: 200,
  },
  email: {
    type: String,
    default: null,
    lowercase: true,
    trim: true,
  },
  display_picture: {
    type: String,
    required: true,
  },
});
const UserProfile = mongoose.model('UserProfile',UserProfileSchema);

module.exports = UserProfile;
