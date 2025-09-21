import { useState, useEffect } from "react";
import BookingForm from "./BookingForm"; // Add this import

const CarList = ({ initialType = "suv" }) => {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedType, setSelectedType] = useState(initialType);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const url = new URL("http://localhost:3001/api/cars");
        url.searchParams.append("type", selectedType);
        if (selectedCity !== "all") {
          url.searchParams.append("city", selectedCity);
        }

        const response = await fetch(url);
        const data = await response.json();
        setCars(data);
      } catch (error) {
        console.error("Error fetching cars:", error);
      }
    };
    fetchCars();
  }, [selectedType, selectedCity]); 

  const showCarDetails = (carId) => {
    const car = cars.find((c) => c.id === carId);
    setSelectedCar(car);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Filters Section */}
      <div className="flex gap-4 mb-8 p-4 bg-gray-100 rounded-lg">
        <select
          className="p-2 border rounded-lg"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        >
          <option value="all">All Cities</option>
          <option value="mumbai">Mumbai</option>
          <option value="delhi">Delhi</option>
          <option value="bengaluru">Bengaluru</option>
          <option value="chennai">Chennai</option>
          <option value="kolkata">Kolkata</option>
        </select>

        <div className="flex gap-2">
          {["suv", "sedan", "hatchback"].map((type) => (
            <button
              key={type}
              className={`px-4 py-2 rounded-lg ${
                selectedType === type
                  ? "bg-purple-600 text-white"
                  : "bg-white border hover:bg-gray-50"
              }`}
              onClick={() => setSelectedType(type)}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Cars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <div
            key={car.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            onClick={() => showCarDetails(car.id)}
          >
            <img
              src={car.image}
              alt={car.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{car.name}</h3>
              <p className="text-blue-600 font-bold mb-2">
                ₹{car.pricePerHour}/hour
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {car.cities.map((city) => (
                  <span
                    key={city}
                    className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {city.replace("_", " ").toUpperCase()}
                  </span>
                ))}
              </div>
              <button className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Car Details Modal */}
      {selectedCar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-2xl font-bold">{selectedCar.name}</h2>
              <button
                onClick={() => setSelectedCar(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <img
                src={selectedCar.image}
                alt={selectedCar.name}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold">Price:</p>
                  <p>₹{selectedCar.pricePerHour}/hour</p>
                </div>
                <div>
                  <p className="font-semibold">Seats:</p>
                  <p>{selectedCar.specs.seats}</p>
                </div>
                <div>
                  <p className="font-semibold">Fuel Type:</p>
                  <p>{selectedCar.specs.fuel}</p>
                </div>
                <div>
                  <p className="font-semibold">Mileage:</p>
                  <p>{selectedCar.specs.mileage}</p>
                </div>
              </div>

              <button
                onClick={() => setShowBooking(true)}
                className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}

{showBooking && (
  <BookingForm
    car={selectedCar}
    availableCities={selectedCar?.cities || []} // Ensure array fallback
    onClose={() => setShowBooking(false)}
  />
)}
    </div>
  );
};

export default CarList;