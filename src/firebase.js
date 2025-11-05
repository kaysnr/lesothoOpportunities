// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCH09KRmS1f2RKexJzNw67SxuNMii0_9M8",
  authDomain: "lesotho-opportunities.firebaseapp.com",
  projectId: "lesotho-opportunities",
  storageBucket: "lesotho-opportunities.firebasestorage.app",
  messagingSenderId: "75273462407",
  appId: "1:75273462407:web:6f327609fbcbdfa3ec4e22",
  measurementId: "G-PQVZJ6GPL9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ Added Storage