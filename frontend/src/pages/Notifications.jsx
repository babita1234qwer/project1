// pages/Notifications.jsx
import { useState, useEffect } from 'react';
import axiosClient from "../utils/axiosclient";
import { Card, CardBody, CardHeader, Button } from '@heroui/react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    try {
      const response = await axiosClient.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const markAsRead = async (notificationId) => {
    try {
      await axiosClient.patch(`/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await axiosClient.patch('/notifications/read-all');
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button color="primary" onClick={markAllAsRead}>
          Mark All as Read
        </Button>
      </div>
      
      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification._id} 
              className={!notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{notification.title}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
              </CardHeader>
              <CardBody>
                <p>{notification.message}</p>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-2">
                    {!notification.read && (
                      <Button 
                        color="primary" 
                        size="sm" 
                        onClick={() => markAsRead(notification._id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </div>
                  {notification.emergencyId && (
                    <a 
                      href={`/emergency/${notification.emergencyId}`} 
                      className="text-cyan-600 hover:text-cyan-800 font-semibold text-sm flex items-center gap-1 group"
                    >
                      View Details
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}