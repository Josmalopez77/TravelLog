# Travelog - Red Social de Viajes

Una hermosa red social para un grupo de amigos con salidas mensuales. Tiene una parte **pública** para que cualquiera vea los álbumes, y una parte **privada** para miembros.

## 🌟 Características

### Página Pública (Sin Login)
- Ver álbumes de todos los miembros
- Explorar fotos con descripciones
- Diseño hermoso con colores pastel

### Área de Miembros (Con Login)
- **Feed**: Ver álbumes de todos con acceso completo
- **Mi Álbum**: Subir y administrar tus fotos
- **Votaciones**: Sugerir lugares y votar por próximas salidas
- **Panel Admin**: Solo para el administrador, crear usuarios

## 📁 Estructura

```
Página Pública:
├── index.html (Homepage pública)
└── public-profile.html (Ver álbumes sin login)

Área Privada:
├── login.html (Acceso miembros)
├── app.html (Feed privado)
├── profile.html (Administrar tu álbum)
├── voting.html (Sugerencias y votaciones)
└── admin.html (Crear usuarios - solo admin)
```

## 🚀 Configuración Inicial

### 1. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un proyecto nuevo
3. Habilita **Authentication** → Email/Password
4. Habilita **Firestore Database** → Modo test
5. Habilita **Storage** → Modo test

### 2. Reglas de Firestore

