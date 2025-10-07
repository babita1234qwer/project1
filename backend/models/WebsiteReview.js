// models/WebsiteReview.js

const mongoose = require('mongoose');

const websiteReviewSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  reviewerName: {
    type: String,
    required: true,
    trim: true,
  },
  reviewerEmail: {
    type: String,
    required: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'is invalid'], // Basic email validation
  },
  isApproved: {
    type: Boolean,
    default: true, // Reviews must be approved by an admin before being shown
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('WebsiteReview', websiteReviewSchema);