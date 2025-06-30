import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC9FK8jpCUzJvqO2LMEpSG5CN6c3-jKQNo",
  authDomain: "notification-bb346.firebaseapp.com",
  projectId: "notification-bb346",
  storageBucket: "notification-bb346.firebasestorage.app",
  messagingSenderId: "1070936523268",
  appId: "1:1070936523268:web:b44e17ad41edddb5bfab51",
  measurementId: "G-M507MLZ4NK"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);