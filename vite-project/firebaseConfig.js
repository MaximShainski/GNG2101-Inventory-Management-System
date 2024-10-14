import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // If using Firebase Authentication
import { getFirestore } from "firebase/firestore"; // If using Firebase Firestore

const firebaseConfig = {
    apiKey: "AIzaSyDU0lsSAWblFvdlKQM3mncIDsYXP8paHXg",
    authDomain: "goat-wise.firebaseapp.com",
    projectId: "goat-wise",
    storageBucket: "goat-wise.appspot.com",
    messagingSenderId: "315082444126",
    appId: "1:315082444126:web:1aa8dce75994de58d293cf",
    measurementId: "G-EVVWSSD71K"
  };

const app = initializeApp(firebaseConfig);

// If you're using other Firebase services, you can export them
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore};
export default firebaseConfig;