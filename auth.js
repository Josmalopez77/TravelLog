import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Elements
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'app.html';
    } catch (error) {
        console.error('Error logging in:', error);
        loginError.textContent = getErrorMessage(error.code);
        loginError.classList.add('show');
        setTimeout(() => loginError.classList.remove('show'), 5000);
    }
});

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, redirect to app
        window.location.href = 'app.html';
    }
});

// Error messages in Spanish
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': 'Email inválido',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-credential': 'Email o contraseña incorrectos',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
    };
    
    return errorMessages[errorCode] || 'Ocurrió un error. Intenta de nuevo';
}
