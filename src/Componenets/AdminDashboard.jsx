// AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_83t3cbg';
const EMAILJS_TEMPLATE_ID = 'template_9i71ugc'; // Your template ID for booking approval emails
const EMAILJS_USER_ID = 'k3W_a-z1d-fjwe1O2';

// Initialize EmailJS
emailjs.init(EMAILJS_USER_ID);

// Fix the Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, rejected
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState({
    bookingId: null,
    otp: '',
    isVerifying: false,
    error: '',
    success: ''
  });
  const [isEmailSending, setIsEmailSending] = useState(false);

  // Sample GPS data (replace with real API calls)
  const sampleCars = [
    {id: 1, lat: 19.0760, lng: 72.8777, name: 'Toyota Highlander'},
    {id: 2, lat: 28.7041, lng: 77.1025, name: 'Ford Explorer'},
    {id: 3, lat: 12.9716, lng: 77.5946, name: 'Honda CR-V'},
  ];

  useEffect(() => {
    // Fetch bookings and cars from API/localStorage
    setCars(sampleCars);
    loadBookings();

    // Add event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'bookings') {
        loadBookings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadBookings = () => {
    try {
      const storedBookings = JSON.parse(localStorage.getItem('bookings')) || [];
      console.log('Loaded bookings:', storedBookings); // Debug log
      setBookings(storedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const updatedBookings = bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus, updatedAt: new Date().toISOString() } : booking
      );
      
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));
      setBookings(updatedBookings);
      
      // If booking is approved, send confirmation email
      if (newStatus === 'confirmed') {
        const approvedBooking = updatedBookings.find(b => b.id === bookingId);
        if (approvedBooking && approvedBooking.userEmail) {
          try {
            const emailParams = {
              to_email: approvedBooking.userEmail.trim(),
              user_email: approvedBooking.userEmail.trim(),
              email: approvedBooking.userEmail.trim(),
              user_name: approvedBooking.userName,
              car_name: approvedBooking.carName,
              pickup_location: `${approvedBooking.location}, ${approvedBooking.city}`,
              pickup_time: new Date(approvedBooking.startTime).toLocaleString(),
              return_time: new Date(approvedBooking.endTime).toLocaleString(),
              total_price: approvedBooking.totalPrice,
              booking_id: approvedBooking.id,
              guidelines: `
1. Please arrive at the pickup location 15 minutes before your scheduled time.
2. Bring the following documents:
   - Original Government ID (${approvedBooking.govtIdType})
   - Valid Driving License
   - Credit Card for security deposit
3. The car will be inspected before and after your rental period.
4. Please ensure the car is returned with the same fuel level as at pickup.
5. Any damages or violations will be charged to your account.
6. For any emergencies, call our 24/7 support: +91-XXXXXXXXXX
              `.trim()
            };

            console.log('Sending approval email with params:', emailParams);

            const response = await emailjs.send(
              EMAILJS_SERVICE_ID,
              EMAILJS_TEMPLATE_ID,
              emailParams,
              EMAILJS_USER_ID
            );

            if (response.status === 200) {
              console.log('Approval confirmation email sent successfully');
            } else {
              console.error('EmailJS Response:', response);
            }
          } catch (emailError) {
            console.error('Failed to send approval confirmation email:', emailError);
            // Don't show error to user as the booking is already approved
          }
        } else {
          console.error('No valid email address found for the booking');
        }
      }
      
      // Close the details modal
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status. Please try again.');
    }
  };

  const getFilteredBookings = () => {
    if (filter === 'all') return bookings;
    return bookings.filter(booking => booking.status === filter);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sendOtpEmail = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    setIsEmailSending(true);
    
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real application, you would send this OTP via email to the customer
    // For demo purposes, we'll simulate the email sending with a timeout
    setTimeout(() => {
      // Store the OTP with the booking (in a real app, store this securely)
      const updatedBookings = bookings.map(b => 
        b.id === bookingId ? { ...b, otp } : b
      );
      
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));
      setBookings(updatedBookings);
      
      setIsEmailSending(false);
      
      // Show a success notification (in a real app, this would be after API call success)
      alert(`OTP sent to ${booking.email} successfully!`);
    }, 1500);
  };

  const openOtpVerification = (bookingId) => {
    setOtpData({
      bookingId,
      otp: '',
      isVerifying: false,
      error: '',
      success: ''
    });
    setShowOtpModal(true);
  };

  const verifyOtp = () => {
    setOtpData(prev => ({ ...prev, isVerifying: true, error: '', success: '' }));
    
    const booking = bookings.find(b => b.id === otpData.bookingId);
    if (!booking) {
      setOtpData(prev => ({ 
        ...prev, 
        isVerifying: false, 
        error: 'Booking not found' 
      }));
      return;
    }
    
    // Simulate verification delay
    setTimeout(() => {
      if (booking.otp === otpData.otp) {
        // OTP is correct
        setOtpData(prev => ({ 
          ...prev, 
          isVerifying: false, 
          success: 'OTP verified successfully!' 
        }));
        
        // Update booking status
        const updatedBookings = bookings.map(b => 
          b.id === otpData.bookingId ? { ...b, otpVerified: true } : b
        );
        
        localStorage.setItem('bookings', JSON.stringify(updatedBookings));
        setBookings(updatedBookings);
        
        // Close the modal after a delay
        setTimeout(() => {
          setShowOtpModal(false);
          // Refresh the selected booking if it's currently open
          if (selectedBooking && selectedBooking.id === otpData.bookingId) {
            setSelectedBooking(updatedBookings.find(b => b.id === otpData.bookingId));
          }
        }, 1500);
      } else {
        // OTP is incorrect
        setOtpData(prev => ({ 
          ...prev, 
          isVerifying: false, 
          error: 'Invalid OTP. Please try again.' 
        }));
      }
    }, 1500);
  };

  const downloadGovtId = (booking) => {
    // In a real application, you would implement a proper download mechanism
    // For this demo, we'll open the image in a new tab
    if (booking.govtIdImage && booking.govtIdImage.startsWith('data:')) {
      const newWindow = window.open();
      newWindow.document.write(`
        <html>
          <head>
            <title>Government ID - ${booking.name}</title>
          </head>
          <body style="margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5;">
            <img src="${booking.govtIdImage}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </body>
        </html>
      `);
    } else {
      alert('No valid government ID image found');
    }
  };

  const handleDeleteBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      try {
        const updatedBookings = bookings.filter(booking => booking.id !== bookingId);
        localStorage.setItem('bookings', JSON.stringify(updatedBookings));
        setBookings(updatedBookings);
        setSelectedBooking(null);
        alert('Booking deleted successfully');
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Failed to delete booking. Please try again.');
      }
    }
  };

  const handleVerifyGovtId = (bookingId) => {
    try {
      const updatedBookings = bookings.map(booking => 
        booking.id === bookingId ? { ...booking, govtIdVerified: true } : booking
      );
      
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));
      setBookings(updatedBookings);
      
      // Update the selected booking if it's currently open
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({...selectedBooking, govtIdVerified: true});
      }
      
      alert('Government ID verified successfully');
    } catch (error) {
      console.error('Error verifying government ID:', error);
      alert('Failed to verify government ID. Please try again.');
    }
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Bookings</h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg ${
                filter === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg ${
                filter === 'pending' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-3 py-1 rounded-lg ${
                filter === 'confirmed' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-3 py-1 rounded-lg ${
                filter === 'cancelled' 
                  ? 'bg-gray-500 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getFilteredBookings().length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500">
              No bookings found with the selected filter
            </div>
          ) : (
            getFilteredBookings().map(booking => (
              <div 
                key={booking.id} 
                className="bg-white p-4 rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex justify-between">
                  <h3 className="font-semibold">{booking.carName}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{booking.userName} • {booking.userPhone}</p>
                <p className="text-sm text-gray-600">{booking.userEmail}</p>
                <p className="text-sm text-gray-600">
                  {new Date(booking.startTime).toLocaleString()} - {new Date(booking.endTime).toLocaleString().split(',')[1]}
                </p>
                <p className="text-sm">{booking.city} • {booking.location}</p>
                <p className="font-semibold mt-2">₹{booking.totalPrice}</p>
                {booking.otpVerified && (
                  <div className="mt-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block">
                    OTP Verified
                  </div>
                )}
                {booking.govtIdVerified && (
                  <div className="mt-1 ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block">
                    ID Verified
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Vehicle Tracker</h2>
        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{height: '100%'}}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {cars.map(car => (
              <Marker key={car.id} position={[car.lat, car.lng]}>
                <Popup>{car.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold">Booking Details</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteBooking(selectedBooking.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Car</p>
                  <p className="font-semibold">{selectedBooking.carName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-semibold ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusText(selectedBooking.status)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p>{selectedBooking.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{selectedBooking.userPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{selectedBooking.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Booking Date</p>
                  <p>{new Date(selectedBooking.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pickup Location</p>
                  <p>{selectedBooking.city}, {selectedBooking.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rental Period</p>
                  <p>{new Date(selectedBooking.startTime).toLocaleString()} - {new Date(selectedBooking.endTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Government ID Type</p>
                  <p>{selectedBooking.govtIdType ? (
                    selectedBooking.govtIdType === 'aadhar' ? 'Aadhaar Card' :
                    selectedBooking.govtIdType === 'dl' ? 'Driving License' :
                    selectedBooking.govtIdType === 'passport' ? 'Passport' :
                    selectedBooking.govtIdType === 'voter' ? 'Voter ID' : 
                    'PAN Card'
                  ) : 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Number</p>
                  <p>{selectedBooking.govtIdNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p>{selectedBooking.address}</p>
                </div>
              </div>

              {selectedBooking.status === 'cancelled' && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Cancellation Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Cancelled By</p>
                      <p className="font-medium">{selectedBooking.cancelledBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cancellation Date</p>
                      <p className="font-medium">{formatDate(selectedBooking.cancelledAt)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Reason</p>
                      <p className="font-medium">{selectedBooking.cancellationReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Status */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">Verification Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`flex items-center rounded-lg p-3 ${
                    selectedBooking.otpVerified ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      selectedBooking.otpVerified ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      <i className={`fas ${selectedBooking.otpVerified ? 'fa-check' : 'fa-clock'}`}></i>
                    </div>
                    <div>
                      <p className="font-medium">{selectedBooking.otpVerified ? 'OTP Verified' : 'OTP Pending'}</p>
                      <p className="text-xs text-gray-600">Email verification</p>
                    </div>
                  </div>
                  <div className={`flex items-center rounded-lg p-3 ${
                    selectedBooking.govtIdVerified ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      selectedBooking.govtIdVerified ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      <i className={`fas ${selectedBooking.govtIdVerified ? 'fa-check' : 'fa-id-card'}`}></i>
                    </div>
                    <div>
                      <p className="font-medium">{selectedBooking.govtIdVerified ? 'ID Verified' : 'ID Verification Pending'}</p>
                      <p className="text-xs text-gray-600">Government ID check</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ID Preview Section */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">Government ID Verification</h3>
                  {!selectedBooking.govtIdVerified && (
                    <button
                      onClick={() => handleVerifyGovtId(selectedBooking.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Verify ID
                    </button>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">ID Type</p>
                      <p className="font-medium">{selectedBooking.govtIdType ? (
                        selectedBooking.govtIdType === 'aadhar' ? 'Aadhaar Card' :
                        selectedBooking.govtIdType === 'dl' ? 'Driving License' :
                        selectedBooking.govtIdType === 'passport' ? 'Passport' :
                        selectedBooking.govtIdType === 'voter' ? 'Voter ID' : 
                        'PAN Card'
                      ) : 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ID Number</p>
                      <p className="font-medium">{selectedBooking.govtIdNumber}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">ID Document</p>
                    {selectedBooking.govtIdImage ? (
                      <div className="relative">
                        <img 
                          src={selectedBooking.govtIdImage} 
                          alt="Government ID" 
                          className="max-h-60 w-full object-contain border rounded-lg"
                        />
                        <button
                          onClick={() => downloadGovtId(selectedBooking)}
                          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow hover:bg-gray-100"
                        >
                          <i className="fas fa-download text-gray-600"></i>
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No ID document uploaded</p>
                    )}
                  </div>

                  {selectedBooking.govtIdVerified && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-green-600">
                        <i className="fas fa-check-circle mr-2"></i>
                        <span>Government ID Verified</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <p className="text-xl font-bold text-purple-600 mb-4">
                  Total Amount: ₹{selectedBooking.totalPrice}
                </p>
                
                {selectedBooking.status === 'pending' && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, 'confirmed')}
                      disabled={!selectedBooking.otpVerified || !selectedBooking.govtIdVerified}
                      className={`flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${
                        (!selectedBooking.otpVerified || !selectedBooking.govtIdVerified) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Approve Booking
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, 'rejected')}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject Booking
                    </button>
                  </div>
                )}
                
                {(!selectedBooking.otpVerified || !selectedBooking.govtIdVerified) && selectedBooking.status === 'pending' && (
                  <p className="text-xs text-amber-600 mt-2 text-center">
                    Both OTP and Government ID verification are required before approving
                  </p>
                )}
                
                {selectedBooking.status === 'confirmed' && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                    <p className="text-green-700">This booking has been approved and confirmed.</p>
                    <p className="text-sm text-green-600 mt-1">Customer has been notified via email.</p>
                  </div>
                )}
                
                {selectedBooking.status === 'rejected' && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                    <p className="text-red-700">This booking has been rejected.</p>
                    <p className="text-sm text-red-600 mt-1">Customer has been notified via email.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1001]">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold">OTP Verification</h2>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Enter the OTP sent to the customer's email address to verify their booking.
              </p>
              
              <input
                type="text"
                value={otpData.otp}
                onChange={(e) => setOtpData({...otpData, otp: e.target.value})}
                placeholder="Enter OTP"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
                maxLength={6}
              />
              
              {otpData.error && (
                <p className="text-red-500 text-sm">{otpData.error}</p>
              )}
              
              {otpData.success && (
                <p className="text-green-500 text-sm">{otpData.success}</p>
              )}
              
              <button
                onClick={verifyOtp}
                disabled={otpData.otp.length < 6 || otpData.isVerifying}
                className={`w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 ${
                  otpData.otp.length < 6 || otpData.isVerifying ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {otpData.isVerifying ? (
                  <span className="flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i> Verifying...
                  </span>
                ) : 'Verify OTP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;