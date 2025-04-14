// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDizW8fv-DgeMihB1gQahXAYFi7Yqz9hqk",
    authDomain: "net-zero-c8cd6.firebaseapp.com",
    databaseURL: "https://net-zero-c8cd6-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "net-zero-c8cd6",
    storageBucket: "net-zero-c8cd6.firebasestorage.app",
    messagingSenderId: "9310338529",
    appId: "1:9310338529:web:bc5043a01a4190d07a66a0",
    measurementId: "G-2BZPCEDXFE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);

export { database, ref, onValue };

// Add error handling
database.ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
        console.log('Connected to Firebase');
    } else {
        console.log('Disconnected from Firebase');
    }
});

// Add security rules to your Firebase console
/*
{
  "rules": {
    "sensors": {
      ".read": true,  // Anyone can read sensor data
      ".write": false // Only authenticated users can write
    }
  }
}
*/ 