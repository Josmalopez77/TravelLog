// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAMoX9mOGkxydzoaotPqFVyZQv_IWaY_rE",
  authDomain: "travelog-2cebb.firebaseapp.com",
  projectId: "travelog-2cebb",
  storageBucket: "travelog-2cebb.firebasestorage.app",
  messagingSenderId: "708812859285",
  appId: "1:708812859285:web:068416a0a3c013294cf89c",
  measurementId: "G-8LHX144QLF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);