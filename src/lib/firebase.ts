import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// These should ideally be in .env file, but I will reconstruct them 
// from what I saw earlier or wait for user to provide them if I can't find them.
// FOR NOW, I will use a placeholder or check if I can find them in my own history.
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
export const auth = getAuth(app);
