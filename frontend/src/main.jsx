import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router'
import {Provider} from 'react-redux';
import {store} from "./stores/store.js";
import GoogleMapComponent from './map.jsx'
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
    <BrowserRouter>
    <App></App>
    </BrowserRouter>
    </Provider>
  </StrictMode>,
)
