# Fase 2 — Área Cliente, Favoritos y Disclaimer: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir disclaimer SweetAlert2, sistema de favoritos por usuario, área cliente con historial+favoritos, panel admin placeholder, eliminar filtro de dificultad, y expandir la BBDD a 90 ejercicios por categoría.

**Architecture:** Opción A — se extiende el `view` state existente (`'home' | 'history' | 'client' | 'admin'`). Los favoritos se persisten en MongoDB en el UserDoc. El disclaimer se controla con localStorage. Sin react-router.

**Tech Stack:** React 19 + Vite + TypeScript (frontend), Node.js + Express + TypeScript + Mongoose (backend), SweetAlert2, JWT existente.

---

## Mapa de archivos

**Crear:**
- `backend/src/controllers/favoritesController.ts`
- `backend/src/routes/favoritesRoutes.ts`
- `frontend/src/hooks/useFavorites.ts`
- `frontend/src/components/ClientArea.tsx`
- `frontend/src/components/AdminPanel.tsx`

**Modificar:**
- `backend/src/models/user.model.ts` — + `role`, `favorites`
- `backend/src/services/authService.ts` — `TokenPayload` + `role`
- `backend/src/controllers/authController.ts` — devuelve `role`
- `backend/src/services/routineService.ts` — elimina `filterByDifficulty`
- `backend/src/schemas/userProfile.schema.ts` — `experience` con default
- `backend/src/app.ts` — registra `/api/favorites`
- `backend/src/data/exercises.json` — 120 ejercicios nuevos
- `frontend/src/hooks/useAuth.ts` — guarda `role`
- `frontend/src/components/UserProfileForm.tsx` — elimina Experiencia
- `frontend/src/components/ExerciseCard.tsx` — sin badge dificultad, + estrella
- `frontend/src/App.tsx` — disclaimer + vistas + favoritos

---

## Task 1: Backend — Extender UserModel con role y favorites

**Files:**
- Modify: `backend/src/models/user.model.ts`

- [ ] **Step 1: Editar user.model.ts**

Reemplazar el archivo completo:

```typescript
import { Schema, model, Types } from 'mongoose';

export interface UserDoc {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  favorites: string[];
  createdAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    favorites: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const UserModel = model<UserDoc>('User', userSchema);
```

- [ ] **Step 2: Verificar compilación backend**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend"
npx tsc --noEmit
```

Expected: sin errores de tipo.

- [ ] **Step 3: Commit**

```bash
git add backend/src/models/user.model.ts
git commit -m "feat(backend): add role and favorites fields to UserModel"
```

---

## Task 2: Backend — Añadir role a TokenPayload y respuestas auth

**Files:**
- Modify: `backend/src/services/authService.ts`
- Modify: `backend/src/controllers/authController.ts`

- [ ] **Step 1: Actualizar TokenPayload en authService.ts**

Editar `backend/src/services/authService.ts` — cambiar la interfaz y las funciones:

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const TOKEN_TTL = '30d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no definida — la autenticación no puede funcionar sin ella');
  }
  return secret;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_TTL });
}

/** Devuelve el payload si el token es válido, o null si no lo es (nunca lanza). */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded !== 'object' || decoded === null) return null;
    const { userId, email, role } = decoded as Record<string, unknown>;
    if (typeof userId !== 'string' || typeof email !== 'string') return null;
    return { userId, email, role: role === 'admin' ? 'admin' : 'user' };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Actualizar authController.ts para incluir role**

Reemplazar `backend/src/controllers/authController.ts`:

```typescript
import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { CredentialsSchema } from '../schemas/auth.schema';
import { hashPassword, verifyPassword, signToken } from '../services/authService';

export class AuthController {
  public register = async (req: Request, res: Response): Promise<void> => {
    const result = CredentialsSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Email o contraseña inválidos (mínimo 6 caracteres)' });
      return;
    }
    const { email, password } = result.data;
    try {
      const existing = await UserModel.findOne({ email: email.toLowerCase() });
      if (existing) {
        res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
        return;
      }
      const user = await UserModel.create({
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password),
      });
      const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role });
      res.status(201).json({ token, email: user.email, role: user.role });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error interno al crear la cuenta' });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    const result = CredentialsSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Email o contraseña inválidos' });
      return;
    }
    const { email, password } = result.data;
    try {
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        res.status(401).json({ error: 'Credenciales incorrectas' });
        return;
      }
      const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role });
      res.json({ token, email: user.email, role: user.role });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno al iniciar sesión' });
    }
  };
}
```

- [ ] **Step 3: Compilar**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend"
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/authService.ts backend/src/controllers/authController.ts
git commit -m "feat(auth): include role in JWT payload and auth responses"
```

---

## Task 3: Backend — API de Favoritos

**Files:**
- Create: `backend/src/controllers/favoritesController.ts`
- Create: `backend/src/routes/favoritesRoutes.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Crear favoritesController.ts**

```typescript
// backend/src/controllers/favoritesController.ts
import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { ExerciseModel } from '../models/exercise.model';

export class FavoritesController {
  /** GET /api/favorites → devuelve array de Exercise completo */
  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await UserModel.findById(req.userId).select('favorites');
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      if (user.favorites.length === 0) {
        res.json([]);
        return;
      }
      const exercises = await ExerciseModel.find({ id: { $in: user.favorites } }).lean();
      res.json(exercises);
    } catch (error) {
      console.error('Error al obtener favoritos:', error);
      res.status(500).json({ error: 'Error interno al obtener favoritos' });
    }
  };

  /** POST /api/favorites/:exerciseId → añade al array */
  public add = async (req: Request, res: Response): Promise<void> => {
    const { exerciseId } = req.params;
    try {
      const user = await UserModel.findByIdAndUpdate(
        req.userId,
        { $addToSet: { favorites: exerciseId } },
        { new: true, select: 'favorites' }
      );
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.json({ favorites: user.favorites });
    } catch (error) {
      console.error('Error al añadir favorito:', error);
      res.status(500).json({ error: 'Error interno al añadir favorito' });
    }
  };

  /** DELETE /api/favorites/:exerciseId → elimina del array */
  public remove = async (req: Request, res: Response): Promise<void> => {
    const { exerciseId } = req.params;
    try {
      const user = await UserModel.findByIdAndUpdate(
        req.userId,
        { $pull: { favorites: exerciseId } },
        { new: true, select: 'favorites' }
      );
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.json({ favorites: user.favorites });
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
      res.status(500).json({ error: 'Error interno al eliminar favorito' });
    }
  };
}
```

- [ ] **Step 2: Crear favoritesRoutes.ts**

```typescript
// backend/src/routes/favoritesRoutes.ts
import { Router } from 'express';
import { FavoritesController } from '../controllers/favoritesController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
const ctrl = new FavoritesController();

router.use(requireAuth);
router.get('/', ctrl.getAll);
router.post('/:exerciseId', ctrl.add);
router.delete('/:exerciseId', ctrl.remove);

export default router;
```

- [ ] **Step 3: Registrar en app.ts**

Editar `backend/src/app.ts` — añadir import y `app.use`:

```typescript
import express from 'express';
import cors from 'cors';
import routineRoutes from './routes/routineRoutes';
import authRoutes from './routes/authRoutes';
import historyRoutes from './routes/historyRoutes';
import favoritesRoutes from './routes/favoritesRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/routines', routineRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/favorites', favoritesRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
```

- [ ] **Step 4: Compilar**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend"
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/favoritesController.ts \
        backend/src/routes/favoritesRoutes.ts \
        backend/src/app.ts
git commit -m "feat(backend): favorites API — GET/POST/DELETE /api/favorites"
```

---

## Task 4: Backend — Eliminar filtro de dificultad en routineService

**Files:**
- Modify: `backend/src/services/routineService.ts`
- Modify: `backend/src/schemas/userProfile.schema.ts`

- [ ] **Step 1: Eliminar filterByDifficulty en generateRoutine y rerollExercise**

En `backend/src/services/routineService.ts`, en `generateRoutine`, cambiar:

```typescript
// ANTES:
const allExercises = this.filterByEquipment(
  this.filterByDifficulty(rawExercises, profile.experience),
  profile.equipment
);

// DESPUÉS:
const allExercises = this.filterByEquipment(rawExercises, profile.equipment);
```

En `rerollExercise`, cambiar de la misma forma:

```typescript
// ANTES:
const allExercises = this.filterByEquipment(
  this.filterByDifficulty(rawExercises, profile.experience),
  profile.equipment
);

// DESPUÉS:
const allExercises = this.filterByEquipment(rawExercises, profile.equipment);
```

