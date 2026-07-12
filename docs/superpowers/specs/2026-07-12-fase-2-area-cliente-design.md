# Fase 2 — Área Cliente, Favoritos y Disclaimer: Design Doc

**Fecha:** 2026-07-12

---

## 1. Resumen

Cuatro cambios independientes que se despliegan juntos como Fase 2:

1. **Eliminar filtro de dificultad** — todos los ejercicios elegibles para cualquier usuario.
2. **SweetAlert2 disclaimer** — modal legal al entrar por primera vez.
3. **Sistema de favoritos + área cliente** — estrella en ExerciseCard, cliente area con historial + favoritos.
4. **Panel admin** — placeholder con roles `user` / `admin` en MongoDB.
5. **Expansión ejercicios** — de 50 a 90 por categoría (270 total).

---

## 2. Arquitectura

### Navegación (frontend)

```
view: 'home' | 'history' | 'client' | 'admin'

Header links:
  [logo]          → home
  [Historial]     → history (existente)
  [Área Cliente]  → client (solo si token presente)
  [Admin ⚙️]      → admin (solo si role === 'admin')
```

### Nuevos archivos

```
backend/src/
  controllers/favoritesController.ts
  routes/favoritesRoutes.ts

frontend/src/
  components/ClientArea.tsx
  components/AdminPanel.tsx
  hooks/useFavorites.ts
```

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `backend/src/models/user.model.ts` | + `role`, `favorites` |
| `backend/src/services/authService.ts` | + `role` en `TokenPayload` |
| `backend/src/controllers/authController.ts` | devuelve `role` en login/register |
| `backend/src/services/routineService.ts` | elimina llamada a `filterByDifficulty` |
| `backend/src/schemas/userProfile.schema.ts` | `experience` con `.default('intermediate')` |
| `backend/src/app.ts` | registra `/api/favorites` |
| `frontend/src/hooks/useAuth.ts` | guarda y expone `role` |
| `frontend/src/components/UserProfileForm.tsx` | elimina selector Experiencia |
| `frontend/src/components/ExerciseCard.tsx` | elimina badge dificultad, añade ⭐ |
| `frontend/src/App.tsx` | disclaimer + vistas client/admin + favorites |
| `backend/src/data/exercises.json` | 120 ejercicios nuevos (270 total) |

---

## 3. Contrato de datos

### UserDoc (MongoDB)

```typescript
interface UserDoc {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';      // default: 'user', asignado manualmente en DB
  favorites: string[];           // array de exercise IDs
  createdAt: Date;
}
```

### TokenPayload

```typescript
interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}
```

### API Favoritos

```
GET    /api/favorites            → Exercise[]      (requiere JWT)
POST   /api/favorites/:id        → { favorites: string[] }
DELETE /api/favorites/:id        → { favorites: string[] }
```

### AuthState (frontend localStorage)

```typescript
interface AuthState {
  token: string;
  email: string;
  role: 'user' | 'admin';
}
```

---

## 4. Disclaimer SweetAlert2

- Trigger: primer render si `localStorage.getItem('burnout_disclaimer_v1')` es falsy
- `allowOutsideClick: false`, `allowEscapeKey: false`
- Un único botón: **"Lo entiendo y lo acepto"**
- Al confirmar: `localStorage.setItem('burnout_disclaimer_v1', 'true')`
- No vuelve a aparecer en visitas posteriores

---

## 5. ExerciseCard: cambios

- **Eliminar:** badge `badge-difficulty--*` y objeto `DIFFICULTY_LABEL`
- **Añadir:** botón ⭐/★ (`isFavorite` prop) solo visible cuando `showFavoriteButton` es true (pasado desde App cuando hay token)
- Props nuevas: `isFavorite?: boolean`, `onToggleFavorite?: () => void`, `showFavoriteButton?: boolean`

---

## 6. Área Cliente

`ClientArea.tsx` con dos tabs:

**Tab "Mi Historial":** reutiliza `<HistoryView history gamification onBack />`

**Tab "Mis Favoritos":**
- Lista de ejercicios con estrella marcada
- Por cada favorito: nombre, músculo, última sesión (fecha, reps, peso, RPE) cruzando con `history`
- Si sin historial para ese ejercicio: "Sin datos de sesiones anteriores"

---

## 7. Panel Admin

`AdminPanel.tsx` — solo accesible si `role === 'admin'`:
- Header "Panel de Administración"
- Tabs estructurales vacíos: Usuarios / Ejercicios / Estadísticas
- Placeholder "Próximamente" en cada tab
- Diseñado para escalar en fases posteriores

---

## 8. Ejercicios: 50 → 90 por categoría

IDs nuevos:
- `tren_superior`: ex-151 a ex-190 (40 nuevos)
- `tren_inferior`: ex-251 a ex-290 (40 nuevos)
- `ambos`: ex-351 a ex-390 (40 nuevos)

Nuevas incorporaciones principales:
- `tren_superior`: dominadas, press declinado, curl martillo, fondos paralelas, face pull, extensión polea, etc.
- `tren_inferior`: sentadilla búlgara, hip thrust, Nordic curl, prensa, pistol squat, etc.
- `ambos`: burpees, box jump, mountain climbers, kettlebell swing, sprint, thruster, calistenia, etc.
