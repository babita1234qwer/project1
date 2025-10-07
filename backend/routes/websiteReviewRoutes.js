// routes/websiteReviewRoutes.js

const express = require('express');
const Reviewrouter = express.Router();
const userMidlleware=require("../middleware/usermiddeware");
const { createWebsiteReview, getApprovedWebsiteReviews } = require('../controllers/websiteReviewController');

Reviewrouter.post("/create",userMidlleware,createWebsiteReview);
Reviewrouter.get("/all",userMidlleware,getApprovedWebsiteReviews);

module.exports = Reviewrouter;