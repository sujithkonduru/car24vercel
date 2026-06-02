// src/components/PushNotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const PushNotificationSettings = ({ userEmail, isLoggedIn }) => {
  const [permission, setPermission] = useState(Notification.permission);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Check if push notifications are already enabled
    const savedPreference = localStorage.getItem('pushNotificationsEnabled');
    if (savedPreference === 'true' && permission === 'granted') {
      setIsEnabled(true);
    }
  }, [permission]);

  const handleEnableNotifications = async () => {
    if (!isLoggedIn) {
      setMessage({
        type: 'error',
        text: 'Please login to enable notifications',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Import the function dynamically
      const { requestFirebaseToken } = await import('../firebase');
      const { addFirebaseToken } = await import('../services/api');
      
      const token = await requestFirebaseToken();
      
      if (token) {
        await addFirebaseToken(token, userEmail);
        setIsEnabled(true);
        localStorage.setItem('pushNotificationsEnabled', 'true');
        setMessage({
          type: 'success',
          text: 'Push notifications enabled successfully!',
        });
        
        // Show a test notification
        setTimeout(() => {
          new Notification('Car24 Notifications Enabled', {
            body: 'You will now receive updates about your bookings and offers!',
            icon: '/car24-logo.png',
          });
        }, 1000);
      } else {
        setMessage({
          type: 'error',
          text: 'Could not get notification token. Please check your permissions.',
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to enable notifications',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = () => {
    setIsEnabled(false);
    localStorage.setItem('pushNotificationsEnabled', 'false');
    setMessage({
      type: 'info',
      text: 'Push notifications disabled',
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
        <BellOff className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Login to enable push notifications
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <Bell className="h-6 w-6 text-green-600" />
          ) : (
            <BellOff className="h-6 w-6 text-gray-400" />
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Push Notifications
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get real-time updates about bookings, offers, and reminders
            </p>
          </div>
        </div>
        
        <div>
          {isEnabled ? (
            <button
              onClick={handleDisableNotifications}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
            >
              Disable
            </button>
          ) : (
            <button
              onClick={handleEnableNotifications}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                'Enable Notifications'
              )}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-lg p-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
              : message.type === 'error'
              ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
              : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : message.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : null}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {isEnabled && (
        <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <p>✓ You will receive notifications for:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Booking confirmations and updates</li>
            <li>Car availability alerts</li>
            <li>Special offers and discounts</li>
            <li>Payment reminders and receipts</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PushNotificationSettings;