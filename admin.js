import { auth, db, firebaseConfig } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    getDocs,
    doc,
    getDoc,
    setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;

// Admin email - CAMBIA ESTO a tu email de admin
const ADMIN_EMAIL = 'josesitoloprz@gmail.com'; // ⚠️ IMPORTANTE: Cambia esto

// Check authentication and admin access
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    
    // Check if user is admin
    if (user.email !== ADMIN_EMAIL) {
        alert('No tienes permisos de administrador');
        window.location.href = 'app.html';
        return;
    }
    
    // Set up profile link
    const myProfileLink = document.getElementById('myProfileLink');
    myProfileLink.href = `profile.html?uid=${user.uid}`;
    
    // Load users
    await loadUsers();
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
});

// Create user form
const createUserForm = document.getElementById('createUserForm');
const createSuccess = document.getElementById('createSuccess');
const createError = document.getElementById('createError');

createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value;
    
    createSuccess.classList.remove('show');
    createError.classList.remove('show');
    
    try {
        // Call Cloud Function to create user
        // NOTA: Esto requiere configurar una Cloud Function en Firebase
        // Por ahora, mostraremos las instrucciones al usuario
        
        // Crear el usuario usando la REST API de Firebase Admin
        const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + getApiKey(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                returnSecureToken: true
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message);
        }
        
        const data = await response.json();
        const newUserId = data.localId;
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', newUserId), {
            name: name,
            email: email,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.uid
        });
        
        createSuccess.textContent = `Usuario ${name} creado exitosamente`;
        createSuccess.classList.add('show');
        createUserForm.reset();
        
        // Reload users list
        await loadUsers();
        
        setTimeout(() => createSuccess.classList.remove('show'), 5000);
    } catch (error) {
        console.error('Error creating user:', error);
        createError.textContent = getErrorMessage(error.message);
        createError.classList.add('show');
        setTimeout(() => createError.classList.remove('show'), 5000);
    }
});

// Load all users
async function loadUsers() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '<div class="loading">Cargando usuarios...</div>';
    
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        if (usersSnapshot.empty) {
            usersList.innerHTML = '<p class="empty-state">No hay usuarios registrados</p>';
            return;
        }
        
        usersList.innerHTML = '';
        
        usersSnapshot.forEach((doc) => {
            const user = doc.data();
            const userId = doc.id;
            
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            
            const isAdmin = user.email === ADMIN_EMAIL;
            
            userItem.innerHTML = `
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <p>${user.email}</p>
                </div>
                ${isAdmin ? '<span class="user-badge">Admin</span>' : ''}
            `;
            
            usersList.appendChild(userItem);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        usersList.innerHTML = '<p class="empty-state">Error al cargar usuarios</p>';
    }
}

// Get API key from firebase config
function getApiKey() {
    // Esta función extrae la API key del objeto firebaseConfig
    // La necesitamos para usar la REST API
    return firebaseConfig.apiKey;
}

// Error messages
function getErrorMessage(errorCode) {
    const errorMessages = {
        'EMAIL_EXISTS': 'Este email ya está registrado',
        'INVALID_EMAIL': 'Email inválido',
        'WEAK_PASSWORD': 'La contraseña debe tener al menos 6 caracteres',
        'TOO_MANY_ATTEMPTS_TRY_LATER': 'Demasiados intentos. Intenta más tarde'
    };
    
    return errorMessages[errorCode] || 'Error al crear usuario: ' + errorCode;
}
