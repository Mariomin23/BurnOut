# Fase 3 — GIFs + Dataset GitHub (1,324 ejercicios)

## Contexto

Sustituir los 150 ejercicios actuales (sin GIF, nombres en español) por los 1,324 ejercicios del repositorio `hasaneyldrm/exercises-dataset`, que incluye GIF animado por ejercicio, imagen estática (thumbnail) y descripciones en español.

## Fuente

- Repo: `https://github.com/hasaneyldrm/exercises-dataset`
- JSON: `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json`
- GIFs: `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/{id}-{media_id}.gif`
- Thumbnails: `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/{id}-{media_id}.jpg`
- Licencia: © Gym Visual — atribución incluida en el campo `attribution` de cada ejercicio

## Estructura del dataset

```json
{
  "id": "0001",
  "name": "3/4 sit-up",
  "body_part": "waist",
  "equipment": "body weight",
  "target": "abs",
  "muscle_group": "hip flexors",
  "secondary_muscles": ["hip flexors", "lower back"],
  "instructions": { "es": "...", "en": "..." },
  "image": "images/0001-2gPfomN.jpg",
  "gif_url": "videos/0001-2gPfomN.gif",
  "media_id": "2gPfomN"
}
```

## Mapping de campos

### body_part → split_category

| body_part | split_category |
|-----------|----------------|
| back | tren_superior |
| chest | tren_superior |
| shoulders | tren_superior |
| upper arms | tren_superior |
| lower arms | tren_superior |
| neck | tren_superior |
| upper legs | tren_inferior |
| lower legs | tren_inferior |
| waist | ambos |
| cardio | ambos |

### equipment → EquipmentCategory

| equipment (dataset) | equipment (nuestro) |
|---------------------|---------------------|
| body weight | none |
| band | none |
| resistance band | none |
| roller | none |
| todo lo demás (28 tipos) | gym |

### weight_factor por body_part

| body_part | weight_factor |
|-----------|---------------|
| chest | 1.0 |
| back | 0.8 |
| upper legs | 1.2 |
| lower legs | 0.6 |
| shoulders | 0.5 |
| upper arms | 0.4 |
| lower arms | 0.2 |
| neck | 0.1 |
| waist | 0 |
| cardio | 0 |

> Si `equipment === 'body weight'`, `weight_factor = 0` independientemente del body_part.

### target_muscle → español

| target (dataset) | target_muscle (app) |
|-----------------|---------------------|
| abs | Abdominales |
| adductors | Aductores |
| biceps | Bíceps |
| calves | Pantorrillas |
| cardiovascular system | Cardio |
| delts | Deltoides |
| forearms | Antebrazos |
| glutes | Glúteos |
| hamstrings | Isquiotibiales |
| lats | Dorsales |
| levator scapulae | Elevador Escápula |
| pectorals | Pecho |
| quads | Cuádriceps |
| serratus anterior | Serrato |
| spine | Columna |
| traps | Trapecios |
| triceps | Tríceps |
| upper back | Espalda Alta |
| hip flexors | Flexores Cadera |
| neck | Cuello |

### gif_url / image_url

URL absoluta a raw GitHub CDN:
```
gif_url:   https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/{id}-{media_id}.gif
image_url: https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/{id}-{media_id}.jpg
```

### difficulty

El campo `difficulty` se eliminó en Fase 2. Todos los ejercicios importados reciben `difficulty: 'intermediate'`.

## Arquitectura

### Backend

1. **Script `importGithubExercises.ts`** (one-time, local):
   - Descarga JSON desde GitHub CDN
   - Mapea todos los campos según tabla de arriba
   - Escribe `backend/src/data/exercises.json` (reemplaza el actual)
   - Runnable: `npx ts-node src/scripts/importGithubExercises.ts`

2. **`Exercise` interface** — añadir `gif_url?: string` y `image_url?: string`

3. **`exercise.model.ts`** — añadir campos opcionales `gif_url` y `image_url`

4. **`seed.ts`** — sin cambios (upsert idempotente ya funciona; ejercicios viejos quedan obsoletos en MongoDB pero no causan error)

### Frontend

5. **`frontend/src/types/index.ts`** — añadir `gif_url?: string` y `image_url?: string` a `Exercise`

6. **`ExerciseCard.tsx`** — en el header, a la derecha del bloque de acciones (YouTube, favorito, reroll), mostrar GIF:
   - `<img src={exercise.gif_url} loading="lazy" alt="" aria-hidden="true" />`
   - Tamaño: 90×90px, `border-radius: 8px`, `object-fit: cover`
   - Oculto si `gif_url` está vacío (backwards compat)

7. **`ExerciseCardSkeleton.tsx`** — añadir placeholder shimmer del mismo tamaño

## Impacto en datos existentes

- Historial MongoDB: no se rompe (almacena `exerciseId`, `exerciseName`, `targetMuscle` denormalizados)
- Favoritos MongoDB: los IDs antiguos (`ex-101`, etc.) dejan de resolver a ejercicios existentes — comportamiento aceptable para "super update"
- Los IDs nuevos son strings numéricos (`"0001"`, `"0002"`, ...) — no colisionan con los `ex-XXX` viejos

## Resultado esperado

- 1,324 ejercicios en DB con GIF animado
- ExerciseCard muestra GIF 90×90 en el header
- Filtros split/equipment funcionan con el nuevo mapping
- Peso sugerido sigue calculándose por weight_factor
