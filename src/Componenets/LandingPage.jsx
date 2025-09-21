import React, { useState, useEffect } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import suvImage from "../assets/suv.png";
import hatchback from "../assets/hatchback.png";
import sedan from "../assets/sedan.png";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import CarList from "./CarList";

const LandingPage = () => {
  const { user, logout } = useAuth();
  const [hoveredButton, setHoveredButton] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showCarList, setShowCarList] = useState(false);
  const [selectedType, setSelectedType] = useState("suv");
  const [showLoginNotification, setShowLoginNotification] = useState(true);

  const handleViewCars = (type) => {
    setSelectedType(type);
    setShowCarList(true);
  };

  const handleBackToHome = () => {
    setShowCarList(false);
    setSelectedType("suv");
  };

  const handleLogout = () => {
    logout();
    setShowCarList(false);
    setSelectedType("suv");
  };

  const renderButton = (buttonType, text) => {
    if (user) {
      return (
        <button
          onClick={() => handleViewCars(buttonType)}
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-block text-center"
        >
          {text}
        </button>
      );
    }

    return (
      <div className="relative inline-block">
        <button
          disabled
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg opacity-50 cursor-not-allowed transition inline-block text-center"
          onMouseEnter={() => setHoveredButton(buttonType)}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {text}
        </button>
        {hoveredButton === buttonType && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded mb-2 whitespace-nowrap z-10">
            Login to browse cars
          </div>
        )}
      </div>
    );
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowPopup(true);
    setFormData({ name: "", email: "", message: "" });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setShowLoginNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setShowCarList(false);
      setSelectedType("suv");
    }
  }, [user]);

  return (
    <div className="bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="text-2xl font-bold text-purple-600 flex items-center"
              >
                <i className="fas fa-car-side text-purple-600 mr-2"></i>
                CarRental
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/" className="text-gray-600 hover:text-purple-600">
                Home
              </Link>
              <Link to="#cars" className="text-gray-600 hover:text-purple-600">
                Cars
              </Link>
              <Link to="#about" className="text-gray-600 hover:text-purple-600">
                About
              </Link>
              <Link
                to="#contact"
                className="text-gray-600 hover:text-purple-600"
              >
                Contact
              </Link>
              {user && (
                <Link
                  to="/bookings"
                  className="text-gray-600 hover:text-purple-600"
                >
                  My Bookings
                </Link>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  <span className="text-gray-600">Welcome, {user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-purple-600 hover:text-purple-800"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-24 text-center">
        <h1 className="text-5xl font-bold mb-6">Find Your Perfect Ride</h1>
        <p className="text-xl mb-8">
          Rent the car of your dreams with our easy booking system
        </p>
        {user ? (
          <a
            href="#cars"
            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
          >
            Browse Cars
          </a>
        ) : (
          <div className="relative inline-block">
            <button
              disabled
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold opacity-50 cursor-not-allowed transition duration-300"
              onMouseEnter={() => setHoveredButton("browse")}
              onMouseLeave={() => setHoveredButton(null)}
            >
              Browse Cars
            </button>
            {hoveredButton === "browse" && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded mb-2 whitespace-nowrap z-10">
                Login to browse cars
              </div>
            )}
          </div>
        )}
      </header>

      <section id="cars" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {!showCarList ? (
            <>
              <h2 className="text-3xl font-bold mb-12 text-gray-800">
                Choose Your Car
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white shadow-lg rounded-xl overflow-hidden transform transition duration-300 hover:scale-105">
                  <img
                    src={suvImage}
                    alt="SUV"
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800">SUV</h3>
                    <p className="text-gray-600 mt-2">
                      Spacious, powerful, and perfect for all terrains.
                    </p>
                    {renderButton("suv", "View SUVs")}
                  </div>
                </div>

                <div className="bg-white shadow-lg rounded-xl overflow-hidden transform transition duration-300 hover:scale-105">
                  <img
                    src={hatchback}
                    alt="Hatchback"
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800">
                      Hatchback
                    </h3>
                    <p className="text-gray-600 mt-2">
                      Compact, fuel-efficient, and easy to drive.
                    </p>
                    {renderButton("hatchback", "View Hatchbacks")}
                  </div>
                </div>

                <div className="bg-white shadow-lg rounded-xl overflow-hidden transform transition duration-300 hover:scale-105">
                  <img
                    src={sedan}
                    alt="Sedan"
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800">Sedan</h3>
                    <p className="text-gray-600 mt-2">
                      Elegant, comfortable, and perfect for city rides.
                    </p>
                    {renderButton("sedan", "View Sedans")}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-left">
              <button
                onClick={handleBackToHome}
                className="mb-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                ← Back to Home
              </button>
              <CarList initialType={selectedType} />
            </div>
          )}
        </div>
      </section>

      <section id="about" className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-12 text-gray-800">
            Why Choose Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <i className="fas fa-car text-4xl text-purple-600 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Wide Selection</h3>
              <p className="text-gray-600">
                Choose from our extensive fleet of vehicles
              </p>
            </div>
            <div>
              <i className="fas fa-dollar-sign text-4xl text-purple-600 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
              <p className="text-gray-600">
                Competitive rates and transparent pricing
              </p>
            </div>
            <div>
              <i className="fas fa-headset text-4xl text-purple-600 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Always here to help when you need us
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-12 text-gray-800">Contact Us</h2>
          <div className="max-w-lg mx-auto">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
                required
              />
              <textarea
                rows="4"
                name="message"
                placeholder="Message"
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
                required
              ></textarea>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8 text-center">
        <p>&copy; 2024 CarRental. All rights reserved.</p>
      </footer>
      {user && showLoginNotification && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg shadow-lg z-50 animate-slide-in">
          <p className="text-sm flex items-center">
            <i className="fas fa-user-circle mr-2"></i>
            Logged in as: {user.email}
            <button
              onClick={handleLogout}
              className="ml-2 hover:text-purple-200 text-sm transition-colors"
            >
              (Logout)
            </button>
          </p>
        </div>
      )}
      {showPopup && (
        <div className="fixed bottom-4 left-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          <i className="fas fa-check-circle mr-2"></i>
          Thank you for contacting us! We'll get back to you soon.
        </div>
      )}
    </div>
  );
};

export default LandingPage;