// components/DonationButton.jsx

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosclient';

const DonationButton = ({ amount = 200, onSuccess }) => { // Default amount ₹200
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const loadRazorpay = () => {
      if (window.Razorpay) return;
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    };
    loadRazorpay();
  }, []);

  const handleDonation = async () => {
    if (!window.Razorpay) {
      alert("Payment system is loading, please try again in a moment");
      return;
    }

    try {
      // Pass the amount in paise to the backend
      const { data: order } = await axiosClient.post("/donation/pay", { amount: amount * 100 });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "HelpNet",
        description: "Donation to keep our platform running",
        order_id: order.id,
        handler: async (response) => {
          try {
            const verify = await axiosClient.post('/donation/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verify.data.success) {
              alert('Thank you for your generous donation!');
              onSuccess(); // Call the success handler
            } else {
              alert('Donation verification failed');
            }
          } catch (error) {
            console.error("Verification error:", error);
            alert('An error occurred during verification.');
          }
        },
        prefill: {
          name: user?.name || "HelpNet Supporter",
          email: user?.email || "supporter@example.com",
        },
        theme: {
          color: "#3B82F6", // A blue color to match HelpNet
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Donation initiation error:", error);
      alert('Error initiating donation. Please try again.');
    }
  };

  return (
    <button 
      onClick={handleDonation} 
      className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Donate ₹{amount}
    </button>
  );
};

export default DonationButton;