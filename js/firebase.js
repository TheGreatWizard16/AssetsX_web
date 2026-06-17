// Set up Firebase and export the auth object used across the app.
// Firebase config comes from the Firebase console under Project Settings.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDtKPe2PmMX2GwdRREirIQY7F6IX_KHdwQ",
  authDomain: "stock-app-1018b.firebaseapp.com",
  projectId: "stock-app-1018b",
  storageBucket: "stock-app-1018b.firebasestorage.app",
  messagingSenderId: "1044613601932",
  appId: "1:1044613601932:web:3cbeec972c8169217af9a9",
  measurementId: "G-ZWLH46262G",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
