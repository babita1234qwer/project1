// components/WebsiteReviewList.jsx

import { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosclient';
import { Card, CardBody, CardHeader, Divider, Spinner } from '@heroui/react';

const WebsiteReviewList = () => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/reviews/all');
      setReviews(response.data.data);
      setAverageRating(response.data.averageRating);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-4"><Spinner /></div>;
  }

  if (reviews.length === 0) {
    return <p className="text-center text-gray-500 p-4">Be the first to share your feedback!</p>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-start">
        <h3 className="text-lg font-semibold">What People Are Saying</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl">★</span>
          <span className="text-xl font-bold">{averageRating}</span>
          <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {reviews.map((review) => (
            <div key={review._id} className="border-b pb-4 last:border-b-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{review.reviewerName}</p>
                  <div className="flex items-center gap-1 my-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-100 mt-2">{review.comment}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default WebsiteReviewList;