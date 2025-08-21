// Firebase initialization and helpers
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyCTosO53WK6p_V1OUE8QDHogFFefYbJ8sU',
  authDomain: 'dashboard-febic.firebaseapp.com',
  projectId: 'dashboard-febic',
  storageBucket: 'dashboard-febic.firebasestorage.app',
  messagingSenderId: '407393693728',
  appId: '1:407393693728:web:5904e8d60adc3ff4ce0c45',
  measurementId: 'G-CR23QHE4J0'
};

const app = initializeApp(firebaseConfig);
// Realtime Database instance
const rtdb = getDatabase(app);

// Analytics only if supported (e.g., browsers, not SSR)
let analytics;
(async () => {
  if (await isSupported()) {
    analytics = getAnalytics(app);
  }
})();

export { app, rtdb, analytics };
