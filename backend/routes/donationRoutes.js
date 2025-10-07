// routes/donationRoutes.js

const express = require('express');
const Donationrouter = express.Router();
const userMiddleware=require("../middleware/usermiddeware");
const { createDonationOrder, verifyDonation } = require('../controllers/donationControllers');

// All donation routes should be protected


Donationrouter.post('/pay',userMiddleware, createDonationOrder);
Donationrouter.get("/verfiy",verifyDonation);


module.exports = Donationrouter;