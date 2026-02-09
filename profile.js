import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    addDoc,
    getDocs,
    doc,
    getDoc,
    deleteDoc,
    query,
    where,
    orderBy 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
    ref, 
    uploadBytesResumable, 
    getDownloadURL,
    deleteObject 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

let currentUser = null;
let profileUserId = null;
let isOwnProfile = false;
let currentPhotoId = null;

// Admin email
const ADMIN_EMAIL = 'josesitoloprz@gmail.com'; // ⚠️ IMPORTANTE: Cambia esto

// Get user ID from URL
const urlParams = new URLSearchParams(window.location.search);
profileUserId = urlParams.get('uid');

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    
    // If no user ID in URL, redirect to own profile
    if (!profileUserId) {
        window.location.href = `profile.html?uid=${user.uid}`;
        return;
    }
    
    // Check if this is the user's own profile
    isOwnProfile = (profileUserId === user.uid);
    
    // Set up profile link
    const myProfileLink = document.getElementById('myProfileLink');
    myProfileLink.href = `profile.html?uid=${user.uid}`;
    
    // Show admin link if user is admin
    if (user.email === ADMIN_EMAIL) {
        document.getElementById('adminLink').style.display = 'block';
    }
    
    // Show add photo button only for own profile
    if (isOwnProfile) {
        document.getElementById('addPhotoBtn').style.display = 'block';
    }
    
    // Load profile
    await loadProfile();
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

// Load profile and photos
async function loadProfile() {
    try {
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', profileUserId));
        
        if (!userDoc.exists()) {
            alert('Usuario no encontrado');
            window.location.href = 'app.html';
            return;
        }
        
        const userData = userDoc.data();
        document.getElementById('profileName').textContent = userData.name;
        
        if (isOwnProfile) {
            document.getElementById('profileSubtitle').textContent = 'Tu resumen del año';
        } else {
            document.getElementById('profileSubtitle').textContent = `Álbum de ${userData.name}`;
        }
        
        // Load photos
        await loadPhotos();
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load photos
async function loadPhotos() {
    const photosContainer = document.getElementById('photosContainer');
    photosContainer.innerHTML = '<div class="loading">Cargando fotos...</div>';
    
    try {
        const photosQuery = query(
            collection(db, 'photos'),
            where('userId', '==', profileUserId),
            orderBy('date', 'desc')
        );
        
        const photosSnapshot = await getDocs(photosQuery);
        
        if (photosSnapshot.empty) {
            photosContainer.innerHTML = '<p class="empty-state">No hay fotos todavía</p>';
            return;
        }
        
        photosContainer.innerHTML = '';
        
        photosSnapshot.forEach((doc) => {
            const photo = doc.data();
            const photoId = doc.id;
            
            const photoCard = document.createElement('div');
            photoCard.className = 'photo-card';
            photoCard.onclick = () => showPhotoDetail(photoId, photo);
            
            const formattedDate = new Date(photo.date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            photoCard.innerHTML = `
                <img src="${photo.imageUrl}" alt="${photo.location || 'Foto'}">
                <div class="photo-info">
                    <p class="photo-location">${photo.location || 'Sin ubicación'}</p>
                    <p class="photo-date">${formattedDate}</p>
                    ${photo.description ? `<p class="photo-description">${photo.description}</p>` : ''}
                </div>
            `;
            
            photosContainer.appendChild(photoCard);
        });
    } catch (error) {
        console.error('Error loading photos:', error);
        photosContainer.innerHTML = '<p class="empty-state">Error al cargar las fotos</p>';
    }
}

// Modal controls
const addPhotoModal = document.getElementById('addPhotoModal');
const addPhotoBtn = document.getElementById('addPhotoBtn');
const closeModal = document.getElementById('closeModal');
const cancelPhotoBtn = document.getElementById('cancelPhotoBtn');
const photoFile = document.getElementById('photoFile');
const imagePreview = document.getElementById('imagePreview');
const addPhotoForm = document.getElementById('addPhotoForm');

addPhotoBtn.addEventListener('click', () => {
    addPhotoModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
    addPhotoModal.classList.remove('active');
    addPhotoForm.reset();
    imagePreview.classList.remove('show');
    imagePreview.innerHTML = '';
});

cancelPhotoBtn.addEventListener('click', () => {
    addPhotoModal.classList.remove('active');
    addPhotoForm.reset();
    imagePreview.classList.remove('show');
    imagePreview.innerHTML = '';
});

// Image preview
photoFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            imagePreview.classList.add('show');
        };
        reader.readAsDataURL(file);
    }
});

