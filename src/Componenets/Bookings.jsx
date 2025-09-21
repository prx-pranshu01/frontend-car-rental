import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

const Bookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, rejected, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = () => {
    try {
      const storedBookings = JSON.parse(localStorage.getItem('bookings')) || [];
      // Filter bookings for the current user and sort by date (newest first)
      const userBookings = storedBookings
        .filter(booking => booking.userEmail === user.email)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBookings(userBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    }
  };

  const handleCancelBooking = (bookingId) => {
    try {
      const updatedBookings = bookings.map(booking => 
        booking.id === bookingId 
          ? { 
              ...booking, 
              status: 'cancelled', 
              cancelledAt: new Date().toISOString(),
              cancelledBy: user.email,
              cancellationReason: 'Cancelled by user'
            }
          : booking
      );
      
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));
      setBookings(updatedBookings);
      setShowCancelModal(false);
      setSelectedBooking(null);
      alert('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
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
        return 'bg-gray-100 text-gray-800';
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

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-purple-600 hover:text-purple-800"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Booking History</h2>
            
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
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between">
                    <h3 className="font-semibold">{booking.carName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Booking Date:</span> {formatDate(booking.createdAt)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Pickup:</span> {formatDate(booking.startTime)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Return:</span> {formatDate(booking.endTime)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Location:</span> {booking.city}, {booking.location}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Total Amount:</span> ₹{booking.totalPrice}
                    </p>
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-600">
                        Your booking is pending approval. We'll notify you once it's confirmed.
                      </p>
                    </div>
                  )}
                  
                  {booking.status === 'confirmed' && (
                    <div className="mt-3 space-y-2">
                      <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-600">
                          Your booking has been confirmed! Please arrive at the pickup location 15 minutes before your scheduled time.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowCancelModal(true);
                        }}
                        className="w-full mt-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                  
                  {booking.status === 'cancelled' && (
                    <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-600">
                        This booking was cancelled on {formatDate(booking.cancelledAt)}
                      </p>
                    </div>
                  )}
                  
                  {booking.status === 'rejected' && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600">
                        Your booking has been rejected. Please contact support for more information.
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cancel Booking Modal */}
        {showCancelModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h2 className="text-xl font-bold">Cancel Booking</h2>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to cancel this booking for {selectedBooking.carName}?
                </p>
                <p className="text-sm text-gray-500">
                  Pickup: {formatDate(selectedBooking.startTime)}
                  <br />
                  Return: {formatDate(selectedBooking.endTime)}
                </p>
                <p className="text-sm text-amber-600">
                  Note: Cancellation may be subject to terms and conditions. Please check our cancellation policy.
                </p>
                
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings; 