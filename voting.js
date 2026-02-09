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
    arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
                    <button class="btn btn-primary confirm-winner-btn" 
                            onclick="confirmWinner('${suggestionId}', '${suggestion.place}', '${suggestion.month}')">
                        Confirmar como ganadora
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
        }
        
        // Reload suggestions
        await loadSuggestions();
    } catch (error) {
        console.error('Error toggling vote:', error);
        alert('Error al votar');
    }
};

// Modal controls
const suggestModal = document.getElementById('suggestModal');
const suggestPlaceBtn = document.getElementById('suggestPlaceBtn');
const closeSuggestModal = document.getElementById('closeSuggestModal');
const cancelSuggestBtn = document.getElementById('cancelSuggestBtn');
const suggestForm = document.getElementById('suggestForm');

suggestPlaceBtn.addEventListener('click', () => {
    suggestModal.classList.add('active');
});

closeSuggestModal.addEventListener('click', () => {
    suggestModal.classList.remove('active');
    suggestForm.reset();
});

cancelSuggestBtn.addEventListener('click', () => {
    suggestModal.classList.remove('active');
    suggestForm.reset();
});

// Submit suggestion
suggestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const place = document.getElementById('placeName').value.trim();
    const description = document.getElementById('placeDescription').value.trim();
    const month = document.getElementById('placeMonth').value;
    
    try {
        await addDoc(collection(db, 'suggestions'), {
            place: place,
            description: description,
            month: month,
            authorId: currentUser.uid,
            votes: [currentUser.uid], // Auto-vote for own suggestion
            createdAt: new Date().toISOString()
        });
        
        suggestForm.reset();
        suggestModal.classList.remove('active');
        await loadSuggestions();
    } catch (error) {
        console.error('Error adding suggestion:', error);
        alert('Error al crear la sugerencia');
    }
});

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
