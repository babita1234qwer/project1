import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from "../utils/axiosclient";
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader, 
  Chip, 
  Badge 
} from '@heroui/react';

const NotificationIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const API_URL = import.meta.env.VITE_API_URL;

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [showReadNotifications, setShowReadNotifications] = useState(true);
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    try {
      const response = await axiosClient.get('/notifications/get');
      // Ensure we always set an array
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]); // Set empty array on error
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
      await axiosClient.patch(`/notifications/read-all`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const getNotificationIcon = (type) => {
    // Return appropriate icon based on notification type
    // This is a placeholder - implement based on your notification types
    return <NotificationIcon className="w-4 h-4" />;
  };
  
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };
  
  const getFilteredNotifications = () => {
    // Ensure notifications is always an array
    if (!Array.isArray(notifications)) return [];
    
    let filtered = notifications;
    
    if (notificationFilter === 'unread') {
      filtered = notifications.filter(n => !n.read);
    } else if (notificationFilter === 'read') {
      filtered = notifications.filter(n => n.read);
    }
    
    return filtered;
  };
  
  // Fixed: Count unread notifications (not read)
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-purple-100">Notifications</h1>
            {unreadCount > 0 && (
              <Badge 
                color="danger" 
                content={unreadCount > 99 ? "99+" : unreadCount}
                className="w-6 h-6 animate-pulse"
                shape="circle"
              />
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex bg-purple-800/30 rounded-lg p-1">
              <Button
                size="sm"
                variant={notificationFilter === 'all' ? 'solid' : 'light'}
                color={notificationFilter === 'all' ? 'primary' : 'default'}
                onClick={() => setNotificationFilter('all')}
                className="px-3"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={notificationFilter === 'unread' ? 'solid' : 'light'}
                color={notificationFilter === 'unread' ? 'primary' : 'default'}
                onClick={() => setNotificationFilter('unread')}
                className="px-3"
              >
                Unread
              </Button>
              <Button
                size="sm"
                variant={notificationFilter === 'read' ? 'solid' : 'light'}
                color={notificationFilter === 'read' ? 'primary' : 'default'}
                onClick={() => setNotificationFilter('read')}
                className="px-3"
              >
                Read
              </Button>
              <Button
                size="sm"
                variant="light"
                color="gray"
                onClick={() => setShowReadNotifications(!showReadNotifications)}
                className="px-3"
              >
                {showReadNotifications ? 'Hide Read' : 'Show Read'}
              </Button>
            </div>
            {unreadCount > 0 && (
              <Button color="primary" onClick={markAllAsRead} className="bg-purple-600 hover:bg-purple-700">
                Mark All as Read ✓
              </Button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12 bg-purple-800/20 rounded-lg">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400"></div>
            <p className="mt-4 text-purple-300">Loading notifications...</p>
          </div>
        ) : getFilteredNotifications().length === 0 ? (
          <div className="text-center py-12 bg-purple-800/20 rounded-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-700/30 rounded-full mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="text-xl font-medium text-purple-100 mb-1">No notifications</h3>
            <p className="text-purple-300">
              {notificationFilter !== 'all' 
                ? `No ${notificationFilter} notifications to display` 
                : "You're all caught up! Check back later for new notifications."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {getFilteredNotifications().map((notification) => (
              <Card 
                key={notification._id} 
                className={`transition-all duration-200 hover:shadow-md rounded-lg border ${
                  !notification.read 
                    ? 'bg-gradient-to-r from-purple-700/30 to-indigo-700/30 border-l-4 border-purple-400' 
                    : 'bg-purple-800/20 border-l-4 border-purple-600/50'
                }`}
              >
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-1 p-2 rounded-full ${
                      !notification.read ? 'bg-purple-600/30' : 'bg-purple-800/30'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-semibold text-sm ${!notification.read ? 'text-purple-100' : 'text-purple-200'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-2">
                          {!notification.read && (
                            <Chip size="sm" color="primary" variant="dot">
                              New
                            </Chip>
                          )}
                          {notification.read && (
                            <Chip size="sm" color="gray" variant="flat">
                              Read
                            </Chip>
                          )}
                          <span className="text-sm text-purple-300 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className={`text-xs mt-1 ${!notification.read ? 'text-purple-200' : 'text-purple-300'}`}>
                        {notification.message}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        {!notification.read && (
                          <Button 
                            color="primary" 
                            size="sm" 
                            variant="flat"
                            endContent={<CheckIcon className="w-3 h-3" />}
                            className="mt-2 bg-purple-600/30 text-purple-200 hover:bg-purple-600/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                          >
                            Mark as Read
                          </Button>
                        )}
                        {notification.emergencyId && (
                          <a 
                            href={`/emergency/${notification.emergencyId}`} 
                            className="text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1"
                          >
                            View Details
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}