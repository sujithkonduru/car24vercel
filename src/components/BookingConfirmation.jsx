// src/components/BookingConfirmation.jsx
const sendBookingNotification = async (bookingDetails, userEmail) => {
  try {
    await fetch(`${API_BASE_URL}/api/sendPushNotification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        email: userEmail,
        title: 'Booking Confirmed!',
        body: `Your booking for ${bookingDetails.carName} is confirmed. Pickup at ${bookingDetails.pickupTime}`,
        data: {
          bookingId: bookingDetails.bookingId,
          type: 'booking_confirmation',
        },
      }),
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};