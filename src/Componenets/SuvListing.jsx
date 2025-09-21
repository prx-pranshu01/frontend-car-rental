import React from "react";
import { Link } from "react-router-dom";

const SUVs = [
  {
    id: 1,
    name: "Toyota Highlander",
    image: "https://stimg.cardekho.com/images/carexteriorimages/930x620/Toyota/Highlander/123.jpg",
    description: "A reliable and spacious SUV with top safety features."
  },
  {
    id: 2,
    name: "Ford Explorer",
    image: "https://stimg.cardekho.com/images/carexteriorimages/930x620/Ford/Explorer/456.jpg",
    description: "A powerful and versatile SUV for all terrains."
  },
  {
    id: 3,
    name: "Honda CR-V",
    image: "https://stimg.cardekho.com/images/carexteriorimages/930x620/Honda/CR-V/789.jpg",
    description: "A fuel-efficient and comfortable compact SUV."
  }
];

const SuvListing = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <nav className="bg-white shadow-lg p-4">
        <div className="max-w-7xl mx-auto flex justify-between">
          <Link to="/" className="text-2xl font-bold text-purple-600 flex items-center">
            <i className="fas fa-car-side text-purple-600 mr-2"></i>
            CarRental
          </Link>
          <div className="flex space-x-4">
            <Link to="/" className="text-gray-600 hover:text-purple-600">Home</Link>
            <Link to="/suvs" className="text-gray-600 hover:text-purple-600">View SUVs</Link>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Available SUVs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SUVs.map((suv) => (
            <div key={suv.id} className="bg-white shadow-lg rounded-xl overflow-hidden transform transition duration-300 hover:scale-105">
              <img src={suv.image} alt={suv.name} className="w-full h-56 object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800">{suv.name}</h3>
                <p className="text-gray-600 mt-2">{suv.description}</p>
                <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Book Now</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuvListing;
