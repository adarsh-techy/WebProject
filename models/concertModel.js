// models/concertModel.js
const mongoose = require("mongoose");

const concertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  name: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  venue: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  availableTickets: {
    type: Number,
    required: true,
    min: 0,
  },
  concertImage: {
    data: Buffer,
    contentType: String,
  },
  published: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userprofileImage: {
    data: Buffer,
    contentType: String,
  },
 reviews:[{
  type: mongoose.Schema.Types.ObjectId,
  ref: "Review",
 }],
 averageRating: {
  type: Number,
  default: 0,
 },
 reviewCount: {
  type: Number,
  default: 0,
 },

});

// Add to your concertModel.js

    // Add this to concertModel.js before module.exports
concertSchema.methods.toJSON = function() {
  const concert = this.toObject();
  
  // Convert images to base64 strings while preserving structure
  if (concert.concertImage?.data) {
    concert.concertImage = {
      data: concert.concertImage.data.toString('base64'),
      contentType: concert.concertImage.contentType
    };
  }
  
  if (concert.userprofileImage?.data) {
    concert.userprofileImage = {
      data: concert.userprofileImage.data.toString('base64'),
      contentType: concert.userprofileImage.contentType
    };
  }
  
  return concert;
};
    

module.exports = mongoose.model("Concert", concertSchema);
