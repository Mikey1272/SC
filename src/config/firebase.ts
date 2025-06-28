// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCiy6IArFl1FQF9jwMVFPwrlqbw44s_33s",
  authDomain: "studentconnect-c9c12.firebaseapp.com",
  databaseURL: "https://studentconnect-c9c12-default-rtdb.firebaseio.com",
  projectId: "studentconnect-c9c12",
  storageBucket: "studentconnect-c9c12.firebasestorage.app",
  messagingSenderId: "128122214826",
  appId: "1:128122214826:web:1dfab265296ace318f33d3",
  measurementId: "G-9HLZP54PGZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, database, storage, googleProvider, analytics };
export default app;