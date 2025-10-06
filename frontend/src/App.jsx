import {Routes,Route, Navigate} from 'react-router';
import Homepage from  "./pages/home";
import Login from './pages/login';
import { checkAuth } from './authslice.js';
import { useDispatch,useSelector } from 'react-redux';
import { useEffect } from 'react';
import Signup from "./pages/signup";
// App.js or your routing file
import NotificationsPage from './pages/Notifications';
import EmergencyDetail from './pages/EmergencyDetails';
//import NotificationToast from './components/NotificationToast';

import EmergencyRequest from "./pages/EmergencyRequest.jsx";
import EmergencyForm from './pages/EmergencyForm.jsx';
 import EmergenciesPage from "./pages/EmergenciesPage.jsx";
import EmergencyMapPage from './pages/EmergencyMapPage';
import AboutPage from "./pages/AboutEmergenciesPage.jsx"; // Import the new component
import { connectSocket, disconnectSocket } from './services/socket';

function App(){
  const {isAuthenticated,user,loading} = useSelector((state) => state.auth);
 const dispatch = useDispatch();
useEffect(() => {
  dispatch(checkAuth())},[dispatch]);
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      const socket = connectSocket(user._id);
      
      // Listen for new notifications
      socket.on('newNotification', (notification) => {
        // Update your notification state or show a toast
        console.log('New notification:', notification);
      });
      
      return () => {
        disconnectSocket();
      };
    }
  }, [isAuthenticated, user]);
  
  
 
  return (
    
        
        
    <Routes>
      <Route path="/" element={<Homepage/>}/>
       <Route path="/user/login" element={ isAuthenticated?<Navigate to="/"/>:<Login></Login>} />
      <Route path="/user/register" element={ isAuthenticated?<Navigate to="/"/>:<Signup></Signup>} />
      <Route path="/emergency/create" element={<EmergencyRequest></EmergencyRequest>} />
              <Route path="/emergency/page" element={<EmergenciesPage />} />
                      <Route path="/emergency/create" element={<EmergencyForm />} />
<Route path="/emergency/map" element={<EmergencyMapPage />} />
// Add this route to your router
<Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/about" element={<AboutPage />} />
<Route path="/emergency/:emergencyId" element={<EmergencyDetail />} />
    </Routes>
  )
}

export default App;