El método privado `filterByDifficulty` puede quedarse en el archivo (no eliminar — sigue siendo útil para tests), simplemente deja de llamarse.

- [ ] **Step 2: Hacer experience opcional con default en el schema Zod**

En `backend/src/schemas/userProfile.schema.ts`, cambiar la línea de `experience`:

```typescript
// ANTES:
experience: z.enum(['beginner', 'intermediate', 'advanced']),

// DESPUÉS:
experience: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
```

- [ ] **Step 3: Compilar y pasar tests**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend"
npx tsc --noEmit
npx vitest run
```

Expected: compilación OK, tests pasan (los tests del routineService ya no filtran por dificultad).

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/routineService.ts \
        backend/src/schemas/userProfile.schema.ts
git commit -m "feat(backend): remove difficulty filter — all exercises eligible for all users"
```

---

## Task 5: Frontend — Instalar SweetAlert2

**Files:**
- Modify: `frontend/package.json` (via npm install)

- [ ] **Step 1: Instalar**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend"
npm install sweetalert2
```

Expected: `sweetalert2` aparece en `dependencies` de `package.json`.

- [ ] **Step 2: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): install sweetalert2"
```

---

## Task 6: Frontend — Disclaimer SweetAlert2 en App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Añadir import y useEffect del disclaimer en App.tsx**

Añadir el import de Swal al inicio del archivo (después de los imports existentes):

```typescript
import Swal from 'sweetalert2';
```

Añadir este `useEffect` dentro de `function App()`, antes del return, justo después de los hooks existentes:

```typescript
useEffect(() => {
  if (!localStorage.getItem('burnout_disclaimer_v1')) {
    Swal.fire({
      title: '⚠️ Aviso importante',
      html: `
        <p style="text-align:left;line-height:1.6">
          <strong>BurnOut</strong> es una herramienta de apoyo y <strong>no sustituye el trabajo
          de un entrenador personal certificado</strong>.<br><br>
          Utiliza esta aplicación bajo tu propia responsabilidad. Los desarrolladores de BurnOut
          quedan exentos de cualquier responsabilidad derivada del uso de las rutinas generadas.<br><br>
          Consulta a un profesional antes de iniciar cualquier programa de entrenamiento,
          especialmente si tienes lesiones o condiciones médicas.
        </p>
      `,
      confirmButtonText: 'Lo entiendo y lo acepto',
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonColor: '#7c3aed',
      background: '#1a1a2e',
      color: '#e2e8f0',
    }).then(() => {
      localStorage.setItem('burnout_disclaimer_v1', 'true');
    });
  }
}, []);
```

- [ ] **Step 2: Verificar compilación frontend**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend"
npx tsc -b --noEmit
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): SweetAlert2 legal disclaimer on first visit"
```

---

## Task 7: Frontend — Actualizar useAuth con role

**Files:**
- Modify: `frontend/src/hooks/useAuth.ts`

- [ ] **Step 1: Reemplazar useAuth.ts**

```typescript
import { useCallback, useState } from 'react';
import { API_ROOT } from '../lib/api';

const AUTH_KEY = 'fit_poke_auth_v1';

interface AuthState {
  token: string;
  email: string;
  role: 'user' | 'admin';
}

function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed.token !== 'string' || typeof parsed.email !== 'string') return null;
    return { token: parsed.token, email: parsed.email, role: parsed.role === 'admin' ? 'admin' : 'user' };
  } catch {
    return null;
  }
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const authenticate = useCallback(async (mode: 'login' | 'register', email: string, password: string): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_ROOT}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAuthError(data.error ?? 'Error de autenticación');
        return false;
      }
      const next: AuthState = {
        token: data.token,
        email: data.email,
        role: data.role === 'admin' ? 'admin' : 'user',
      };
      setAuth(next);
      localStorage.setItem(AUTH_KEY, JSON.stringify(next));
      return true;
    } catch {
      setAuthError('No se pudo conectar con el servidor');
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = useCallback((email: string, password: string) => authenticate('login', email, password), [authenticate]);
  const register = useCallback((email: string, password: string) => authenticate('register', email, password), [authenticate]);

  const logout = useCallback(() => {
    setAuth(null);
    setAuthError(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  return {
    token: auth?.token ?? null,
    email: auth?.email ?? null,
    role: auth?.role ?? 'user',
    authLoading,
    authError,
    login,
    register,
    logout,
  };
}
```

- [ ] **Step 2: Verificar compilación**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend"
npx tsc -b --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useAuth.ts
git commit -m "feat(frontend): expose role from useAuth hook"
```

---

## Task 8: Frontend — useFavorites hook

**Files:**
- Create: `frontend/src/hooks/useFavorites.ts`

- [ ] **Step 1: Crear useFavorites.ts**

```typescript
import { useCallback, useEffect, useState } from 'react';
import { API_ROOT } from '../lib/api';
import type { Exercise } from '../types';

export function useFavorites(token: string | null) {
  const [favoriteExercises, setFavoriteExercises] = useState<Exercise[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    if (!token) {
      setFavoriteExercises([]);
      setFavoriteIds(new Set());
      return;
    }
    try {
      const res = await fetch(`${API_ROOT}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: Exercise[] = await res.json();
      setFavoriteExercises(data);
      setFavoriteIds(new Set(data.map(e => e.id)));
    } catch {
      // silently fail — favoritos son no-críticos
    }
  }, [token]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (exerciseId: string) => {
    if (!token) return;
    const isFav = favoriteIds.has(exerciseId);
    const method = isFav ? 'DELETE' : 'POST';

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(exerciseId); else next.add(exerciseId);
      return next;
    });

    try {
      await fetch(`${API_ROOT}/favorites/${exerciseId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh completo para sincronizar ejercicios completos
      await fetchFavorites();
    } catch {
      // Revert optimistic
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (isFav) next.add(exerciseId); else next.delete(exerciseId);
        return next;
      });
    }
  }, [token, favoriteIds, fetchFavorites]);

  return { favoriteExercises, favoriteIds, toggleFavorite };
}
```

- [ ] **Step 2: Verificar compilación**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend"
npx tsc -b --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useFavorites.ts
git commit -m "feat(frontend): useFavorites hook — fetch/toggle favorites via API"
```

---

## Task 9: Frontend — Quitar selector Experiencia de UserProfileForm

**Files:**
- Modify: `frontend/src/components/UserProfileForm.tsx`

- [ ] **Step 1: Editar UserProfileForm.tsx**

Eliminar el `useState` de `experience` y el bloque JSX del selector.

Cambiar el estado inicial y los imports:

```typescript
import React, { useState } from 'react';
import type { UserProfile, Sex, EquipmentCategory } from '../types';
// Eliminar Difficulty del import
```

Eliminar la línea:
```typescript
const [experience, setExperience] = useState<Difficulty>('intermediate');
```

En `handleSubmit`, hardcodear `experience`:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  onSubmit({
    weightKg: Number(weightKg),
    heightCm: Number(heightCm),
    age: Number(age),
    sex,
    experience: 'intermediate',
    split,
    goal,
    equipment,
  });
};
```

Eliminar el bloque JSX del selector de Experiencia (las líneas del `<select>` de experience dentro del grid de Edad/Experiencia). El grid de 2 columnas se queda solo con el campo Edad:

```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
  <div className="input-group">
    <label htmlFor="age">Edad (años)</label>
    <input
      id="age"
      type="number"
      min="12"
      max="100"
      className="form-input"
      value={age}
      onChange={(e) => setAge(e.target.value)}
      required
    />
  </div>
</div>
```

- [ ] **Step 2: Compilar**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend"
npx tsc -b --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/UserProfileForm.tsx
git commit -m "feat(frontend): remove difficulty selector — all exercises eligible"
```

---

## Task 10: Frontend — Actualizar ExerciseCard (sin difficulty badge, con estrella)

**Files:**
- Modify: `frontend/src/components/ExerciseCard.tsx`

- [ ] **Step 1: Añadir props nuevas y eliminar difficulty badge**

Cambiar la interfaz de props:

```typescript
interface ExerciseCardProps {
  item: WorkoutExercise;
  onReroll: (exerciseId: string, targetMuscle: string) => void;
  onUpdateSet: (exerciseId: string, setIndex: number, updatedFields: Partial<RoutineSet>) => void;
  onStartRest: (seconds: number) => void;
  isRerolling: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (exerciseId: string) => void;
  showFavoriteButton?: boolean;
}
```

Eliminar el objeto `DIFFICULTY_LABEL` completo.

Actualizar la desestructuración en el componente:

```typescript
export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  item,
  onReroll,
  onUpdateSet,
  onStartRest,
  isRerolling,
  isFavorite = false,
  onToggleFavorite,
  showFavoriteButton = false,
}) => {
```

En la sección de badges (`exercise-card__badges`), eliminar el badge de dificultad:

```tsx
<div className="exercise-card__badges">
  <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }}>
    {exercise.target_muscle}
  </span>
  {exercise.equipment === 'none' && (
    <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }} title="No requiere material de gimnasio">
      Sin material
    </span>
  )}
  {item.progressionDirection && (
    // ... progresión badge existente, no tocar
  )}
