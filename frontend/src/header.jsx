import './index.css';
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from './authslice';
import { useLocation, Link } from 'react-router-dom';
import { Badge, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Chip } from "@heroui/react";
import axiosClient from "./utils/axiosclient";
import { useSocket } from './hooks/useSocket';

// Modern Logo Component
const HelpNetLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" opacity="0.1"/>
    <path d="M50 20 L70 35 L70 55 L50 70 L30 55 L30 35 Z" fill="url(#logoGradient)" opacity="0.8"/>
    <path d="M50 30 L60 37.5 L60 47.5 L50 55 L40 47.5 L40 37.5 Z" fill="white"/>
    <circle cx="50" cy="45" r="5" fill="url(#logoGradient)"/>
  </svg>
);

// Notification Icon
const NotificationIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

// Clock Icon for time display
const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Check Icon
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// Location Icon
const LocationIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Tracking Icon
const TrackingIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const EVENTS = {
  NEW_EMERGENCY: "newEmergency",
  NOTIFICATION: "notification",
};

export default function NavbarHelpNet() {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { socket, connected } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [showReadNotifications, setShowReadNotifications] = useState(true);

  const isHomePage = location.pathname === '/';
  const isNotificationsPage = location.pathname === '/notifications';

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Video handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoLoad = () => {
      setVideoLoaded(true);
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay prevented:", error);
          setVideoError(true);
        });
      }
    };

    const handleVideoError = (e) => {
      console.error("Video loading error:", e);
      setVideoError(true);
    };

    video.addEventListener('loadeddata', handleVideoLoad);
    video.addEventListener('error', handleVideoError);
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleVideoLoad);
      video.removeEventListener('error', handleVideoError);
    };
  }, [isHomePage]);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setVideoError(false);
      }).catch(error => {
        console.error("Error playing video:", error);
      });
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setNotifications([]);
    setUnreadCount(0);
  };

  // Optimistic update for marking as read
  const markAsRead = async (notificationId) => {
    try {
      const wasUnread = notifications.find(n => n._id === notificationId)?.read === false;
      
      setNotifications(prev => prev.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ));
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      await axiosClient.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setNotifications(prev => prev.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: false } 
          : notification
      ));
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      await axiosClient.patch('/notifications/read-all');
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      fetchNotifications();
    }
  };

  const fetchNotifications = async (includeRead = false) => {
    try {
      const response = await axiosClient.get(`/notifications/get?includeRead=${includeRead}`);
      const notificationsArray = response.data?.data;
      if (Array.isArray(notificationsArray)) {
        if (includeRead) {
          const serverUnreadCount = notificationsArray.filter(n => !n.read).length;
          if (serverUnreadCount !== unreadCount || notificationsArray.length !== notifications.length) {
            setNotifications(notificationsArray);
            setUnreadCount(serverUnreadCount);
          }
        } else {
          setNotifications(notificationsArray);
          setUnreadCount(notificationsArray.length);
        }
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Handle socket events
  useEffect(() => {
    if (!socket || !connected || !isAuthenticated || !user?._id) return;

    socket.emit("joinRoom", { userId: user._id });

    socket.on(EVENTS.NOTIFICATION, (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    socket.on(EVENTS.NEW_EMERGENCY, (data) => {
      const emergencyNotification = {
        _id: `emergency-${data.emergency._id}`,
        title: `${data.emergency.emergencyType.toUpperCase()} EMERGENCY NEARBY`,
        message: data.emergency.description,
        createdAt: data.emergency.createdAt,
        read: false,
        type: 'emergency_alert',
        emergencyId: data.emergency._id
      };
      setNotifications(prev => [emergencyNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off(EVENTS.NOTIFICATION);
      socket.off(EVENTS.NEW_EMERGENCY);
    };
  }, [socket, connected, isAuthenticated, user?._id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(false);
      const interval = setInterval(() => fetchNotifications(false), 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success':
        return <span className="text-green-400">✓</span>;
      case 'info':
        return <span className="text-blue-400">ℹ</span>;
      case 'warning':
        return <span className="text-yellow-400">⚠</span>;
      case 'error':
        return <span className="text-red-400">✕</span>;
      case 'emergency_alert':
        return <span className="text-red-400">🚨</span>;
      default:
        return <span className="text-purple-300">🔔</span>;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  const getFilteredNotifications = () => {
    if (notificationFilter === 'unread' || !showReadNotifications) {
      return notifications.filter(n => !n.read);
    }
    if (notificationFilter === 'read') {
      fetchNotifications(true);
      return notifications.filter(n => n.read);
    }
    return notifications;
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Volunteers', path: '/volunteers' },
    { name: 'About', path: '/about' },
    { name: 'Emergency Map', path: '/emergency/map' },
  ];

  return (
    <>
      {/* Header with always visible background */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-gradient-to-r from-purple-800/95 to-indigo-800/95 backdrop-blur-lg shadow-lg' 
          : 'bg-gradient-to-r from-purple-800 to-indigo-800 shadow-md'
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <HelpNetLogo className="w-10 h-10 transform group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                HelpNet
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-purple-300 ${
                    location.pathname === link.path 
                      ? 'text-purple-300' 
                      : 'text-gray-100'
                  }`}
                >
                  {link.name}
                  {link.name === 'Notifications' && unreadCount > 0 && (
                    <Badge 
                      color="danger" 
                      content={unreadCount > 99 ? "99+" : unreadCount}
                      className="absolute -top-1 -right-1 animate-bounce"
                    />
                  )}
                  {location.pathname === link.path && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Emergency Button */}
              <Button
                as={Link}
                to="/emergency/create"
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:from-red-600 hover:to-pink-600"
              >
                <span className="flex items-center space-x-2">
                  <span>🚨</span>
                  <span>Report Emergency</span>
                </span>
              </Button>

              {/* Notifications */}
              {isAuthenticated && (
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <button className="relative p-2 rounded-full hover:bg-purple-700/30 transition-colors duration-300">
                      <div className="flex flex-row gap-2 items-center">
                        <NotificationIcon className="w-6 h-6 text-gray-100" />
                        {unreadCount > 0 && (
                          <Badge 
                            color="danger" 
                            content={unreadCount > 99 ? "99+" : unreadCount}
                            className="w-6 h-6 animate-pulse"
                            shape="circle"
                          />
                        )}
                      </div>
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Notifications" className="w-96 max-h-96 overflow-y-auto bg-gradient-to-b from-purple-900/95 to-indigo-900/95 backdrop-blur-lg border border-purple-700/50">
                    <DropdownItem key="header" className="opacity-100 bg-gradient-to-r from-purple-800/50 to-indigo-800/50">
                      <div className="flex justify-between items-center py-2">
                        <span className="font-semibold text-purple-100">Notifications</span>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs bg-purple-700/50 text-purple-200 hover:bg-purple-600/50 px-2 py-1 rounded-full transition-colors"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="flex bg-purple-800/30 rounded-lg p-1 mt-2 shadow-sm">
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
                    </DropdownItem>
                    {getFilteredNotifications().length > 0 ? (
                      <>
                        {getFilteredNotifications().slice(0, 5).map((notif) => (
                          <DropdownItem 
                            key={notif._id} 
                            className={`py-3 border-b border-purple-700/30 ${
                              !notif.read 
                                ? 'bg-gradient-to-r from-purple-700/30 to-indigo-700/30' 
                                : 'bg-purple-800/20 hover:bg-purple-700/30'
                            }`}
                            onClick={() => markAsRead(notif._id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex-shrink-0 mt-1 p-2 rounded-full ${
                                !notif.read ? 'bg-purple-600/30' : 'bg-purple-800/30'
                              }`}>
                                {getNotificationIcon(notif.type)}
                              </div>
                              <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                  <h3 className={`font-semibold text-sm ${!notif.read ? 'text-purple-100' : 'text-purple-200'}`}>
                                    {notif.title}
                                  </h3>
                                  <div className="flex items-center gap-2 ml-2">
                                    {!notif.read && (
                                      <Chip size="sm" color="primary" variant="dot">
                                        New
                                      </Chip>
                                    )}
                                    {notif.read && (
                                      <Chip size="sm" color="gray" variant="flat">
                                        Read
                                      </Chip>
                                    )}
                                    <span className="text-sm text-purple-300 flex items-center gap-1">
                                      <ClockIcon className="w-3 h-3" />
                                      {formatTimeAgo(notif.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                <p className={`text-xs mt-1 ${!notif.read ? 'text-purple-200' : 'text-purple-300'}`}>
                                  {notif.message}
                                </p>
                                {!notif.read && (
                                  <Button 
                                    color="primary" 
                                    size="sm" 
                                    variant="flat"
                                    endContent={<CheckIcon className="w-3 h-3" />}
                                    className="mt-2 bg-purple-600/30 text-purple-200 hover:bg-purple-600/50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notif._id);
                                    }}
                                  >
                                    Mark as Read
                                  </Button>
                                )}
                              </div>
                            </div>
                          </DropdownItem>
                        ))}
                        <DropdownItem key="view-all" className="opacity-100 bg-gradient-to-r from-purple-800/50 to-indigo-800/50">
                          <Button
                            as={Link}
                            to="/notifications"
                            color="primary"
                            variant="flat"
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                          >
                            View All Notifications
                          </Button>
                        </DropdownItem>
                      </>
                    ) : (
                      <DropdownItem key="empty">
                        <div className="text-center py-12 bg-gradient-to-r from-purple-800/30 to-indigo-800/30 rounded-lg">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-700/30 rounded-full mb-2">
                            <span className="text-2xl">🔔</span>
                          </div>
                          <p className="text-purple-300">
                            {notificationFilter !== 'all' 
                              ? `No ${notificationFilter} notifications to display` 
                              : "No notifications"}
                          </p>
                        </div>
                      </DropdownItem>
                    )}
                  </DropdownMenu>
                </Dropdown>
              )}

              {/* User Menu */}
              {isAuthenticated ? (
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <div className="relative cursor-pointer">
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple-400 ring-offset-2 hover:ring-purple-300 transition-all duration-300">
                        <img 
                          src={user?.avatar || "https://i.pravatar.cc/150?u=user"} 
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Profile Actions" className="bg-gradient-to-b from-purple-900/95 to-indigo-900/95 backdrop-blur-lg border border-purple-700/50">
                    <DropdownItem key="profile" className="opacity-100 bg-purple-800/30">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={user?.avatar || "https://i.pravatar.cc/150?u=user"} 
                          alt="Profile"
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-semibold text-purple-100">{user?.name || 'User'}</p>
                          <p className="text-xs text-purple-300">{user?.email}</p>
                        </div>
                      </div>
                    </DropdownItem>
                    <DropdownItem key="dashboard" className="text-purple-100 hover:bg-purple-700/30">Dashboard</DropdownItem>
                    <DropdownItem key="settings" className="text-purple-100 hover:bg-purple-700/30">Settings</DropdownItem>
                    <DropdownItem key="help" className="text-purple-100 hover:bg-purple-700/30">Help & Support</DropdownItem>
                    <DropdownItem key="logout" color="danger" onClick={handleLogout} className="text-red-400 hover:bg-red-900/30">
                      Log Out
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              ) : (
                <Button
                  as={Link}
                  to="/user/login"
                  variant="bordered"
                  className="border-purple-400 text-purple-300 hover:bg-purple-700 hover:text-white transition-all duration-300"
                >
                  Login
                </Button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-purple-700/30 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-gradient-to-r from-purple-800 to-indigo-800 border-t border-purple-700">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-100 hover:text-purple-300 hover:bg-purple-700/30"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                    {link.name === 'Notifications' && unreadCount > 0 && (
                      <Badge 
                        color="danger" 
                        content={unreadCount > 99 ? "99+" : unreadCount}
                        className="ml-2"
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Hero Section with Updated Content */}
      {isHomePage && (
        <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900">
          {/* Video Background with Fallbacks */}
          <div className="absolute inset-0 z-0">
            {!videoError ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover"
                  style={{ opacity: videoLoaded ? 0.6 : 0 }}
                >
                  <source src="/videos/Earth.mp4" type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />
                  <source src="/videos/Earth.webm" type="video/webm" />
                  <source src="/Earth.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {!videoLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-purple-900">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900">
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
                  <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000"></div>
                </div>
              </div>
            )}

            {videoError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={handlePlayVideo}
                  className="bg-white/20 backdrop-blur-sm rounded-full p-6 hover:bg-white/30 transition-all duration-300 group"
                >
                  <svg className="w-12 h-12 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/50 to-purple-900/80"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              <span className="bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
                Get Help in Emergencies
              </span>
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                With Live Tracking
              </span>
            </h1>
            <p className="text-2xl md:text-3xl font-light text-purple-100 mb-8">
              Connect responders to those in need with real-time location tracking
            </p>
            <p className="text-lg md:text-xl text-purple-200 max-w-3xl mx-auto mb-12">
              HelpNet instantly connects people facing emergencies with nearby volunteers and emergency services. 
              Our live tracking system ensures help reaches exactly where it's needed, when it's needed most.
            </p>
            
            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
                <div className="flex justify-center mb-4">
                  <LocationIcon className="w-12 h-12 text-purple-300" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Instant Location Sharing</h3>
                <p className="text-purple-200">
                  Automatically share your location when reporting an emergency for faster response
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
                <div className="flex justify-center mb-4">
                  <TrackingIcon className="w-12 h-12 text-purple-300" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Live Tracking</h3>
                <p className="text-purple-200">
                  Track responders in real-time as they navigate to your location with ETA updates
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
                <div className="flex justify-center mb-4">
                  <svg className="w-12 h-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Real-time Communication</h3>
                <p className="text-purple-200">
                  Stay connected with responders through our chat system for critical updates
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                to="/volunteers"
                size="lg"
                className="bg-white text-purple-700 px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Become a Volunteer
              </Button>
              <Button
                as={Link}
                to="/about"
                size="lg"
                variant="bordered"
                className="border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-purple-700 transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Notifications Page */}
      {isNotificationsPage && (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-purple-100">Notifications</h1>
              {unreadCount > 0 && (
                <Badge 
                  color="primary" 
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
          
          {getFilteredNotifications().length === 0 ? (
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
                <div 
                  key={notification._id} 
                  className={`transition-all duration-200 hover:shadow-md rounded-lg border ${
                    !notification.read 
                      ? 'bg-gradient-to-r from-purple-700/30 to-indigo-700/30 border-l-4 border-purple-400' 
                      : 'bg-purple-800/20 border-l-4 border-purple-600/50'
                  }`}
                >
                  <div className="p-4">
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
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <HelpNetLogo className="w-10 h-10" />
                <span className="text-2xl font-bold">HelpNet</span>
              </div>
              <p className="text-gray-400">
                Connecting volunteers and communities to make a difference together.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/requests" className="block text-gray-400 hover:text-white transition-colors">
                  Requests
                </Link>
                <Link to="/volunteers" className="block text-gray-400 hover:text-white transition-colors">
                  Volunteers
                </Link>
                <Link to="/about" className="block text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-purple-500 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2025 HelpNet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}