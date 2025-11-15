

const WebsiteReview = require('../models/WebsiteReview');


 const createWebsiteReview = async (req, res) => {
  try {
    const { rating, comment, reviewerName, reviewerEmail } = req.body;

    const review = new WebsiteReview({
      rating,
      comment,
      reviewerName,
      reviewerEmail,
    });

    await review.save();

    res.status(201).json({ 
      message: 'Thank you! Your review has been submitted and is pending approval.',
      data: review 
    });

  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};


const getApprovedWebsiteReviews = async (req, res) => {
  try {
    const reviews = await WebsiteReview.find({ isApproved: true }).sort({ createdAt: -1 });

    
    const averageRating = reviews.length > 0 
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.status(200).json({ 
        averageRating,
        count: reviews.length,
        data: reviews 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
module.exports={createWebsiteReview,getApprovedWebsiteReviews};