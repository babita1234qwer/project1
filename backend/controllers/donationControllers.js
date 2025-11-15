

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Donation = require('../models/donationSchema.js'); 

require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createDonationOrder = async (req, res) => {
  try {
  
    const amount = req.body.amount || 20000; 
    console.log("Creating donation order for amount:", amount);

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `donation_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log("Donation order created successfully:", order.id);
    
    res.json({ 
      success: true,
      id: order.id,
      amount: order.amount 
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};


const verifyDonation = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;


  if (!req.result || !req.result._id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  try {
    // Find the order to get the amount
    razorpay.orders.fetch(razorpay_order_id)
      .then(order => {
        // Create a new donation record
        Donation.create({
          userId: req.result._id,
          paymentId: razorpay_payment_id,
          amount: order.amount, 
        });
      })
      .catch(err => {
        console.error("Could not fetch order:", err);
      });

    console.log("Donation verified for user:", req.result.email);
    res.json({ success: true, message: "Donation successful! Thank you for your support." });
  } catch (error) {
    console.error("Donation verification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createDonationOrder,
  verifyDonation,
};