</div>
```

Añadir botón de favorito en el header de la card, junto al botón de reroll. En el bloque `exercise-card__actions` (donde está el botón de reroll), añadir el botón estrella:

```tsx
<div className="exercise-card__actions">
  {showFavoriteButton && (
    <button
      className="btn btn-secondary"
      style={{ padding: '0.4rem 0.7rem', fontSize: '1rem' }}
      onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(exercise.id); }}
      title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    >
      {isFavorite ? '⭐' : '☆'}
    </button>
  )}
  <button
    className="btn btn-secondary"
    style={{ padding: '0.4rem 0.7rem', fontSize: '0.75rem' }}
    onClick={(e) => { e.stopPropagation(); onReroll(exercise.id, exercise.target_muscle); }}
    disabled={isRerolling}
    title="Cambiar ejercicio"
  >
    {isRerolling ? '...' : '🔀'}
  </button>
</div>
```

**Nota:** El botón de reroll ya existe en el archivo; busca su estructura exacta y añade el botón estrella antes de él.

- [ ] **Step 2: Compilar**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend"
npx tsc -b --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ExerciseCard.tsx
git commit -m "feat(frontend): remove difficulty badge from ExerciseCard, add favorite star button"
```

---

## Task 11: Frontend — ClientArea component

**Files:**
- Create: `frontend/src/components/ClientArea.tsx`

- [ ] **Step 1: Crear ClientArea.tsx**

```typescript
import React, { useMemo, useState } from 'react';
import type { WorkoutLog, Exercise } from '../types';
import type { GamificationState } from '../lib/gamification';
import { HistoryView } from './HistoryView';

interface ClientAreaProps {
  email: string;
  history: WorkoutLog[];
  gamification: GamificationState;
  favoriteExercises: Exercise[];
  onBack: () => void;
}

type ClientTab = 'historial' | 'favoritos';

export const ClientArea: React.FC<ClientAreaProps> = ({
  email,
  history,
  gamification,
  favoriteExercises,
  onBack,
}) => {
  const [tab, setTab] = useState<ClientTab>('historial');

  const lastSessionByExercise = useMemo(() => {
    const map = new Map<string, { date: string; sets: { weightKg: number; reps: number; rpe: number }[] }>();
    for (const workout of [...history].reverse()) {
      for (const ex of workout.exercises) {
        if (!map.has(ex.exerciseId)) {
          map.set(ex.exerciseId, { date: workout.date, sets: ex.sets });
        }
      }
    }
    return map;
  }, [history]);

  return (
    <div className="fade-in">
      <div className="glass" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: '0.2rem' }}>
              Área Cliente
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{email}</p>
          </div>
          <button className="btn btn-secondary" onClick={onBack} style={{ fontSize: '0.85rem' }}>
            ← Volver
          </button>
        </div>

        <div className="pill-selector" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '0' }}>
          <div
            className={`pill-option ${tab === 'historial' ? 'active' : ''}`}
            onClick={() => setTab('historial')}
            style={{ fontSize: '0.85rem' }}
          >
            📈 Mi Historial
          </div>
          <div
            className={`pill-option ${tab === 'favoritos' ? 'active' : ''}`}
            onClick={() => setTab('favoritos')}
            style={{ fontSize: '0.85rem' }}
          >
            ⭐ Mis Favoritos
          </div>
        </div>
      </div>

      {tab === 'historial' && (
        <HistoryView history={history} gamification={gamification} onBack={onBack} />
      )}

      {tab === 'favoritos' && (
        <div>
          {favoriteExercises.length === 0 ? (
            <div className="glass fade-in" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>☆</p>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Aún no tienes favoritos. Pulsa ⭐ en cualquier ejercicio durante el entrenamiento.
              </p>
            </div>
          ) : (
            favoriteExercises.map(ex => {
              const last = lastSessionByExercise.get(ex.id);
              return (
                <div
                  key={ex.id}
                  className="glass fade-in"
                  style={{ padding: '1rem 1.25rem', marginBottom: '1rem', borderRadius: 'var(--radius-lg)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>
                        ⭐ {ex.name}
                      </div>
                      <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }}>
                        {ex.target_muscle}
                      </span>
                    </div>
                  </div>
                  {last ? (
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                        Última sesión: {new Date(last.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {last.sets.map((s, i) => (
                          <div
                            key={i}
                            className="glass"
                            style={{ padding: '0.4rem 0.7rem', borderRadius: '0.5rem', fontSize: '0.75rem', textAlign: 'center' }}
                          >
                            <div style={{ fontWeight: 600 }}>Serie {i + 1}</div>
                            <div>{s.weightKg > 0 ? `${s.weightKg} kg` : 'Autocarga'} × {s.reps} reps</div>
                            {s.rpe > 0 && <div style={{ color: 'var(--color-text-muted)' }}>RPE {s.rpe}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                      Sin datos de sesiones anteriores
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Compilar**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend"
npx tsc -b --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ClientArea.tsx
git commit -m "feat(frontend): ClientArea component with Historial and Favoritos tabs"
```

---

## Task 12: Frontend — AdminPanel component

**Files:**
- Create: `frontend/src/components/AdminPanel.tsx`

- [ ] **Step 1: Crear AdminPanel.tsx**

```typescript
import React, { useState } from 'react';

interface AdminPanelProps {
  email: string;
  onBack: () => void;
}

type AdminTab = 'usuarios' | 'ejercicios' | 'estadisticas';

export const AdminPanel: React.FC<AdminPanelProps> = ({ email, onBack }) => {
  const [tab, setTab] = useState<AdminTab>('usuarios');

  return (
    <div className="fade-in">
      <div className="glass" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: '0.2rem' }}>
              ⚙️ Panel de Administración
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{email}</p>
          </div>
          <button className="btn btn-secondary" onClick={onBack} style={{ fontSize: '0.85rem' }}>
            ← Volver
          </button>
        </div>

        <div className="pill-selector" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '0' }}>
          <div
            className={`pill-option ${tab === 'usuarios' ? 'active' : ''}`}
            onClick={() => setTab('usuarios')}
            style={{ fontSize: '0.75rem' }}
          >
            👥 Usuarios
          </div>
          <div
            className={`pill-option ${tab === 'ejercicios' ? 'active' : ''}`}
            onClick={() => setTab('ejercicios')}
            style={{ fontSize: '0.75rem' }}
          >
            🏋️ Ejercicios
          </div>
          <div
            className={`pill-option ${tab === 'estadisticas' ? 'active' : ''}`}
            onClick={() => setTab('estadisticas')}
            style={{ fontSize: '0.75rem' }}
          >
            📊 Stats
          </div>
        </div>
      </div>

      <div className="glass fade-in" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚧</p>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Próximamente</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Esta sección se habilitará en próximas versiones de BurnOut.
        </p>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Compilar**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend"
npx tsc -b --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AdminPanel.tsx
git commit -m "feat(frontend): AdminPanel placeholder with tab structure"
```

---

## Task 13: Frontend — Actualizar App.tsx (vistas + favoritos + nav)

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Añadir imports nuevos**

Al principio de `App.tsx`, añadir:

```typescript
import { ClientArea } from './components/ClientArea';
import { AdminPanel } from './components/AdminPanel';
import { useFavorites } from './hooks/useFavorites';
```

- [ ] **Step 2: Ampliar el tipo de view y añadir useFavorites**

Cambiar el estado `view`:

```typescript
const [view, setView] = useState<'home' | 'history' | 'client' | 'admin'>('home');
```

Añadir el hook (junto a los demás hooks, después de `useAuth`):

```typescript
const { favoriteExercises, favoriteIds, toggleFavorite } = useFavorites(token);
```

Actualizar el destructuring de `useAuth` para incluir `role`:

