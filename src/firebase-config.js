// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from '@firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA_IU3KxkrnZQR1mZEy7tjMOA-vWCpUyxU',
  authDomain: 'innovaedu-senac.firebaseapp.com',
  projectId: 'innovaedu-senac',
  storageBucket: 'innovaedu-senac.firebasestorage.app',
  messagingSenderId: '444724418081',
  appId: '1:444724418081:web:82540f592d155f1cbd3560',
  measurementId: 'G-3FK49MYC1X',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
