import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    query,
    orderBy 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Load all users' albums (public view)
async function loadAlbums() {
    const albumsGrid = document.getElementById('albumsGrid');
    albumsGrid.innerHTML = '<div class="loading">Cargando álbumes...</div>';
    
    try {
        // Get all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        if (usersSnapshot.empty) {
            albumsGrid.innerHTML = '<p class="empty-state">No hay álbumes todavía</p>';
            return;
        }
        
        albumsGrid.innerHTML = '';
        
        // Create album card for each user
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;
            
            // Get user's photos to get a cover image
            const photosQuery = query(
                collection(db, 'photos'),
                orderBy('date', 'desc')
            );
            const photosSnapshot = await getDocs(photosQuery);
            
            // Filter photos for this user
            const userPhotos = photosSnapshot.docs.filter(doc => doc.data().userId === userId);
            const photoCount = userPhotos.length;
            
            // Get cover image (most recent photo)
            let coverImageUrl = '';
            if (userPhotos.length > 0) {
                coverImageUrl = userPhotos[0].data().imageUrl;
            }
            
            // Create album card
            const albumCard = document.createElement('a');
            albumCard.href = `public-profile.html?uid=${userId}`;
            albumCard.className = 'album-card';
            
            albumCard.innerHTML = `
                ${coverImageUrl ? 
                    `<img src="${coverImageUrl}" alt="${userData.name}" class="album-cover">` :
                    `<div class="album-cover"></div>`
                }
                <div class="album-info">
                    <h3>${userData.name}</h3>
                    <p>${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'}</p>
                </div>
            `;
            
            albumsGrid.appendChild(albumCard);
        }
    } catch (error) {
        console.error('Error loading albums:', error);
        albumsGrid.innerHTML = '<p class="empty-state">Error al cargar los álbumes</p>';
    }
}

// Load albums on page load
loadAlbums();