```typescript
const { token, email, role, authLoading, authError, login, register, logout } = useAuth();
```

- [ ] **Step 3: Actualizar el header — añadir links de navegación**

Dentro del `<header className="app-header fade-in">`, después del bloque `.header-badges`, añadir links de navegación:

```tsx
<nav style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
  {token && (
    <button
      className="btn btn-secondary"
      style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
      onClick={() => setView('client')}
    >
      Área Cliente
    </button>
  )}
  {token && role === 'admin' && (
    <button
      className="btn btn-secondary"
      style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
      onClick={() => setView('admin')}
    >
      ⚙️ Admin
    </button>
  )}
</nav>
```

- [ ] **Step 4: Pasar props favorito a ExerciseCard**

En el bloque donde se renderizan las `<ExerciseCard />` (dentro del workout activo), añadir las props:

```tsx
<ExerciseCard
  key={item.exercise.id}
  item={item}
  onReroll={handleRerollExercise}
  onUpdateSet={handleUpdateSet}
  onStartRest={handleStartRest}
  isRerolling={rerollingId === item.exercise.id}
  showFavoriteButton={!!token}
  isFavorite={favoriteIds.has(item.exercise.id)}
  onToggleFavorite={toggleFavorite}
/>
```

- [ ] **Step 5: Añadir vistas 'client' y 'admin' al render condicional**

Después del bloque `{!loading && !activeRoutine && !workoutSummary && view === 'history' && ...}`, añadir:

```tsx
{/* Client area */}
{!loading && !activeRoutine && !workoutSummary && view === 'client' && email && (
  <ClientArea
    email={email}
    history={history}
    gamification={gamification}
    favoriteExercises={favoriteExercises}
    onBack={() => setView('home')}
  />
)}

{/* Admin panel */}
{!loading && !activeRoutine && !workoutSummary && view === 'admin' && role === 'admin' && email && (
  <AdminPanel email={email} onBack={() => setView('home')} />
)}
```

- [ ] **Step 6: Compilar y correr tests**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend"
npx tsc -b --noEmit
npx vitest run
```

Expected: compilación OK, tests pasan.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): wire ClientArea, AdminPanel, favorites and nav links in App.tsx"
```

---

## Task 14: Expandir exercises.json a 90 por categoría

**Files:**
- Modify: `backend/src/data/exercises.json`

- [ ] **Step 1: Añadir 40 ejercicios nuevos a tren_superior (ex-151 a ex-190)**

Abrir `backend/src/data/exercises.json` y añadir los siguientes objetos al array (después del último ejercicio `tren_superior` existente, antes de los `tren_inferior`):

