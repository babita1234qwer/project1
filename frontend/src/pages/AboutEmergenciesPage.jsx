// src/pages/AboutPage.jsx

import { Link } from 'react-router-dom';
import { Button } from '@heroui/react';

// Simple SVG Icons for visual appeal
const ReportIcon = () => (
  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
);

const RespondIcon = () => (
  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);

const ResolveIcon = () => (
  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
);


const AboutPage = () => {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Connecting Communities in Crisis
          </h1>
          <p className="text-xl md:text-2xl font-light opacity-90">
            HelpNet is a free, community-driven platform that connects people facing emergencies with local volunteers who can provide immediate assistance.
          </p>
        </div>
      </section>

      {/* What is HelpNet Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">What is HelpNet?</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            In an emergency, every second counts. HelpNet bridges the gap between those in need and those who can help. 
            By leveraging real-time location services and a network of compassionate volunteers, we ensure that help is not just on the way, but is directed efficiently and accurately. 
            Whether it's a medical situation, a fire hazard, or any urgent need, our platform empowers communities to respond together.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <ReportIcon />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Report an Emergency</h3>
              <p className="text-gray-600">
                Anyone can instantly report an emergency through our app. Pinpoint the location on the map, describe the situation, and send out an alert to the network.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <RespondIcon />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Volunteers are Notified</h3>
              <p className="text-gray-600">
                Our system instantly notifies nearby, qualified volunteers and community members. They see the request, the location, and can choose to respond.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <ResolveIcon />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Get Help, Fast</h3>
              <p className="text-gray-600">
                Responders get turn-by-turn directions directly to the emergency location. The person who requested help can see who is coming and their estimated time of arrival.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12"> Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h3 className="text-2xl font-bold text-blue-600 mb-4">Speed</h3>
              <p className="text-gray-600">
                We prioritize rapid response. Our platform is designed to cut through the noise and get help to where it's needed, fast.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h3 className="text-2xl font-bold text-blue-600 mb-4">Community</h3>
              <p className="text-gray-600">
                We believe in the power of neighbors helping neighbors. HelpNet strengthens local bonds and creates a safer, more connected community for everyone.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h3 className="text-2xl font-bold text-blue-600 mb-4">Accessibility</h3>
              <p className="text-gray-600">
                Help is a fundamental need. That's why our platform is and will always be completely free for everyone, ensuring no one is left behind in a time of crisis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-blue-600 py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">Be a Part of the Solution</h2>
          <p className="text-xl text-blue-100 mb-8">
            Whether you need help or want to offer it, your contribution makes a real difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button as={Link} to="/emergency/create" color="secondary" size="lg" className="font-semibold">
              Report an Emergency
            </Button>
            <Button as={Link} to="/volunteers" color="default" size="lg" variant="flat" className="font-semibold text-white border-white hover:bg-white hover:text-blue-600">
              Become a Volunteer
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;