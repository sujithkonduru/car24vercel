// src/hooks/usePushNotifications.js
import { useState, useEffect } from 'react';
import { requestFirebaseToken, onMessageListener } from '../firebase';
import { addFirebaseToken } from '../services/api';

export const usePushNotifications = (userEmail) => {
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Request permission and get token
  const enableNotifications = async () => {
    setLoading(true);
    try {
      const token = await requestFirebaseToken();
      
      if (token && userEmail) {
        setFcmToken(token);
        // Send token to backend
        await addFirebaseToken(token, userEmail);
        setNotificationPermission(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    const listenForMessages = async () => {
      const message = await onMessageListener();
      setNotification(message);
      
      // Show browser notification
      if (message.notification) {
        new Notification(message.notification.title, {
          body: message.notification.body,
          icon: '/favicon.ico',
        });
      }
    };
    
    listenForMessages();
  }, []);

  return {
    notificationPermission,
    fcmToken,
    loading,
    enableNotifications,
    notification,
  };
};