```json
{ "id": "ex-151", "name": "Press Declinado con Barra", "target_muscle": "Pecho", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Banco declinado a -15°. Barra desciende al pecho bajo (esternón), empuja con control. Activa porción inferior del pectoral.", "weight_factor": 1.1, "equipment": "gym" },
{ "id": "ex-152", "name": "Aperturas con Mancuernas en Banco Plano", "target_muscle": "Pecho", "split_category": "tren_superior", "difficulty": "beginner", "description": "Mancuernas extendidas sobre el pecho, baja en arco manteniendo leve flexión de codo, sube contrayendo pectoral.", "weight_factor": 0.4, "equipment": "gym" },
{ "id": "ex-153", "name": "Press de Pecho en Polea Alta", "target_muscle": "Pecho", "split_category": "tren_superior", "difficulty": "beginner", "description": "De pie entre dos poleas altas, lleva las manos hacia abajo y al centro cruzándolas levemente. Constante tensión en el pectoral.", "weight_factor": 0.35, "equipment": "gym" },
{ "id": "ex-154", "name": "Pullover con Mancuerna", "target_muscle": "Pecho", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Tumbado transversalmente en banco, mancuerna sobre el pecho. Baja el peso detrás de la cabeza manteniendo codos semiflexionados.", "weight_factor": 0.45, "equipment": "gym" },
{ "id": "ex-155", "name": "Flexiones Diamante", "target_muscle": "Pecho", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Manos juntas formando un rombo bajo el esternón. Baja lentamente y sube sin separar las manos. Mayor activación del pecho interno y tríceps.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-156", "name": "Flexiones Arqueras", "target_muscle": "Pecho", "split_category": "tren_superior", "difficulty": "advanced", "description": "Una mano cerca del pecho, la otra extendida lateralmente. Baja el cuerpo hacia el lado de la mano flexionada. Alterna lados.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-157", "name": "Flexiones Inclinadas con Pies en Silla", "target_muscle": "Pecho", "split_category": "tren_superior", "difficulty": "beginner", "description": "Pies elevados en silla o sofá, manos en el suelo. Trabaja la porción superior del pecho y los hombros anteriores.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-158", "name": "Dominadas Pronadas (Pull-up)", "target_muscle": "Espalda", "split_category": "tren_superior", "difficulty": "advanced", "description": "Agarre pronado (palmas al frente) a la anchura de hombros. Tira del cuerpo hasta que la barbilla supere la barra. Baja con control.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-159", "name": "Jalón al Pecho Agarre Estrecho", "target_muscle": "Espalda", "split_category": "tren_superior", "difficulty": "beginner", "description": "En polea alta con agarre estrecho neutro. Tira hacia el pecho manteniendo el torso ligeramente reclinado. Activa el dorsal bajo.", "weight_factor": 0.5, "equipment": "gym" },
{ "id": "ex-160", "name": "Remo con Mancuerna a Una Mano", "target_muscle": "Espalda", "split_category": "tren_superior", "difficulty": "beginner", "description": "Rodilla y mano apoyadas en banco. Tira la mancuerna hacia la cadera retrayendo la escápula. Codo cerca del cuerpo.", "weight_factor": 0.45, "equipment": "gym" },
{ "id": "ex-161", "name": "Face Pull en Polea", "target_muscle": "Hombros", "split_category": "tren_superior", "difficulty": "beginner", "description": "Polea alta con cuerda. Tira hacia la cara separando las manos al final. Activa deltoides posterior y manguito rotador.", "weight_factor": 0.25, "equipment": "gym" },
{ "id": "ex-162", "name": "Remo en Polea Baja Sentado", "target_muscle": "Espalda", "split_category": "tren_superior", "difficulty": "beginner", "description": "Sentado frente a polea baja, pies en plataforma, rodillas levemente flexionadas. Tira hacia el ombligo retrayendo escápulas.", "weight_factor": 0.5, "equipment": "gym" },
{ "id": "ex-163", "name": "Remo Invertido en Barra (Supino)", "target_muscle": "Espalda", "split_category": "tren_superior", "difficulty": "beginner", "description": "Tumbado bajo barra fija a altura de cadera, agarre supino. Tira del pecho hacia la barra retrayendo escápulas. Cuerpo en plancha.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-164", "name": "Superman en el Suelo", "target_muscle": "Espalda", "split_category": "tren_superior", "difficulty": "beginner", "description": "Boca abajo en el suelo. Eleva simultáneamente brazos y piernas contrayendo la espalda baja y glúteos. Mantén 2 segundos arriba.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-165", "name": "Elevación Lateral con Mancuernas", "target_muscle": "Hombros", "split_category": "tren_superior", "difficulty": "beginner", "description": "De pie, mancuernas a los costados. Eleva los brazos lateralmente hasta la altura del hombro manteniendo leve flexión de codo.", "weight_factor": 0.15, "equipment": "gym" },
{ "id": "ex-166", "name": "Elevación Frontal con Mancuerna Alternada", "target_muscle": "Hombros", "split_category": "tren_superior", "difficulty": "beginner", "description": "De pie, eleva una mancuerna al frente hasta la altura del hombro con el brazo casi extendido. Alterna brazos de forma controlada.", "weight_factor": 0.15, "equipment": "gym" },
{ "id": "ex-167", "name": "Vuelo Posterior en Banco Inclinado", "target_muscle": "Hombros", "split_category": "tren_superior", "difficulty": "beginner", "description": "Tumbado boca abajo en banco a 30°, mancuernas colgando. Eleva los brazos hacia atrás y a los lados activando el deltoides posterior.", "weight_factor": 0.12, "equipment": "gym" },
{ "id": "ex-168", "name": "Press Arnold con Mancuernas", "target_muscle": "Hombros", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Comienza con mancuernas frente al pecho, palmas hacia ti. Al presionar, rota las muñecas hacia afuera. Trabaja los tres haces del deltoides.", "weight_factor": 0.3, "equipment": "gym" },
{ "id": "ex-169", "name": "Remo al Cuello con Barra (Upright Row)", "target_muscle": "Hombros", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Agarre estrecho en barra, tira hacia arriba hasta la altura del mentón llevando los codos por encima de las muñecas.", "weight_factor": 0.3, "equipment": "gym" },
{ "id": "ex-170", "name": "Flexión en Pica (Pike Push-up)", "target_muscle": "Hombros", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Caderas elevadas en V invertida, manos en el suelo. Dobla los codos llevando la cabeza entre las manos y empuja. Simula un press militar.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-171", "name": "Plancha Lateral con Rotación de Brazo", "target_muscle": "Hombros", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Desde plancha lateral, rota el brazo libre describiendo un arco hacia el techo y luego hacia el suelo pasando bajo el cuerpo.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-172", "name": "Curl de Concentración con Mancuerna", "target_muscle": "Bíceps", "split_category": "tren_superior", "difficulty": "beginner", "description": "Sentado, codo apoyado en la cara interna del muslo. Flexiona el codo llevando la mancuerna al hombro. Máximo pico de bíceps.", "weight_factor": 0.15, "equipment": "gym" },
{ "id": "ex-173", "name": "Curl en Polea Baja con Barra", "target_muscle": "Bíceps", "split_category": "tren_superior", "difficulty": "beginner", "description": "De pie frente a polea baja, barra corta. Flexiona los codos manteniendo los codos pegados al cuerpo. Tensión constante en el bíceps.", "weight_factor": 0.15, "equipment": "gym" },
{ "id": "ex-174", "name": "Curl Inclinado en Banco con Mancuernas", "target_muscle": "Bíceps", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Banco a 45-60°, brazos colgando atrás del torso. Flexiona los codos sin mover los hombros. Máximo estiramiento del bíceps.", "weight_factor": 0.12, "equipment": "gym" },
{ "id": "ex-175", "name": "Curl Martillo con Mancuernas", "target_muscle": "Bíceps", "split_category": "tren_superior", "difficulty": "beginner", "description": "Agarre neutro (palmas enfrentadas). Flexiona los codos llevando la mancuerna al hombro. Activa el bíceps braquial y braquiorradial.", "weight_factor": 0.17, "equipment": "gym" },
{ "id": "ex-176", "name": "Curl Araña en Banco Scott", "target_muscle": "Bíceps", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Pecho apoyado en la cara vertical del banco Scott, brazos colgando. Flexiona los codos con mancuernas o barra EZ. Gran aislamiento.", "weight_factor": 0.13, "equipment": "gym" },
{ "id": "ex-177", "name": "Dominadas Supinas (Chin-up)", "target_muscle": "Bíceps", "split_category": "tren_superior", "difficulty": "advanced", "description": "Agarre supino (palmas hacia ti) a la anchura de los hombros. Tira hasta superar la barra con la barbilla. Mayor activación del bíceps.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-178", "name": "Curl con Banda Elástica", "target_muscle": "Bíceps", "split_category": "tren_superior", "difficulty": "beginner", "description": "De pie sobre la banda, extremos en manos. Flexiona los codos como un curl convencional. Resistencia progresiva al subir.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-179", "name": "Press Francés con Barra EZ", "target_muscle": "Tríceps", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Tumbado, barra EZ sobre la frente. Dobla los codos llevando la barra a la frente y empuja de vuelta. Codos perpendiculares al suelo.", "weight_factor": 0.2, "equipment": "gym" },
{ "id": "ex-180", "name": "Extensión de Tríceps en Polea Alta (Cuerda)", "target_muscle": "Tríceps", "split_category": "tren_superior", "difficulty": "beginner", "description": "De pie frente a polea alta con cuerda. Codos pegados al torso, extiende los antebrazos hacia abajo separando los extremos de la cuerda.", "weight_factor": 0.18, "equipment": "gym" },
{ "id": "ex-181", "name": "Fondos en Paralelas", "target_muscle": "Tríceps", "split_category": "tren_superior", "difficulty": "advanced", "description": "En paralelas, cuerpo erguido para aislar tríceps. Dobla los codos hasta 90° y empuja sin balanceo. Torso vertical durante todo el movimiento.", "weight_factor": 0, "equipment": "gym" },
{ "id": "ex-182", "name": "Press Cerrado en Banco Plano (Close Grip)", "target_muscle": "Tríceps", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Barra con agarre estrecho (25-30cm). Baja al pecho con codos cerca del cuerpo. Empuja bloqueando codos al final. Principal compuesto de tríceps.", "weight_factor": 0.8, "equipment": "gym" },
{ "id": "ex-183", "name": "Patada de Tríceps con Mancuerna", "target_muscle": "Tríceps", "split_category": "tren_superior", "difficulty": "beginner", "description": "Torso inclinado, codo a 90°. Extiende el antebrazo hacia atrás hasta alinear el brazo. Contrae el tríceps en la extensión completa.", "weight_factor": 0.12, "equipment": "gym" },
{ "id": "ex-184", "name": "Fondos entre Sillas", "target_muscle": "Tríceps", "split_category": "tren_superior", "difficulty": "beginner", "description": "Manos en el borde de una silla detrás del cuerpo, piernas extendidas. Baja flexionando los codos y sube extendiendo. Sin balanceo.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-185", "name": "Extensión de Tríceps en el Suelo", "target_muscle": "Tríceps", "split_category": "tren_superior", "difficulty": "beginner", "description": "En posición de plancha, dobla los codos llevando la frente al suelo y sube extendiendo. Solo se mueven los antebrazos. Aísla el tríceps.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-186", "name": "Dominadas con Agarre Neutro", "target_muscle": "Espalda", "split_category": "tren_superior", "difficulty": "advanced", "description": "Agarre neutro (palmas enfrentadas) en barras paralelas. Tira del cuerpo hacia arriba hasta superar las barras. Menor estrés en los hombros.", "weight_factor": 0, "equipment": "gym" },
{ "id": "ex-187", "name": "Remo en Máquina T-Bar", "target_muscle": "Espalda", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Torso inclinado sobre la palanca. Agarra las asas y tira hacia el pecho retrayendo escápulas. Gran sobrecarga para el dorsal y romboides.", "weight_factor": 0.6, "equipment": "gym" },
{ "id": "ex-188", "name": "Curl Predicador con Mancuerna", "target_muscle": "Bíceps", "split_category": "tren_superior", "difficulty": "intermediate", "description": "Brazo apoyado en la almohadilla del banco Scott en ángulo. Flexiona lentamente. El apoyo elimina el balanceo para máximo aislamiento.", "weight_factor": 0.13, "equipment": "gym" },
{ "id": "ex-189", "name": "Elevación Lateral en Máquina", "target_muscle": "Hombros", "split_category": "tren_superior", "difficulty": "beginner", "description": "Sentado en máquina de vuelos laterales. Codos en almohadillas, eleva hasta la horizontal. Tensión constante en el deltoides lateral.", "weight_factor": 0.15, "equipment": "gym" },
{ "id": "ex-190", "name": "Remo Unilateral en Polea", "target_muscle": "Espalda", "split_category": "tren_superior", "difficulty": "beginner", "description": "De pie frente a polea baja con asa de un brazo. Tira hacia la cadera con rotación leve del torso. Ideal para corrección de asimetrías.", "weight_factor": 0.4, "equipment": "gym" }
```

- [ ] **Step 2: Añadir 40 ejercicios nuevos a tren_inferior (ex-251 a ex-290)**

