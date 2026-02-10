import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    arrayUnion,
    arrayRemove,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dchjnshlx';
const CLOUDINARY_UPLOAD_PRESET = 'travelog_upload';

let currentUser = null;
let currentUserData = null;

// Admin email
const ADMIN_EMAIL = 'josesitoloprz@gmail.com'; // ⚠️ IMPORTANTE: Cambia esto

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    currentUserData = userDoc.data();
    
    // Set up profile link
    const myProfileLink = document.getElementById('myProfileLink');
    myProfileLink.href = `profile.html?uid=${user.uid}`;
    
    // Show admin link if user is admin
    if (user.email === ADMIN_EMAIL) {
        document.getElementById('adminLink').style.display = 'block';
    }
    
    // Load data
    await loadUpcomingTrips();
    await loadSuggestions();
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

// Load upcoming trips
async function loadUpcomingTrips() {
    const tripsList = document.getElementById('tripsList');
    
    try {
        const tripsQuery = query(
            collection(db, 'trips'),
            orderBy('date', 'asc')
        );
        
        const tripsSnapshot = await getDocs(tripsQuery);
        
        if (tripsSnapshot.empty) {
            tripsList.innerHTML = '<p class="empty-state">No hay salidas programadas aún</p>';
            return;
        }
        
        tripsList.innerHTML = '';
        
        tripsSnapshot.forEach((doc) => {
            const trip = doc.data();
            
            const formattedDate = new Date(trip.date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const tripCard = document.createElement('div');
            tripCard.className = 'trip-card';
            
            tripCard.innerHTML = `
                <div class="trip-info">
                    <h3>${trip.place}</h3>
                    <p class="trip-date">${formattedDate} - ${trip.month}</p>
                </div>
            `;
            
            tripsList.appendChild(tripCard);
        });
    } catch (error) {
        console.error('Error loading trips:', error);
        tripsList.innerHTML = '<p class="empty-state">Error al cargar las salidas</p>';
    }
}

// Load suggestions
async function loadSuggestions() {
    const suggestionsGrid = document.getElementById('suggestionsGrid');
    suggestionsGrid.innerHTML = '<div class="loading">Cargando sugerencias...</div>';
    
    try {
        const suggestionsQuery = query(
            collection(db, 'suggestions'),
            orderBy('createdAt', 'desc')
        );
        
        const suggestionsSnapshot = await getDocs(suggestionsQuery);
        
        if (suggestionsSnapshot.empty) {
            suggestionsGrid.innerHTML = '<p class="empty-state">No hay sugerencias todavía. ¡Sé el primero en proponer un lugar!</p>';
            return;
        }
        
        suggestionsGrid.innerHTML = '';
        
        for (const suggestionDoc of suggestionsSnapshot.docs) {
            const suggestion = suggestionDoc.data();
            const suggestionId = suggestionDoc.id;
            
            // Get author name
            const authorDoc = await getDoc(doc(db, 'users', suggestion.authorId));
            const authorName = authorDoc.exists() ? authorDoc.data().name : 'Usuario';
            
            // Check if current user has voted
            const hasVoted = suggestion.votes && suggestion.votes.includes(currentUser.uid);
            const voteCount = suggestion.votes ? suggestion.votes.length : 0;
            
            const suggestionCard = document.createElement('div');
            suggestionCard.className = 'suggestion-card';
            
            suggestionCard.innerHTML = `
                <div class="suggestion-header">
                    <h3>${suggestion.place}</h3>
                    <p class="suggestion-month">${suggestion.month}</p>
                </div>
                ${suggestion.imageUrl ? `<img src="${suggestion.imageUrl}" alt="${suggestion.place}" class="suggestion-image">` : ''}
                <p class="suggestion-description">${suggestion.description}</p>
                <p class="suggestion-author">Propuesto por ${authorName}</p>
                <div class="suggestion-actions">
                    <button class="btn vote-btn ${hasVoted ? 'voted' : 'btn-primary'}" 
                            onclick="toggleVote('${suggestionId}', ${hasVoted})">
                        ${hasVoted ? 'Ya votaste' : 'Votar'}
                    </button>
                    <span class="vote-count">${voteCount} ${voteCount === 1 ? 'voto' : 'votos'}</span>
                </div>
                ${suggestion.authorId === currentUser.uid ? `
                    <button class="btn btn-secondary delete-suggestion-btn" 
                            onclick="deleteSuggestion('${suggestionId}')">
                        Eliminar sugerencia
                    </button>
                ` : ''}
            `;
            
            suggestionsGrid.appendChild(suggestionCard);
        }
    } catch (error) {
        console.error('Error loading suggestions:', error);
        suggestionsGrid.innerHTML = '<p class="empty-state">Error al cargar las sugerencias</p>';
    }
}

// Toggle vote
window.toggleVote = async function(suggestionId, hasVoted) {
    try {
        const suggestionRef = doc(db, 'suggestions', suggestionId);
        
        if (hasVoted) {
            // Remove vote
            await updateDoc(suggestionRef, {
                votes: arrayRemove(currentUser.uid)
            });
        } else {
            // Add vote
            await updateDoc(suggestionRef, {
                votes: arrayUnion(currentUser.uid)
            });
            
            // Check if all group members voted
            await checkIfAllVoted(suggestionId);
        }
        
        // Reload suggestions
        await loadSuggestions();
    } catch (error) {
        console.error('Error toggling vote:', error);
        alert('Error al votar');
    }
};

// Delete suggestion
window.deleteSuggestion = async function(suggestionId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sugerencia?')) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, 'suggestions', suggestionId));
        await loadSuggestions();
    } catch (error) {
        console.error('Error deleting suggestion:', error);
        alert('Error al eliminar la sugerencia');
    }
};

