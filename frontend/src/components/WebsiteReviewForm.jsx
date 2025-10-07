// components/WebsiteReviewForm.jsx

import { useState } from 'react';
import axiosClient from '../utils/axiosclient';
import { Button, Input, Textarea } from '@heroui/react';

const StarRating = ({ rating, setRating }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-3xl transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
          onClick={() => setRating(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const WebsiteReviewForm = ({ onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !reviewerName.trim() || !reviewerEmail.trim()) {
      setSubmitMessage('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');
    try {
      await axiosClient.post('/reviews/create', {
        rating,
        comment,
        reviewerName,
        reviewerEmail,
      });
      setSubmitMessage('Thank you! Your review has been submitted for approval.');
      onReviewSubmitted(); // Refresh the list
      // Reset form
      setRating(5);
      setComment('');
      setReviewerName('');
      setReviewerEmail('');
    } catch (error) {
      console.error('Failed to submit review:', error);
      setSubmitMessage(error.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-gray-900">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
        <StarRating rating={rating} setRating={setRating} />
      </div>
      <Input
        label="Your Name"
        placeholder="John Doe"
        value={reviewerName}
        onChange={(e) => setReviewerName(e.target.value)}
        isRequired
      />
      <Input
        label="Your Email"
        type="email"
        placeholder="john.doe@example.com"
        value={reviewerEmail}
        onChange={(e) => setReviewerEmail(e.target.value)}
        isRequired
      />
      <Textarea
        label="Your Review"
        placeholder="Tell us about your experience with HelpNet..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        isRequired
      />
      <Button 
        type="submit" 
        color="primary" 
        isLoading={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
      {submitMessage && <p className="text-center text-sm text-green-600">{submitMessage}</p>}
    </form>
  );
};

export default WebsiteReviewForm;