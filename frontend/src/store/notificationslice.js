// features/notifications/notificationsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (action.payload.status !== 'read') {
        state.unreadCount += 1;
      }
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && notification.status !== 'read') {
        notification.status = 'read';
        state.unreadCount -= 1;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.status = 'read';
      });
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    }
  }
});

export const { 
  addNotification, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  clearNotifications 
} = notificationsSlice.actions;

export default notificationsSlice.reducer;