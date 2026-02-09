// Firebase Configuration
// IMPORTANTE: Reemplaza estos valores con tu configuración de Firebase
// Para obtener estos valores:
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un proyecto nuevo o selecciona uno existente
// 3. Ve a Configuración del proyecto > Tus apps > SDK de Firebase
// 4. Copia la configuración y pégala aquí

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// TU CONFIGURACIÓN DE FIREBASE AQUÍ
const firebaseConfig = {
  apiKey: "AIzaSyAMoX9mOGkxydzoaotPqFVyZQv_IWaY_rE",
  authDomain: "travelog-2cebb.firebaseapp.com",
  projectId: "travelog-2cebb",
  storageBucket: "travelog-2cebb.firebasestorage.app",
  messagingSenderId: "708812859285",
  appId: "1:708812859285:web:068416a0a3c013294cf89c",
  measurementId: "G-8LHX144QLF"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