```json
{ "id": "ex-251", "name": "Sentadilla Frontal con Barra", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "advanced", "description": "Barra apoyada en los deltoides frontales, codos altos. Desciende con el torso erguido hasta superar 90° de flexión de rodilla.", "weight_factor": 0.65, "equipment": "gym" },
{ "id": "ex-252", "name": "Sentadilla Goblet con Kettlebell", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Kettlebell sostenida a la altura del pecho con ambas manos. Desciende profundamente con el torso recto. Perfecta para mejorar la técnica.", "weight_factor": 0.3, "equipment": "gym" },
{ "id": "ex-253", "name": "Prensa de Piernas 45°", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Pies en plataforma a la anchura de caderas. Baja la plataforma hasta 90° de rodilla y empuja sin bloquear completamente las rodillas.", "weight_factor": 1.2, "equipment": "gym" },
{ "id": "ex-254", "name": "Extensión de Cuádriceps en Máquina", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Sentado en máquina, tobillos bajo el rodillo. Extiende las rodillas hasta la horizontal contrayendo el cuádriceps. Baja lentamente.", "weight_factor": 0.4, "equipment": "gym" },
{ "id": "ex-255", "name": "Step-up con Mancuernas", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Con mancuernas en mano, sube a un banco o cajón empujando con el talón delantero. Baja controlando el descenso. Alterna piernas.", "weight_factor": 0.2, "equipment": "gym" },
{ "id": "ex-256", "name": "Hack Squat en Máquina", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Espalda apoyada en la plataforma inclinada. Pies adelantados a la anchura de hombros. Desciende hasta 90° y empuja. Foco en cuádriceps.", "weight_factor": 1.0, "equipment": "gym" },
{ "id": "ex-257", "name": "Sentadilla Búlgara con Peso Corporal", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Pie trasero elevado en silla o banco. Desciende la rodilla delantera hasta casi el suelo manteniendo el torso erguido. Alterna piernas.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-258", "name": "Sentadilla Pistola Asistida", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Asistido por una pared o TRX, desciende sobre una sola pierna con la otra extendida al frente. Progresión hacia el pistol squat completo.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-259", "name": "Saltos al Cajón (Box Jump)", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "De pie frente a un cajón. Impulsión con ambos pies, aterriza suavemente con los dos pies en el cajón con rodillas semiflexionadas.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-260", "name": "Sentadilla con Salto (Jump Squat)", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Desciende a una sentadilla y explota hacia arriba saltando al máximo. Aterriza suavemente absorbiendo con las rodillas. Potencia explosiva.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-261", "name": "Curl Femoral Tumbado en Máquina", "target_muscle": "Femorales", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Boca abajo en la máquina, tobillos bajo el rodillo. Flexiona las rodillas hacia los glúteos y baja con control. Aislamiento de isquiotibiales.", "weight_factor": 0.35, "equipment": "gym" },
{ "id": "ex-262", "name": "Peso Muerto Sumo con Barra", "target_muscle": "Femorales", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Pies muy abiertos, puntas hacia afuera. Agarre estrecho en la barra. Empuja el suelo hacia abajo y lleva las caderas hacia la barra al subir.", "weight_factor": 0.85, "equipment": "gym" },
{ "id": "ex-263", "name": "Peso Muerto a Una Pierna con Mancuerna", "target_muscle": "Femorales", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "De pie en una pierna, mancuerna en la mano contraria. Inclina el torso hacia adelante con la espalda recta hasta sentir el estiramiento femoral.", "weight_factor": 0.25, "equipment": "gym" },
{ "id": "ex-264", "name": "Good Morning con Barra", "target_muscle": "Femorales", "split_category": "tren_inferior", "difficulty": "advanced", "description": "Barra en la espalda alta. Bisagra de cadera hacia adelante manteniendo la espalda neutra hasta que el torso quede casi paralelo al suelo.", "weight_factor": 0.4, "equipment": "gym" },
{ "id": "ex-265", "name": "Curl Femoral de Pie en Máquina", "target_muscle": "Femorales", "split_category": "tren_inferior", "difficulty": "beginner", "description": "De pie, tobillo sujeto por el rodillo. Flexiona la rodilla llevando el talón hacia el glúteo. Mantén la cadera fija durante el movimiento.", "weight_factor": 0.3, "equipment": "gym" },
{ "id": "ex-266", "name": "Nordic Curl (Nórdica Femoral)", "target_muscle": "Femorales", "split_category": "tren_inferior", "difficulty": "advanced", "description": "Pies sujetos bajo barra baja o con compañero. Cuerpo erguido, baja controlando con los femorales hasta casi el suelo y vuelve. Alta activación excéntrica.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-267", "name": "Curl Nórdico con Banda (Progresión)", "target_muscle": "Femorales", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Versión asistida del Nordic Curl usando una banda elástica anclada al frente para ayudar en la subida. Ideal para desarrollar la fuerza femoral.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-268", "name": "Hip Thrust con Barra en Banco", "target_muscle": "Glúteos", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Espalda alta apoyada en el banco, barra sobre las caderas. Empuja las caderas hacia arriba bloqueando los glúteos en la posición alta.", "weight_factor": 0.8, "equipment": "gym" },
{ "id": "ex-269", "name": "Sentadilla Sumo con Mancuerna", "target_muscle": "Glúteos", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Pies muy abiertos, puntas hacia afuera, mancuerna colgando entre las piernas. Desciende con el torso erguido apretando los glúteos al subir.", "weight_factor": 0.35, "equipment": "gym" },
{ "id": "ex-270", "name": "Patada de Glúteo en Polea (Cable Kickback)", "target_muscle": "Glúteos", "split_category": "tren_inferior", "difficulty": "beginner", "description": "De pie frente a polea baja, tobillo con correa. Lleva la pierna hacia atrás con la rodilla levemente flexionada contrayendo el glúteo.", "weight_factor": 0.15, "equipment": "gym" },
{ "id": "ex-271", "name": "Abducción de Cadera en Máquina", "target_muscle": "Glúteos", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Sentado en la máquina de abducción, almohadillas en la cara exterior de los muslos. Abre las piernas contra la resistencia. Activa el glúteo medio.", "weight_factor": 0.3, "equipment": "gym" },
{ "id": "ex-272", "name": "Peso Muerto Rumano con Mancuernas", "target_muscle": "Glúteos", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Mancuernas frente a los muslos. Bisagra de cadera con la espalda recta bajando las mancuernas por las piernas hasta sentir el estiramiento. Sube apretando glúteos.", "weight_factor": 0.4, "equipment": "gym" },
{ "id": "ex-273", "name": "Puente de Glúteo Monopodal", "target_muscle": "Glúteos", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Tumbado boca arriba, una pierna extendida en el aire. Empuja con el talón apoyado elevando la cadera y contrayendo el glúteo. Baja con control.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-274", "name": "Sentadilla Búlgara con Pausa", "target_muscle": "Glúteos", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Igual que la sentadilla búlgara con peso corporal pero con una pausa de 2 segundos en la posición baja para aumentar la tensión muscular.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-275", "name": "Fire Hydrant (Hidrant de Fuego)", "target_muscle": "Glúteos", "split_category": "tren_inferior", "difficulty": "beginner", "description": "A cuatro patas, eleva una rodilla doblada lateralmente hasta la altura de la cadera. Controla el descenso. Activa el glúteo medio.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-276", "name": "Donkey Kick con Pausa", "target_muscle": "Glúteos", "split_category": "tren_inferior", "difficulty": "beginner", "description": "A cuatro patas, lleva una pierna hacia atrás y arriba con la rodilla doblada. Aguanta 2 segundos en la posición alta apretando el glúteo.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-277", "name": "Elevación de Talones Sentado en Máquina", "target_muscle": "Gemelos", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Sentado en la máquina de gemelos sentado, almohadilla sobre las rodillas. Eleva los talones al máximo y baja completamente para máximo recorrido.", "weight_factor": 0.5, "equipment": "gym" },
{ "id": "ex-278", "name": "Elevación de Talones Unilateral con Mancuerna", "target_muscle": "Gemelos", "split_category": "tren_inferior", "difficulty": "beginner", "description": "De pie en el borde de un escalón con una mancuerna en una mano. Baja el talón y sube sobre la punta del pie al máximo. Alterna piernas.", "weight_factor": 0.2, "equipment": "gym" },
{ "id": "ex-279", "name": "Calf Press en Prensa 45°", "target_muscle": "Gemelos", "split_category": "tren_inferior", "difficulty": "beginner", "description": "En la prensa de piernas, solo los antepies en el borde inferior de la plataforma. Empuja con las puntas de los pies sin mover las rodillas.", "weight_factor": 0.9, "equipment": "gym" },
{ "id": "ex-280", "name": "Elevación de Talones a Una Pierna en Escalón", "target_muscle": "Gemelos", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "De pie en un escalón en una sola pierna. Baja el talón completamente y sube sobre la punta al máximo. Mayor rango que la versión bilateral.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-281", "name": "Saltos de Cuerda (Jumping Rope)", "target_muscle": "Gemelos", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Salto continuo a la comba durante 2-3 minutos. Mantén las rodillas semiflexionadas y los talones sin tocar el suelo. Activa gemelos y tobillo.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-282", "name": "Zancada Lateral (Lateral Lunge)", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Paso amplio hacia un lado doblando esa rodilla hasta 90° mientras la otra permanece extendida. Impulsa con el talón para volver. Alterna lados.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-283", "name": "Zancada Reversa con Mancuernas", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Con mancuernas, da un paso hacia atrás y baja la rodilla trasera cerca del suelo. El pie delantero mantiene el control. Alterna piernas.", "weight_factor": 0.15, "equipment": "gym" },
{ "id": "ex-284", "name": "Split Squat con Barra", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Posición estática de zancada con barra en la espalda. Desciende y sube sin mover los pies. Trabaja cada pierna de forma independiente.", "weight_factor": 0.5, "equipment": "gym" },
{ "id": "ex-285", "name": "Sentadilla Búlgara con Mancuernas", "target_muscle": "Glúteos", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Pie trasero en banco, mancuernas a los lados. Desciende hasta que la rodilla delantera forme 90°. Empuja con el talón delantero al subir.", "weight_factor": 0.2, "equipment": "gym" },
{ "id": "ex-286", "name": "Extensión de Cadera en Máquina", "target_muscle": "Glúteos", "split_category": "tren_inferior", "difficulty": "beginner", "description": "De pie en la máquina de extensión de cadera, muslo contra la almohadilla. Lleva la pierna hacia atrás contrayendo el glúteo. Sin arquear la espalda.", "weight_factor": 0.2, "equipment": "gym" },
{ "id": "ex-287", "name": "Aducción de Cadera en Máquina", "target_muscle": "Femorales", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Sentado en la máquina, almohadillas en la cara interna de los muslos. Cierra las piernas contra la resistencia. Activa la cara interna del muslo.", "weight_factor": 0.25, "equipment": "gym" },
{ "id": "ex-288", "name": "Step-up Unilateral (Sin Peso)", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Sube a un cajón o escalón empujando solo con el pie elevado. Baja controlando el descenso. Sin impulso de la pierna trasera. Alterna piernas.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-289", "name": "Zancada Lateral Dinámica", "target_muscle": "Glúteos", "split_category": "tren_inferior", "difficulty": "intermediate", "description": "Serie continua de zancadas laterales alternando lados sin pausa. Mantén el torso erguido y el pie apoyado plano. Cardio y tren inferior.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-290", "name": "Sentadilla Isométrica en Pared (Wall Sit)", "target_muscle": "Cuádriceps", "split_category": "tren_inferior", "difficulty": "beginner", "description": "Espalda apoyada en la pared, muslos paralelos al suelo a 90°. Mantén la posición durante 30-60 segundos. Alta activación de cuádriceps.", "weight_factor": 0, "equipment": "none" }
```

