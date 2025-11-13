

import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@heroui/react';
import DonationButton from '../components/DonationButton';
import WebsiteReviewForm from '../components/WebsiteReviewForm';
import WebsiteReviewList from '../components/WebsiteReviewList';


const ReportIcon = () => (
  <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const RespondIcon = () => (
  <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ResolveIcon = () => (
  <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const AboutPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);

  const handleReviewSubmitted = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDonationSuccess = () => {
    setShowThankYou(true);
    setTimeout(() => setShowThankYou(false), 5000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dark Background with Stars */}
      <div className="fixed inset-0 z-0">
        {/* Base dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-blue-900 to-purple-900"></div>
        
        {/* Animated stars layer 1 */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={`star1-${i}`}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                width: Math.random() * 3 + 'px',
                height: Math.random() * 3 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                animationDuration: Math.random() * 3 + 2 + 's',
                opacity: Math.random() * 0.8 + 0.2
              }}
            ></div>
          ))}
        </div>
        
        {/* Animated stars layer 2 - larger, slower */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={`star2-${i}`}
              className="absolute rounded-full bg-blue-200 animate-pulse"
              style={{
                width: Math.random() * 2 + 'px',
                height: Math.random() * 2 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 8 + 's',
                animationDuration: Math.random() * 4 + 3 + 's',
                opacity: Math.random() * 0.6 + 0.1
              }}
            ></div>
          ))}
        </div>
        
        {/* Shooting stars */}
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <div
              key={`shooting-${i}`}
              className="absolute h-px bg-gradient-to-r from-transparent via-white to-transparent animate-ping"
              style={{
                width: Math.random() * 100 + 50 + 'px',
                top: Math.random() * 50 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 10 + 's',
                animationDuration: Math.random() * 2 + 1 + 's',
                transform: 'rotate(-45deg)',
                opacity: 0
              }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Subtle overlay for depth */}
      <div className="fixed inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10"></div>
      
      {/* Content Container */}
      <div className="relative z-20">
        {/* Hero Section */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              About HelpNet
            </h1>
            <p className="text-xl text-gray-200 leading-relaxed">
              Connecting communities in times of need
            </p>
          </div>
        </section>
        
        {/* What is HelpNet Section */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-blue-400 mb-6">What is HelpNet?</h2>
            <p className="text-lg text-gray-200 leading-relaxed">
              In an emergency, every second counts. HelpNet bridges the gap between those in need and those who can help. 
              By leveraging real-time location services and a network of compassionate volunteers, we ensure that help is not just on the way, but is directed efficiently and accurately. 
              Whether it's a medical situation, a fire hazard, or any urgent need, our platform empowers communities to respond together.
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-blue-400 text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-blue-600/20 p-4 rounded-full mb-4 backdrop-blur-sm border border-blue-500/50 shadow-lg shadow-blue-500/20">
                  <ReportIcon />
                </div>
                <h3 className="text-xl font-semibold text-red-300 mb-2">1. Report an Emergency</h3>
                <p className="text-gray-200">
                  Anyone can instantly report an emergency through our app. Pinpoint the location on the map, describe the situation, and send out an alert to the network.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-600/20 p-4 rounded-full mb-4 backdrop-blur-sm border border-blue-500/50 shadow-lg shadow-blue-500/20">
                  <RespondIcon />
                </div>
                <h3 className="text-xl font-semibold text-blue-300 mb-2">2. Volunteers are Notified</h3>
                <p className="text-gray-200">
                  Our system instantly notifies nearby, qualified volunteers and community members. They see the request, the location, and can choose to respond.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-600/20 p-4 rounded-full mb-4 backdrop-blur-sm border border-blue-500/50 shadow-lg shadow-blue-500/20">
                  <ResolveIcon />
                </div>
                <h3 className="text-xl font-semibold text-blue-300 mb-2">3. Get Help, Fast</h3>
                <p className="text-gray-200">
                  Responders get turn-by-turn directions directly to the emergency location. The person who requested help can see who is coming and their estimated time of arrival.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-blue-400 text-center mb-12"> Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-800/50 p-8 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50 hover:bg-gray-800/70 transition-all duration-300">
                <h3 className="text-2xl font-bold text-blue-300 mb-4">Speed</h3>
                <p className="text-gray-200">
                  We prioritize rapid response. Our platform is designed to cut through the noise and get help to where it's needed, fast.
                </p>
              </div>
              <div className="bg-gray-800/50 p-8 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50 hover:bg-gray-800/70 transition-all duration-300">
                <h3 className="text-2xl font-bold text-blue-300 mb-4">Community</h3>
                <p className="text-gray-200">
                  We believe in the power of neighbors helping neighbors. HelpNet strengthens local bonds and creates a safer, more connected community for everyone.
                </p>
              </div>
              <div className="bg-gray-800/50 p-8 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50 hover:bg-gray-800/70 transition-all duration-300">
                <h3 className="text-2xl font-bold text-blue-300 mb-4">Accessibility</h3>
                <p className="text-gray-200">
                  Help is a fundamental need. That's why our platform is and will always be completely free for everyone, ensuring no one is left behind in a time of crisis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Support Us Section */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-blue-400 mb-6">Support HelpNet</h2>
            <p className="text-lg text-gray-200 leading-relaxed mb-8">
              HelpNet is and always will be a free service for everyone. However, running and maintaining this platform comes with costs for servers, development, and security. 
              Your generous donation helps us keep the lights on and continue our mission to connect communities in crisis. Every contribution, no matter the size, makes a real difference.
            </p>
            
            {showThankYou && (
              <div className="mb-6 p-4 bg-green-600/80 border border-green-400 text-white rounded-lg backdrop-blur-sm shadow-lg">
                <strong>Thank you!</strong> Your donation means a lot to us and to the communities we serve.
              </div>
            )}

            <div className="flex justify-center items-center gap-4">
              <DonationButton amount={200} onSuccess={handleDonationSuccess} />
              <DonationButton amount={500} onSuccess={handleDonationSuccess} />
              <DonationButton amount={1000} onSuccess={handleDonationSuccess} />
            </div>
            <p className="text-sm text-gray-300 mt-4">Choose an amount or support us with a custom donation.</p>
          </div>
        </section>

        {/* Community Feedback Section */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-blue-300 text-center mb-12">Community Feedback</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Review Form */}
              <div>
                <h3 className="text-2xl font-semibold text-blue-300 mb-6">Share Your Experience</h3>
                <p className="text-gray-200 mb-6">
                  Your feedback helps us improve and grow. Let us know what you think about HelpNet.
                </p>
                <WebsiteReviewForm onReviewSubmitted={handleReviewSubmitted} />
              </div>
              
              {/* Review List */}
              <div>
                <h3 className="text-2xl font-semibold text-white mb-6">Recent Reviews</h3>
                <WebsiteReviewList key={refreshKey} />
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 py-16 px-6 text-center backdrop-blur-md border-t border-blue-500/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">Be a Part of the Solution</h2>
            <p className="text-xl text-blue-100 mb-8">
              Whether you need help or want to offer it, your contribution makes a real difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                as={Link} 
                to="/emergency/create" 
                color="secondary" 
                size="lg" 
                className="font-semibold bg-red-600 hover:bg-red-700"
              >
                Report an Emergency
              </Button>
              <Button 
                as={Link} 
                to="/volunteers" 
                color="default" 
                size="lg" 
                variant="flat" 
                className="font-semibold text-white border-white hover:bg-white hover:text-blue-600"
              >
                Become a Volunteer
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;