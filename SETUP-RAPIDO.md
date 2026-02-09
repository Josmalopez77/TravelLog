# 🚀 GUÍA RÁPIDA - Travelog

## ⚡ Setup en 10 minutos

### 1️⃣ Firebase (3 min)

1. Crea proyecto en https://console.firebase.google.com/
2. Habilita: **Authentication** (Email/Password), **Firestore**, **Storage**
3. Copia tu configuración de Firebase

### 2️⃣ Configurar Código (2 min)

**A. Pega tu config en `firebase-config.js`:**
```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "...",
    // ... resto de la config
};
```

**B. Cambia el email de admin en estos 4 archivos:**
- `app.js` → línea 5
- `profile.js` → línea 7  
- `voting.js` → línea 5
- `admin.js` → línea 13

```javascript
const ADMIN_EMAIL = 'TU_EMAIL@gmail.com'; // ⚠️ Importante
```

### 3️⃣ Crear Usuario Admin (2 min)

En Firebase Console:
1. **Authentication** > **Users** > **Add user**
2. Email: el mismo que pusiste en ADMIN_EMAIL
3. Password: tu contraseña
4. **Add user**

Luego en **Firestore**:
1. Crear colección `users`
2. Document ID: (el UID que Firebase le dio al usuario)
3. Campos:
   - `name`: "Tu Nombre"
   - `email`: "tu-email@gmail.com" 
   - `createdAt`: "2024-02-09T12:00:00.000Z"

### 4️⃣ Reglas de Firestore (1 min)

Firestore > Rules > pega esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /photos/{photoId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /suggestions/{suggestionId} {
      allow read: if true;
      allow create, update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.authorId == request.auth.uid;
    }
    match /trips/{tripId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

### 5️⃣ Reglas de Storage (1 min)

Storage > Rules > pega esto:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{userId}/{filename} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6️⃣ Subir a GitHub Pages (1 min)

```bash
git init
git add .
git commit -m "Travelog inicial"
git remote add origin https://github.com/TU_USUARIO/travelog.git
git push -u origin main
```

En GitHub:
- Settings > Pages > Deploy from main

### 7️⃣ Autorizar Dominio

Firebase > Authentication > Settings > Authorized domains
- Agregar: `TU_USUARIO.github.io`

---

## ✅ ¡Listo para usar!

### URLs:
- **Público**: `https://TU_USUARIO.github.io/travelog/`
- **Login**: `https://TU_USUARIO.github.io/travelog/login.html`

### Crear más usuarios:
1. Login como admin
2. Clic en "Admin" en el menú
3. Llenar formulario
4. Compartir credenciales

---

## 🧪 Probar en Local

```bash
# Necesitas servidor local:
python -m http.server 8000
# o
npx serve

# Luego: http://localhost:8000
```

---

## 🎯 Cómo funciona

**Página Pública** (`index.html`)
- Sin login
- Cualquiera puede ver álbumes

**Área Privada** (requiere login)
- `app.html` → Feed de álbumes
- `profile.html` → Subir fotos
- `voting.html` → Votar lugares
- `admin.html` → Crear usuarios (solo admin)

---

## 🆘 Problemas Comunes

**"No puedo crear usuarios"**
→ Verifica que tu email coincida en los 4 archivos

**"Las fotos no se ven públicamente"**  
→ Revisa las reglas: `allow read: if true;`

**"Error de dominio no autorizado"**
→ Agrega tu URL de GitHub Pages en Firebase

---

📖 Para más detalles, lee el **README.md** completo