Ve a Firestore > Rules y pega:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - todos pueden leer, solo tú puedes editar tu perfil
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Photos - todos pueden leer, solo el autor puede modificar
    match /photos/{photoId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // Suggestions - todos pueden leer y votar, solo autor puede eliminar
    match /suggestions/{suggestionId} {
      allow read: if true;
      allow create, update: if request.auth != null;
      allow delete: if request.auth != null && 
                      resource.data.authorId == request.auth.uid;
    }
    
    // Trips - todos pueden leer, usuarios autenticados pueden crear/editar
    match /trips/{tripId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

### 3. Reglas de Storage

Ve a Storage > Rules y pega:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Fotos - todos pueden leer, solo el dueño puede escribir
    match /photos/{userId}/{filename} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Obtener Configuración de Firebase

1. En Firebase Console, ve a **Configuración del proyecto** (⚙️)
2. En "Tus apps", haz clic en el ícono web `</>`
3. Registra tu app
4. Copia el objeto `firebaseConfig`

### 5. Configurar el Código

Abre `firebase-config.js` y reemplaza:

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};
```

### 6. ⚠️ IMPORTANTE: Configurar Email de Admin

En estos archivos, cambia `'admin@travelog.com'` por TU email:
- `app.js` (línea 5)
- `profile.js` (línea 7)
- `voting.js` (línea 5)
- `admin.js` (línea 13)

```javascript
const ADMIN_EMAIL = 'TU_EMAIL@gmail.com'; // ⚠️ Cambia esto
```

### 7. Crear el Usuario Admin

**IMPORTANTE**: Antes de desplegar, necesitas crear tu cuenta de admin manualmente:

**Opción A - En Firebase Console** (Recomendado):
1. Ve a Authentication > Users
2. Clic en "Add user"
3. Email: tu-email@gmail.com (el mismo que pusiste en ADMIN_EMAIL)
4. Password: tu contraseña
5. Clic en "Add user"

**Opción B - Temporalmente permitir registro**:
1. Usa temporalmente la versión anterior del login con registro
2. Regístrate con tu email de admin
3. Elimina el código de registro
4. Sube la versión final

Luego ve a Firestore y crea manualmente el documento del admin:
- Colección: `users`
- Document ID: (el UID que Firebase le asignó)
- Campos:
  - `name`: "Tu Nombre"
  - `email`: "tu-email@gmail.com"
  - `createdAt`: (fecha actual en ISO)

## 🌐 Desplegar en GitHub Pages

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit - Travelog"
git remote add origin https://github.com/TU_USUARIO/travelog.git
git branch -M main
git push -u origin main
```

### 2. Activar GitHub Pages

1. Repositorio > Settings > Pages
2. Source: "Deploy from a branch"
3. Branch: "main" > "/ (root)"
4. Save

Tu sitio estará en: `https://TU_USUARIO.github.io/travelog/`

### 3. Autorizar Dominio en Firebase

Firebase Console > Authentication > Settings > Authorized domains
- Agrega: `TU_USUARIO.github.io`

## 👥 Crear Nuevos Usuarios (Solo Admin)

1. Inicia sesión con tu cuenta de admin
2. Verás el enlace "Admin" en el menú
3. En el panel de admin, llena el formulario:
   - Nombre del nuevo miembro
   - Email
   - Contraseña temporal
4. Haz clic en "Crear Usuario"
5. Comparte las credenciales con el nuevo miembro

**Nota**: La creación de usuarios usa la API de Firebase. Si tienes problemas, considera usar Firebase Cloud Functions para mayor seguridad.

## 📱 Uso de la Aplicación

### Para Visitantes (Sin cuenta)
- Abre `index.html` (o tu URL de GitHub Pages)
- Explora los álbumes de todos los miembros
- Haz clic en cualquier álbum para ver las fotos

### Para Miembros
1. Haz clic en "Acceso Miembros"
2. Inicia sesión con tu email y contraseña
3. **Feed**: Ve los álbumes de todos
4. **Mi Álbum**: Sube fotos con fecha, descripción y ubicación
5. **Votaciones**: Sugiere lugares y vota
6. El que propuso puede confirmar su lugar como ganador

### Para el Admin
- Todo lo anterior, más:
- **Panel Admin**: Crear nuevas cuentas para el equipo

## 🎨 Personalización

### Cambiar Nombre
Busca y reemplaza "Travelog" en todos los archivos HTML

### Cambiar Colores
Edita `styles.css`, variables CSS (líneas 1-30):

```css
:root {
    --pastel-pink: #FFD6E8;
    --pastel-lavender: #E8D6FF;
    /* etc... */
}
```

## 🔧 Probar Localmente

No puedes simplemente abrir los archivos HTML. Necesitas un servidor local:

```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx serve

# Luego abre: http://localhost:8000
```

## ❓ Solución de Problemas

### No puedo iniciar sesión
- Verifica que Email/Password esté habilitado en Authentication
- Asegúrate de que el usuario exista en Firebase

### No puedo crear usuarios (Admin)
- Verifica que tu email coincida con ADMIN_EMAIL en todos los archivos
- Revisa la consola del navegador (F12) para ver errores

### No se ven las fotos públicamente
- Verifica las reglas de Firestore: `allow read: if true;`
- Verifica las reglas de Storage: `allow read: if true;`

### Error de dominio no autorizado
- Agrega tu dominio de GitHub Pages en Firebase Authentication > Settings

## 📊 Estructura de Datos en Firestore

### Colección: `users`
```javascript
{
  name: "Nombre del usuario",
  email: "email@ejemplo.com",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### Colección: `photos`
```javascript
{
  userId: "uid-del-usuario",
  imageUrl: "https://...",
  storagePath: "photos/uid/imagen.jpg",
  description: "Descripción de la foto",
  date: "2024-01-15",
  location: "Nombre del lugar",
  createdAt: "2024-01-15T10:30:00.000Z"
}
```

### Colección: `suggestions`
```javascript
{
  place: "Nombre del lugar",
  description: "Por qué deberíamos ir",
  month: "Marzo",
  authorId: "uid-del-autor",
  votes: ["uid1", "uid2", "uid3"],
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### Colección: `trips`
```javascript
{
  place: "Lugar confirmado",
  month: "Marzo",
  date: "2024-03-15",
  confirmedBy: "uid-del-usuario",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

## 🔐 Seguridad

Las reglas actuales están en "modo desarrollo" para facilitar el inicio. Para producción:

1. Las reglas de lectura pública (`allow read: if true`) son correctas para este caso de uso
2. Las reglas de escritura ya están protegidas (solo usuarios autenticados)
3. Para máxima seguridad, considera implementar Cloud Functions para crear usuarios

## 💡 Mejoras Futuras

- Notificaciones cuando alguien sube fotos
- Comentarios en fotos
- Sistema de "me gusta"
- Exportar álbum a PDF
- Integración con redes sociales

---

**¿Necesitas ayuda?** 
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de GitHub Pages](https://docs.github.com/pages)

Hecho con ✨ para un grupo de amigos aventureros
