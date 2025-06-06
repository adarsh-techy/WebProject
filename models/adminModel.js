const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "email field is required"],
  },
  password: {
    type: String,
    required: [true, "password field is required"],
    minlength: [6, "atleast 6 characters required"],
  },
  isAdmin: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "admin",
  },
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
