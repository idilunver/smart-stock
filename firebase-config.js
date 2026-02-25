import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { 
    apiKey: "AIzaSyBXKN57HUdC9NxkiJaR3EZu8eDp-EBGIiM", 
    authDomain: "smart-stock-ece91.firebaseapp.com", 
    projectId: "smart-stock-ece91", 
    storageBucket: "smart-stock-ece91.firebasestorage.app", 
    messagingSenderId: "123846999953", 
    appId: "1:123846999953:web:79feeba6b19af4d0d6a430" 
}; 

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);