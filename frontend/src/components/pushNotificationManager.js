// components/PushNotificationManager.js
import React, { useState, useEffect } from 'react';
import { requestPermissionAndGetToken, onMessageListener, unregisterPushToken } from '../services/pushNotification';
import { toast } from 'react-toastify';

const PushNotificationManager = () => {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check if token is already stored
    const storedToken = localStorage.getItem('pushToken');
    if (storedToken) {
      setToken(storedToken);
    }

    // Listen for incoming messages
    const unsubscribe = onMessageListener()
      .then((payload) => {
        toast.info(`${payload.notification.title}: ${payload.notification.body}`);
      })
      .catch((err) => console.error('Failed to subscribe to messages:', err));

    return () => {
      unsubscribe.catch((err) => console.error('Failed to unsubscribe from messages:', err));
    };
  }, []);

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const newToken = await requestPermissionAndGetToken();
      setToken(newToken);
      localStorage.setItem('pushToken', newToken);
      toast.success('Push notifications enabled successfully!');
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast.error('Failed to enable push notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    if (!token) return;

    setLoading(true);
    try {
      await unregisterPushToken(token);
      setToken(null);
      localStorage.removeItem('pushToken');
      toast.success('Push notifications disabled successfully!');
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      toast.error('Failed to disable push notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="push-notification-manager">
      <h3>Push Notifications</h3>
      {token ? (
        <div>
          <p>Push notifications are enabled.</p>
          <button
            onClick={handleDisableNotifications}
            disabled={loading}
            className="btn btn-danger"
          >
            {loading ? 'Disabling...' : 'Disable Notifications'}
          </button>
        </div>
      ) : (
        <div>
          <p>Push notifications are disabled.</p>
          <button
            onClick={handleEnableNotifications}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Enabling...' : 'Enable Notifications'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PushNotificationManager;