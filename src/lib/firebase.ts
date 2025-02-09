import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCMUG508hV_Ktlg1wiPWZVh2vrsPsGb1NY",
  authDomain: "lpg3kg-app.firebaseapp.com",
  projectId: "lpg3kg-app",
  storageBucket: "lpg3kg-app.firebasestorage.app",
  messagingSenderId: "168029972833",
  appId: "1:168029972833:web:27b834c73db4b8dba53d20",
  measurementId: "G-J0PK4DN7JC"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);