// Add photo form
addPhotoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const file = photoFile.files[0];
    const description = document.getElementById('photoDescription').value.trim();
    const date = document.getElementById('photoDate').value;
    const location = document.getElementById('photoLocation').value.trim();
    
    if (!file) {
        alert('Por favor selecciona una foto');
        return;
    }
    
    // Show progress
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    uploadProgress.style.display = 'block';
    
    try {
        // Upload image to Firebase Storage
        const storageRef = ref(storage, `photos/${currentUser.uid}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressFill.style.width = progress + '%';
                progressText.textContent = `Subiendo: ${Math.round(progress)}%`;
            },
            (error) => {
                console.error('Error uploading:', error);
                alert('Error al subir la foto');
                uploadProgress.style.display = 'none';
            },
            async () => {
                // Upload completed
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                // Save photo data to Firestore
                await addDoc(collection(db, 'photos'), {
                    userId: currentUser.uid,
                    imageUrl: downloadURL,
                    storagePath: uploadTask.snapshot.ref.fullPath,
                    description: description,
                    date: date,
                    location: location,
                    createdAt: new Date().toISOString()
                });
                
                // Reset form and close modal
                addPhotoForm.reset();
                imagePreview.classList.remove('show');
                imagePreview.innerHTML = '';
                uploadProgress.style.display = 'none';
                addPhotoModal.classList.remove('active');
                
                // Reload photos
                await loadPhotos();
            }
        );
    } catch (error) {
        console.error('Error adding photo:', error);
        alert('Error al agregar la foto');
        uploadProgress.style.display = 'none';
    }
});

// Photo detail modal
const photoDetailModal = document.getElementById('photoDetailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const deletePhotoBtn = document.getElementById('deletePhotoBtn');

closeDetailModal.addEventListener('click', () => {
    photoDetailModal.classList.remove('active');
});

async function showPhotoDetail(photoId, photo) {
    currentPhotoId = photoId;
    
    document.getElementById('detailImage').src = photo.imageUrl;
    document.getElementById('detailLocation').textContent = photo.location || 'Sin ubicación';
    document.getElementById('detailDescription').textContent = photo.description || 'Sin descripción';
    
    const formattedDate = new Date(photo.date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('detailDate').textContent = formattedDate;
    
    // Show delete button only for own photos
    if (isOwnProfile) {
        deletePhotoBtn.style.display = 'block';
    } else {
        deletePhotoBtn.style.display = 'none';
    }
    
    photoDetailModal.classList.add('active');
}

// Delete photo
deletePhotoBtn.addEventListener('click', async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
        return;
    }
    
    try {
        // Get photo data
        const photoDoc = await getDoc(doc(db, 'photos', currentPhotoId));
        const photoData = photoDoc.data();
        
        // Delete from Storage
        const storageRef = ref(storage, photoData.storagePath);
        await deleteObject(storageRef);
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'photos', currentPhotoId));
        
        // Close modal and reload
        photoDetailModal.classList.remove('active');
        await loadPhotos();
    } catch (error) {
        console.error('Error deleting photo:', error);
        alert('Error al eliminar la foto');
    }
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === addPhotoModal) {
        addPhotoModal.classList.remove('active');
    }
    if (e.target === photoDetailModal) {
        photoDetailModal.classList.remove('active');
    }
});