- [ ] **Step 3: Añadir 40 ejercicios nuevos a ambos (ex-351 a ex-390)**

```json
{ "id": "ex-351", "name": "Burpee Clásico", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "intermediate", "description": "De pie, baja las manos al suelo, salta a posición de plancha, haz una flexión, salta los pies hacia las manos y salta hacia arriba con los brazos extendidos.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-352", "name": "Burpee con Flexión y Salto", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "advanced", "description": "Burpee completo con una flexión de pecho en la posición de plancha y salto explosivo al final. Mayor demanda cardiovascular y de fuerza.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-353", "name": "Salto Explosivo al Cajón (Box Jump)", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "intermediate", "description": "Desde el suelo, agáchate levemente y salta explosivamente sobre el cajón aterrizando con ambos pies a la vez y rodillas semiflexionadas.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-354", "name": "Mountain Climber", "target_muscle": "Core", "split_category": "ambos", "difficulty": "beginner", "description": "Posición de plancha alta. Lleva rodillas alternadas hacia el pecho de forma explosiva manteniendo las caderas bajas y el core contraído.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-355", "name": "Saltar a la Comba", "target_muscle": "Cardio", "split_category": "ambos", "difficulty": "beginner", "description": "Salto continuo con comba durante 3-5 minutos. Mantén los codos pegados al cuerpo y las muñecas activas. Adapta la velocidad al objetivo.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-356", "name": "Thruster con Mancuernas", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "intermediate", "description": "Sentadilla profunda con mancuernas a la altura de los hombros y al subir empuja las mancuernas sobre la cabeza en un movimiento fluido.", "weight_factor": 0.3, "equipment": "gym" },
{ "id": "ex-357", "name": "Clean & Press con Barra", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "advanced", "description": "Levanta la barra del suelo hasta los hombros (clean) y después presiona sobre la cabeza (press). Coordinación, potencia y fuerza completa.", "weight_factor": 0.5, "equipment": "gym" },
{ "id": "ex-358", "name": "Kettlebell Swing a Dos Manos", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "intermediate", "description": "Kettlebell entre las piernas, bisagra de cadera explosiva para impulsarla hasta la altura de los hombros. Potencia de cadena posterior.", "weight_factor": 0.25, "equipment": "gym" },
{ "id": "ex-359", "name": "Snatch con Kettlebell", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "advanced", "description": "Kettlebell al suelo, impulso explosivo desde la cadera y bloqueo sobre la cabeza en una sola mano. Alta demanda técnica y cardiovascular.", "weight_factor": 0.2, "equipment": "gym" },
{ "id": "ex-360", "name": "Battle Ropes — Ondas Alternas", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "intermediate", "description": "Sujeta un extremo de la cuerda en cada mano. Mueve los brazos de forma alterna hacia arriba y abajo para crear ondas continuas durante 30s.", "weight_factor": 0, "equipment": "gym" },
{ "id": "ex-361", "name": "Sprint de 400m", "target_muscle": "Cardio", "split_category": "ambos", "difficulty": "advanced", "description": "Carrera a máxima intensidad durante 400 metros. Fase de aceleración en los primeros 100m y mantenimiento del ritmo hasta el final.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-362", "name": "Sprints Intervalados 10×30m", "target_muscle": "Cardio", "split_category": "ambos", "difficulty": "advanced", "description": "10 repeticiones de 30 metros a máxima velocidad con 30-60 segundos de descanso entre cada sprint. Mejora la potencia anaeróbica láctica.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-363", "name": "Carrera Continua 15 Minutos", "target_muscle": "Cardio", "split_category": "ambos", "difficulty": "beginner", "description": "Trote suave a ritmo conversacional durante 15 minutos. El objetivo es mantener una frecuencia cardíaca entre el 60-70% del máximo.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-364", "name": "Step Aeróbico en Cajón", "target_muscle": "Cardio", "split_category": "ambos", "difficulty": "beginner", "description": "Sube y baja de un cajón o escalón de forma rítmica alternando el pie que lidera. Mantén un ritmo constante durante 3-5 minutos.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-365", "name": "Saltos de Tijera (Jumping Jacks)", "target_muscle": "Cardio", "split_category": "ambos", "difficulty": "beginner", "description": "Desde posición erguida, salta abriendo piernas y brazos simultáneamente y cierra al caer. Ritmo constante durante 60-90 segundos.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-366", "name": "Burpee con Salto Explosivo", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "advanced", "description": "Variante del burpee donde el salto final es lo más alto posible extendiendo completamente el cuerpo y los brazos hacia el techo.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-367", "name": "Squat Jump con Pausa Isométrica", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "intermediate", "description": "Desciende a la sentadilla, mantén 2 segundos en la posición baja y explota hacia arriba saltando al máximo. La pausa elimina el reflejo elástico.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-368", "name": "Rueda Abdominal (Ab Wheel Rollout)", "target_muscle": "Core", "split_category": "ambos", "difficulty": "advanced", "description": "De rodillas con la rueda en el suelo, extiende los brazos rodando hacia adelante hasta que el cuerpo esté casi horizontal. Vuelve contrayendo el core.", "weight_factor": 0, "equipment": "gym" },
{ "id": "ex-369", "name": "Crunch en Polea Alta", "target_muscle": "Core", "split_category": "ambos", "difficulty": "beginner", "description": "De rodillas frente a polea alta con cuerda. Flexiona el torso hacia las rodillas contrayendo el abdomen. El movimiento parte del core, no de los brazos.", "weight_factor": 0.2, "equipment": "gym" },
{ "id": "ex-370", "name": "Pallof Press", "target_muscle": "Core", "split_category": "ambos", "difficulty": "intermediate", "description": "De pie de lado a la polea, agarra la cuerda frente al pecho y extiende los brazos al frente resistiendo la rotación. Anti-rotación máxima del core.", "weight_factor": 0.15, "equipment": "gym" },
{ "id": "ex-371", "name": "Plancha con Elevación de Brazo Alterno", "target_muscle": "Core", "split_category": "ambos", "difficulty": "intermediate", "description": "Desde plancha alta, eleva un brazo al frente manteniéndolo paralelo al suelo durante 2 segundos. Alterna brazos sin rotar las caderas.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-372", "name": "Hollow Hold", "target_muscle": "Core", "split_category": "ambos", "difficulty": "intermediate", "description": "Tumbado boca arriba, eleva ligeramente los hombros y las piernas del suelo formando una banana hueca. Core completamente contraído. Aguanta 20-30s.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-373", "name": "L-Sit en Paralelas", "target_muscle": "Core", "split_category": "ambos", "difficulty": "advanced", "description": "Suspendido en paralelas, eleva las piernas extendidas hasta la horizontal. Mantén la posición bloqueando los codos y apretando el core.", "weight_factor": 0, "equipment": "gym" },
{ "id": "ex-374", "name": "Dragon Flag", "target_muscle": "Core", "split_category": "ambos", "difficulty": "advanced", "description": "Tumbado en banco, agarra el respaldo con ambas manos. Eleva el cuerpo rígido desde los hombros hasta los pies y baja lentamente sin tocar el banco.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-375", "name": "Plank to Push-up", "target_muscle": "Core", "split_category": "ambos", "difficulty": "intermediate", "description": "Desde plancha de antebrazos, sube a plancha alta extendiendo un brazo y luego el otro. Baja de la misma forma. Alterna el brazo que lidera.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-376", "name": "Russian Twist con Peso", "target_muscle": "Core", "split_category": "ambos", "difficulty": "beginner", "description": "Sentado con torso a 45°, pies elevados. Rota el torso de lado a lado con un disco o mancuerna. Control en cada extremo del movimiento.", "weight_factor": 0.1, "equipment": "gym" },
{ "id": "ex-377", "name": "Muscle-up en Barra", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "advanced", "description": "Desde colgado en barra, impulsa para pasar los brazos por encima de la barra y terminar en posición de fondos. Fuerza explosiva de jalón + empuje.", "weight_factor": 0, "equipment": "gym" },
{ "id": "ex-378", "name": "Superserie: Dominadas + Fondos", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "advanced", "description": "Realiza 5 dominadas pronadas seguidas inmediatamente de 5 fondos en paralelas sin descanso. Trabaja toda la cadena de empuje y jalón.", "weight_factor": 0, "equipment": "gym" },
{ "id": "ex-379", "name": "Pistol Squat (Sentadilla a Una Pierna)", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "advanced", "description": "De pie en una sola pierna, desciende con la otra extendida al frente hasta la posición baja y sube. Máxima demanda de fuerza, equilibrio y movilidad.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-380", "name": "Bear Crawl (Marcha del Oso)", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "intermediate", "description": "A cuatro patas con rodillas a 5cm del suelo. Avanza moviendo brazo y pierna contraria simultáneamente. Mantén las caderas bajas y el core activo.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-381", "name": "Hip Thrust con Peso Corporal en Banco", "target_muscle": "Glúteos", "split_category": "ambos", "difficulty": "beginner", "description": "Espalda alta en banco, pies en el suelo. Empuja las caderas hacia arriba bloqueando los glúteos en la posición alta durante 2 segundos.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-382", "name": "Clamshell con Banda Elástica", "target_muscle": "Glúteos", "split_category": "ambos", "difficulty": "beginner", "description": "Tumbado de lado, banda sobre las rodillas. Abre la rodilla superior hacia el techo manteniendo los pies juntos. Activa el glúteo medio.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-383", "name": "Dominadas con Lastre", "target_muscle": "Espalda", "split_category": "ambos", "difficulty": "advanced", "description": "Dominadas pronadas con chaleco lastrado o cinturón de lastre. Una vez puedes hacer 3×8 de dominadas con peso corporal, añade carga externa.", "weight_factor": 0.1, "equipment": "gym" },
{ "id": "ex-384", "name": "Remo Pendlay con Barra", "target_muscle": "Espalda", "split_category": "ambos", "difficulty": "advanced", "description": "Barra en el suelo, torso paralelo. Jalón explosivo hacia el abdomen y vuelta al suelo con cada repetición. Mayor potencia que el remo convencional.", "weight_factor": 0.55, "equipment": "gym" },
{ "id": "ex-385", "name": "Turkish Get-up con Kettlebell", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "advanced", "description": "Desde tumbado con kettlebell en una mano, levántate siguiendo los pasos: codo, mano, cadera, rodilla, de pie. Baja de forma inversa. Coordinación total.", "weight_factor": 0.2, "equipment": "gym" },
{ "id": "ex-386", "name": "Devil's Press con Mancuernas", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "advanced", "description": "Burpee con mancuernas: baja al suelo, haz una flexión, remo a cada lado, levanta y lleva las mancuernas sobre la cabeza en un swing. Full body explosivo.", "weight_factor": 0.2, "equipment": "gym" },
{ "id": "ex-387", "name": "Lanzamiento de Balón Medicinal a la Pared", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "intermediate", "description": "Sentadilla profunda con balón medicinal y al subir lanza el balón a máxima altura contra la pared. Atrapa y repite. Potencia de todo el cuerpo.", "weight_factor": 0.12, "equipment": "gym" },
{ "id": "ex-388", "name": "Empuje de Trineo (Sled Push)", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "advanced", "description": "Manos en los postes del trineo, torso inclinado 45°. Empuja el trineo cargado con pasos rápidos y cortos. Alta demanda de cuádriceps y cardiovascular.", "weight_factor": 0.5, "equipment": "gym" },
{ "id": "ex-389", "name": "Inchworm", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "beginner", "description": "De pie, baja las manos al suelo y camina hacia adelante hasta posición de plancha. Vuelve caminando con las manos y levántate. Movilidad y core.", "weight_factor": 0, "equipment": "none" },
{ "id": "ex-390", "name": "Skater Jump (Salto Lateral)", "target_muscle": "Full Body", "split_category": "ambos", "difficulty": "intermediate", "description": "Salta lateralmente de una pierna a la otra como si patinasen. Aterriza sobre un pie absorbiendo el impacto. Potencia lateral y coordinación.", "weight_factor": 0, "equipment": "none" }
```

