import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs,
    doc,
    getDoc,
    query,
    where,
    orderBy,
    updateDoc,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let profileUserId = null;

// Get user ID from URL
const urlParams = new URLSearchParams(window.location.search);
profileUserId = urlParams.get('uid');

if (!profileUserId) {
    window.location.href = 'index.html';
}

// Share album
document.getElementById('shareAlbumBtn').addEventListener('click', async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?uid=${profileUserId}`;
    
    try {
        // Try to use Web Share API if available (mobile)
        if (navigator.share) {
            const userDoc = await getDoc(doc(db, 'users', profileUserId));
            const userName = userDoc.exists() ? userDoc.data().name : 'Usuario';
            
            await navigator.share({
                title: `Álbum de ${userName} - Travelog`,
                text: `Mira el álbum de ${userName} en Travelog`,
                url: shareUrl
            });
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(shareUrl);
            showShareNotification();
        }
    } catch (error) {
        // If share was cancelled or clipboard failed, try clipboard again
        if (error.name !== 'AbortError') {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showShareNotification();
            } catch (clipboardError) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    showShareNotification();
                } catch (e) {
                    alert('Enlace del álbum: ' + shareUrl);
                }
                document.body.removeChild(textArea);
            }
        }
    }
});

// Show share notification
function showShareNotification() {
    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.textContent = '✓ Enlace copiado al portapapeles';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Load profile and photos
async function loadProfile() {
    try {
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', profileUserId));
        
        if (!userDoc.exists()) {
            alert('Usuario no encontrado');
            window.location.href = 'index.html';
            return;
        }
        
        const userData = userDoc.data();
        document.getElementById('profileName').textContent = userData.name;
        document.getElementById('profileSubtitle').textContent = `Álbum de ${userData.name}`;
        
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
            
            const likes = photo.likes ? photo.likes.length : 0;
            const views = photo.views || 0;
            
            photoCard.innerHTML = `
                <img src="${photo.imageUrl}" alt="${photo.location || 'Foto'}">
                <div class="photo-info">
                    <p class="photo-location">${photo.location || 'Sin ubicación'}</p>
                    <p class="photo-date">${formattedDate}</p>
                    ${photo.description ? `<p class="photo-description">${photo.description}</p>` : ''}
                    <div class="photo-stats-card">
                        <span>♡ ${likes}</span>
                        <span>👁️ ${views}</span>
                    </div>
                </div>
            `;
            
            photosContainer.appendChild(photoCard);
        });
    } catch (error) {
        console.error('Error loading photos:', error);
        photosContainer.innerHTML = '<p class="empty-state">Error al cargar las fotos</p>';
    }
}

// Photo detail modal
const photoDetailModal = document.getElementById('photoDetailModal');
const closeDetailModal = document.getElementById('closeDetailModal');

closeDetailModal.addEventListener('click', () => {
    photoDetailModal.classList.remove('active');
});

function showPhotoDetail(photoId, photo) {
    document.getElementById('detailImage').src = photo.imageUrl;
    document.getElementById('detailLocation').textContent = photo.location || 'Sin ubicación';
    document.getElementById('detailDescription').textContent = photo.description || 'Sin descripción';
    
    const formattedDate = new Date(photo.date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('detailDate').textContent = formattedDate;
    
    // Increment views
    try {
        const photoRef = doc(db, 'photos', photoId);
        updateDoc(photoRef, {
            views: increment(1)
        });
    } catch (error) {
        console.error('Error incrementing views:', error);
    }
    
    photoDetailModal.classList.add('active');
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === photoDetailModal) {
        photoDetailModal.classList.remove('active');
    }
});

// Load profile on page load
loadProfile();
