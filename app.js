import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZmp_2k1y7m-Y3J9nB7o7gbzMsRPB9GY0",
  authDomain: "the-cash-chase-2026.firebaseapp.com",
  projectId: "the-cash-chase-2026",
  storageBucket: "the-cash-chase-2026.firebasestorage.app",
  messagingSenderId: "950424018422",
  appId: "1:950424018422:web:26a4951c875e56891c7bd7",
  measurementId: "G-PVFD629028"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("The Cash Chase Connected!");