// Check if all group members voted
async function checkIfAllVoted(suggestionId) {
    try {
        const suggestionDoc = await getDoc(doc(db, 'suggestions', suggestionId));
        if (!suggestionDoc.exists()) return;
        
        const suggestion = suggestionDoc.data();
        const votes = suggestion.votes ? suggestion.votes.length : 0;
        
        // Get total group members (only users with inGroup: true)
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const groupMembers = [];
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            // Users with inGroup === false are not counted, others are (default true)
            if (userData.inGroup !== false) {
                groupMembers.push(doc.id);
            }
        });
        const totalMembers = groupMembers.length;
        
        // If all members voted, auto-confirm
        if (votes >= totalMembers && totalMembers > 0) {
            await addDoc(collection(db, 'trips'), {
                place: suggestion.place,
                month: suggestion.month,
                date: new Date().toISOString().split('T')[0],
                confirmedBy: currentUser.uid,
                autoConfirmed: true,
                createdAt: new Date().toISOString()
            });
            
            await deleteDoc(doc(db, 'suggestions', suggestionId));
            await loadUpcomingTrips();
            await loadSuggestions();
        }
    } catch (error) {
        console.error('Error checking votes:', error);
    }
}

// Modal controls
const suggestModal = document.getElementById('suggestModal');
const suggestPlaceBtn = document.getElementById('suggestPlaceBtn');
const closeSuggestModal = document.getElementById('closeSuggestModal');
const cancelSuggestBtn = document.getElementById('cancelSuggestBtn');
const suggestForm = document.getElementById('suggestForm');
const placeImageFile = document.getElementById('placeImage');
const imagePreviewSuggest = document.getElementById('imagePreviewSuggest');

// Image preview for suggestions
placeImageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreviewSuggest.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            imagePreviewSuggest.classList.add('show');
        };
        reader.readAsDataURL(file);
    }
});

suggestPlaceBtn.addEventListener('click', () => {
    suggestModal.classList.add('active');
});

closeSuggestModal.addEventListener('click', () => {
    suggestModal.classList.remove('active');
    suggestForm.reset();
    imagePreviewSuggest.classList.remove('show');
    imagePreviewSuggest.innerHTML = '';
});

cancelSuggestBtn.addEventListener('click', () => {
    suggestModal.classList.remove('active');
    suggestForm.reset();
    imagePreviewSuggest.classList.remove('show');
    imagePreviewSuggest.innerHTML = '';
});

