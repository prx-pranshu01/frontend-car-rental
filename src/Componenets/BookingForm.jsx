// src/components/BookingForm.jsx
import { useState, useEffect, useRef } from 'react';
import locations from '../data/locations.json';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_83t3cbg';
const EMAILJS_TEMPLATE_ID = 'template_h62oruo';
const EMAILJS_USER_ID = 'k3W_a-z1d-fjwe1O2';

emailjs.init(EMAILJS_USER_ID);

export default function BookingForm({ car, availableCities, onClose }) {
  const { user } = useAuth(); // Get logged-in user details
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '', // Pre-fill with user's email
    phone: '',
    otp: '',
    govtId: '',
    govtIdType: 'aadhar',
    address: '',
    city: '',
    location: '',
    startTime: '',
    endTime: ''
  });
  
  const [availableLocations, setAvailableLocations] = useState([]);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [idPreview, setIdPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);

  BookingForm.propTypes = {
    car: PropTypes.object.isRequired,
    availableCities: PropTypes.arrayOf(PropTypes.string),
    onClose: PropTypes.func.isRequired
  };

  // Format city name for display
  const formatCityName = (city) => {
    if (!city) return '';
    return city
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  useEffect(() => {
    if (formData.city) {
      setAvailableLocations(locations[formData.city] || []);
      setFormData(prev => ({ ...prev, location: '' }));
    }
  }, [formData.city]);

  useEffect(() => {
    calculatePrice();
  }, [formData.startTime, formData.endTime]);

  useEffect(() => {
    let interval;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const calculatePrice = () => {
    if (formData.startTime && formData.endTime) {
      const hours = Math.ceil(
        (new Date(formData.endTime) - new Date(formData.startTime)) / (1000 * 60 * 60)
      );
      setTotalPrice(hours * car.pricePerHour);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.email) {
      alert('Please enter your email address');
      return;
    }

    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 15);

      const templateParams = {
        to_email: formData.email.trim(),
        user_email: formData.email.trim(), // Adding user_email as an alternative
        email: formData.email.trim(), // Adding email as another alternative
        message: `Your OTP is ${otp}. It will expire at ${expiryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        otp: otp,
        passcode: otp,
        time: expiryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        from_name: 'CarRental',
        reply_to: formData.email.trim()
      };

      console.log('Sending OTP with params:', templateParams);

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_USER_ID
      );

      if (response.status === 200) {
        setOtpSent(true);
        setTimer(300);
        setCanResend(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        sessionStorage.setItem('current_otp', otp);
        sessionStorage.setItem('otp_email', formData.email.trim());
      } else {
        console.error('EmailJS Response:', response);
        alert('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('EmailJS Error:', error);
      if (error.text) {
        alert(`Error: ${error.text}`);
      } else {
        alert('An error occurred while sending OTP');
      }
    }
  };

  const verifyOTP = () => {
    const storedOtp = sessionStorage.getItem('current_otp');
    const storedEmail = sessionStorage.getItem('otp_email');

    if (!storedOtp || storedEmail !== formData.email) {
      alert('OTP expired or invalid. Please request a new OTP.');
      return;
    }

    if (formData.otp === storedOtp) {
      setVerified(true);
      sessionStorage.removeItem('current_otp');
      sessionStorage.removeItem('otp_email');
      alert('OTP verified successfully!');
    } else {
      alert('Invalid OTP. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleIdUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid ID document (JPG, PNG, or PDF)');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    setIsUploading(true);
    
    // Create a preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setIdPreview(reader.result);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDF, just show the filename
      setIdPreview(`File selected: ${file.name}`);
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!verified) {
      alert('Please verify your email with OTP first');
      return;
    }
    
    if (!idPreview) {
      alert('Please upload your government ID');
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      alert('Please select booking start and end times');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const booking = {
        id: `booking-${Date.now()}`,
        userId: user?.id || 'guest',
        userName: formData.name,
        userEmail: formData.email,
        userPhone: formData.phone,
        carId: car.id,
        carName: car.name,
        carImage: car.image,
        carType: car.type,
        startTime: formData.startTime,
        endTime: formData.endTime,
        totalPrice,
        status: 'pending',
        govtIdType: formData.govtIdType,
        govtIdNumber: formData.govtId,
        govtIdImage: idPreview,
        address: formData.address,
        city: formData.city,
        location: formData.location,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        otpVerified: true,
        govtIdVerified: false
      };

      // Get existing bookings from localStorage
      const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      
      // Add new booking
      const updatedBookings = [...existingBookings, booking];
      
      // Save to localStorage
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));
      console.log('Saved booking:', booking); // Debug log

      // Send confirmation email
      try {
        const emailParams = {
          to_email: formData.email,
          user_name: formData.name,
          car_name: car.name,
          start_time: new Date(formData.startTime).toLocaleString(),
          end_time: new Date(formData.endTime).toLocaleString(),
          total_price: totalPrice,
          booking_id: booking.id
        };

        await emailjs.send(
          EMAILJS_SERVICE_ID,
          'template_booking_confirmation',
          emailParams,
          EMAILJS_USER_ID
        );
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      setIsSubmitting(false);
      showBookingConfirmation();
      onClose();
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('An error occurred while submitting your booking. Please try again.');
      setIsSubmitting(false);
    }
  };

  const showBookingConfirmation = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]';
    modal.innerHTML = `
      <div class="bg-white rounded-xl max-w-md w-full p-6 space-y-4 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900">Booking Request Submitted!</h3>
        <p class="text-gray-600">Your booking request has been successfully submitted for approval. You will receive an email confirmation shortly.</p>
        <button class="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add click event to close button
    modal.querySelector('button').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Also close when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };

  // Update the location options rendering
  const renderLocationOptions = () => {
    if (!availableLocations || !Array.isArray(availableLocations)) {
      return <option value="">No locations available</option>;
    }

    return availableLocations.map((location, index) => {
      const locationValue = typeof location === 'object' ? location.name : location;
      const locationName = typeof location === 'object' ? location.name : location;
      
      return (
        <option key={`${locationValue}-${index}`} value={locationValue}>
          {locationName}
        </option>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-purple-800">Book {car.name}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {showSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">OTP sent successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information Section */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      required
                      disabled={!verified}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 pr-24"
                        required
                        disabled={verified}
                      />
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={!canResend && otpSent}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm rounded ${
                          !canResend && otpSent
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {otpSent ? (canResend ? 'Resend OTP' : `Resend in ${formatTime(timer)}`) : 'Send OTP'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      placeholder="10-digit number"
                      required
                      disabled={!verified}
                    />
                  </div>
                </div>
              </div>

              {/* OTP Verification Section */}
              {otpSent && !verified && (
                <div className="md:col-span-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Enter OTP"
                      required
                    />
                    <button
                      type="button"
                      onClick={verifyOTP}
                      className="mt-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              {/* Government ID Section */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">Government ID Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Type</label>
                    <select
                      value={formData.govtIdType}
                      onChange={(e) => setFormData({ ...formData, govtIdType: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      disabled={!verified}
                      required
                    >
                      <option value="aadhar">Aadhaar Card</option>
                      <option value="dl">Driving License</option>
                      <option value="passport">Passport</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Number</label>
                    <input
                      type="text"
                      value={formData.govtId}
                      onChange={(e) => setFormData({ ...formData, govtId: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      required
                      disabled={!verified}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Upload ID Document</label>
                    <div className="mt-1 flex items-center gap-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleIdUpload}
                        className="hidden"
                        accept="image/*,.pdf"
                        disabled={!verified}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`px-4 py-2 rounded-lg ${
                          verified
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!verified}
                      >
                        Choose File
                      </button>
                      {idPreview && (
                        <span className="text-sm text-gray-600">
                          {typeof idPreview === 'string' ? idPreview : 'File selected'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      disabled={!verified}
                      required
                    >
                      <option value="">Select City</option>
                      {availableCities?.map((city, index) => (
                        <option key={`${city}-${index}`} value={city}>
                          {formatCityName(city)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      disabled={!verified || !formData.city}
                      required
                    >
                      <option value="">Select Location</option>
                      {renderLocationOptions()}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Full Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      rows={3}
                      required
                      disabled={!verified}
                    />
                  </div>
                </div>
              </div>

              {/* Booking Details Section */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">Booking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      required
                      disabled={!verified}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      required
                      disabled={!verified}
                    />
                  </div>

                  <div className="md:col-span-2 text-center">
                    <div className="text-xl font-bold text-purple-800">
                      Total Price: ₹{totalPrice}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!verified || isSubmitting}
                className={`px-6 py-2 rounded-lg text-white ${
                  verified && !isSubmitting
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}