// services/notificationService.js
export  class NotificationService {
  static isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  static async requestPermission() {
    if (!this.isSupported()) {
      console.log('Notifications are not supported in this environment');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  static showNotification(title, options = {}) {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      console.log('Cannot show notification - permission not granted or not supported');
      return false;
    }

    try {
      return new Notification(title, options);
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }
}