// Submit suggestion
suggestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const place = document.getElementById('placeName').value.trim();
    const description = document.getElementById('placeDescription').value.trim();
    const month = document.getElementById('placeMonth').value;
    const imageFile = document.getElementById('placeImage').files[0];
    
    try {
        let imageUrl = '';
        
        // Upload image if provided
        if (imageFile) {
            const uploadProgress = document.getElementById('uploadProgressSuggest');
            const progressFill = document.getElementById('progressFillSuggest');
            const progressText = document.getElementById('progressTextSuggest');
            uploadProgress.style.display = 'block';
            progressText.textContent = 'Subiendo: 0%';
            
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('public_id', `travelog/suggestions/${currentUser.uid}/${Date.now()}_${imageFile.name.split('.')[0]}`);
            
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = (e.loaded / e.total) * 100;
                    progressFill.style.width = progress + '%';
                    progressText.textContent = `Subiendo: ${Math.round(progress)}%`;
                }
            });
            
            xhr.addEventListener('load', async () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    imageUrl = response.secure_url;
                    
                    // Create suggestion after image upload
                    await createSuggestion(place, description, month, imageUrl);
                } else {
                    throw new Error('Error en Cloudinary');
                }
            });
            
            xhr.addEventListener('error', () => {
                console.error('Error uploading:', xhr.statusText);
                alert('Error al subir la imagen');
                uploadProgress.style.display = 'none';
            });
            
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
            xhr.send(formData);
        } else {
            // Create suggestion without image
            await createSuggestion(place, description, month, '');
        }
    } catch (error) {
        console.error('Error adding suggestion:', error);
        alert('Error al crear la sugerencia');
    }
});

// Create suggestion helper
async function createSuggestion(place, description, month, imageUrl) {
    try {
        const suggestionData = {
            place: place,
            description: description,
            month: month,
            authorId: currentUser.uid,
            votes: [currentUser.uid], // Auto-vote for own suggestion
            createdAt: new Date().toISOString()
        };
        
        if (imageUrl) {
            suggestionData.imageUrl = imageUrl;
        }
        
        await addDoc(collection(db, 'suggestions'), suggestionData);
        
        suggestForm.reset();
        imagePreviewSuggest.classList.remove('show');
        imagePreviewSuggest.innerHTML = '';
        document.getElementById('uploadProgressSuggest').style.display = 'none';
        suggestModal.classList.remove('active');
        await loadSuggestions();
    } catch (error) {
        console.error('Error creating suggestion:', error);
        alert('Error al crear la sugerencia');
    }
}

// Confirm winner modal
const confirmTripModal = document.getElementById('confirmTripModal');
const closeConfirmModal = document.getElementById('closeConfirmModal');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
const confirmTripForm = document.getElementById('confirmTripForm');
let currentWinnerId = null;
let currentWinnerPlace = null;
let currentWinnerMonth = null;

closeConfirmModal.addEventListener('click', () => {
    confirmTripModal.classList.remove('active');
    confirmTripForm.reset();
});

cancelConfirmBtn.addEventListener('click', () => {
    confirmTripModal.classList.remove('active');
    confirmTripForm.reset();
});

// Show confirm winner modal
window.confirmWinner = function(suggestionId, place, month) {
    currentWinnerId = suggestionId;
    currentWinnerPlace = place;
    currentWinnerMonth = month;
    
    document.getElementById('winnerPlaceName').textContent = `¿Confirmar "${place}" como la salida ganadora para ${month}?`;
    confirmTripModal.classList.add('active');
};

// Confirm trip
confirmTripForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tripDate = document.getElementById('tripDate').value;
    
    try {
        // Create trip
        await addDoc(collection(db, 'trips'), {
            place: currentWinnerPlace,
            month: currentWinnerMonth,
            date: tripDate,
            confirmedBy: currentUser.uid,
            createdAt: new Date().toISOString()
        });
        
        // Delete the suggestion
        await deleteDoc(doc(db, 'suggestions', currentWinnerId));
        
        confirmTripForm.reset();
        confirmTripModal.classList.remove('active');
        
        await loadUpcomingTrips();
        await loadSuggestions();
    } catch (error) {
        console.error('Error confirming trip:', error);
        alert('Error al confirmar la salida');
    }
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === suggestModal) {
        suggestModal.classList.remove('active');
    }
    if (e.target === confirmTripModal) {
        confirmTripModal.classList.remove('active');
    }
});
