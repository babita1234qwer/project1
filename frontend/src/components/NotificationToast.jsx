// components/NotificationToast.jsx
import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onMessageListener } from '../firebase';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/notificationslice';
import { NotificationService } from '../services/notificationService'; // Use named import

const NotificationToast = () => {
  const dispatch = useDispatch();
  const [notification, setNotification] = useState({ title: '', body: '' });

  useEffect(() => {
    const unsubscribe = onMessageListener()
      .then((payload) => {
        // Extract notification data
        const { notification, data } = payload;
        const title = notification?.title || data?.title || 'New Notification';
        const body = notification?.body || data?.message || 'You have a new notification';
        
        // Update state
        setNotification({ title, body });
        
        // Show toast notification
        toast.info(`${title}: ${body}`, {
          onClick: () => {
            // Handle click on toast (e.g., navigate to related emergency)
            if (data?.emergencyId) {
              // Navigate to emergency detail page
              // Example: window.location.href = `/emergency/${data.emergencyId}`;
            }
          }
        });
        
        // Add to Redux store
        dispatch(addNotification({
          id: data?._id || Date.now().toString(),
          title: data?.title || title,
          message: data?.message || body,
          type: data?.type || 'notification',
          emergencyId: data?.emergencyId,
          status: 'unread',
          createdAt: data?.createdAt || new Date().toISOString(),
          read: false
        }));
        
        // Show browser notification if permission is granted
        if (NotificationService.isSupported() && Notification.permission === 'granted') {
          NotificationService.showNotification(title, {
            body,
            icon: '/firebase-logo.png',
            data
          });
        }
      })
      .catch((err) => console.log('Failed to receive foreground message:', err));
      
    return () => {
      // Clean up listener if needed
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [dispatch]);

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
    />
  );
};

export default NotificationToast;