- [ ] **Step 4: Verificar recuento**

```bash
python3 -c "
import json
data = json.load(open('backend/src/data/exercises.json'))
cats = {}
for e in data:
    cats.setdefault(e['split_category'], []).append(e['id'])
for c, ids in sorted(cats.items()):
    print(f'{c}: {len(ids)} ejercicios')
print(f'Total: {len(data)}')
"
```

Expected:
```
ambos: 90 ejercicios
tren_inferior: 90 ejercicios
tren_superior: 90 ejercicios
Total: 270
```

- [ ] **Step 5: Validar que el JSON es válido**

```bash
python3 -c "import json; json.load(open('backend/src/data/exercises.json')); print('JSON válido')"
```

Expected: `JSON válido`

- [ ] **Step 6: Compilar backend (el seed lee este JSON)**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend"
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/data/exercises.json
git commit -m "feat(data): expand exercise database from 150 to 270 (90 per category)"
```

---

## Task 15: Tests y verificación final

- [ ] **Step 1: Pasar tests backend**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend"
npx vitest run
```

Expected: todos los tests pasan. Si algún test de `routineService` filtraba por dificultad, actualizarlo para que no lo espere.

- [ ] **Step 2: Pasar tests frontend**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend"
npx vitest run
```

Expected: todos pasan.

- [ ] **Step 3: Build del frontend**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend"
npm run build
```

Expected: build exitoso sin errores de TypeScript.

- [ ] **Step 4: Commit final y push**

```bash
git add -A
git status  # Revisar que no hay archivos no deseados
git commit -m "feat: Fase 2 completa — área cliente, favoritos, disclaimer, sin filtro dificultad, 270 ejercicios"
git push
```

---

## Notas de implementación

- **Roles admin**: asignados manualmente en MongoDB. Para promover un usuario a admin: `db.users.updateOne({ email: "mario@..." }, { $set: { role: "admin" } })`. Los tokens existentes NO se actualizan automáticamente — el usuario debe hacer logout + login.
- **Tokens legacy**: `useAuth` lee `role` del localStorage con fallback `'user'` para sesiones anteriores a esta fase.
- **SweetAlert2 colors**: usar las variables CSS del proyecto (`#7c3aed` para el botón, `#1a1a2e` para el fondo) para coherencia visual.
- **Favorites offline**: si no hay conexión, el hook falla silenciosamente — los favoritos se muestran vacíos hasta recuperar la conexión. No bloquea la UX principal.
