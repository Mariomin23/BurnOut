import { Exercise } from '../types';
import { IExerciseRepository, JsonExerciseRepository, SearchOptions } from './exerciseRepository';
import { MongoExerciseRepository } from './mongoExerciseRepository';
import { isDbConnected } from '../db/connection';

/** El catálogo solo cambia en cada deploy (seed): 10 min de caché es de sobra */
const CATALOG_TTL_MS = 10 * 60 * 1000;

interface CatalogCache {
  exercises: Exercise[];
  byId: Map<string, Exercise>;
  expiresAt: number;
}

// A nivel de módulo: todas las instancias del repositorio comparten el catálogo
let catalogCache: CatalogCache | null = null;
let catalogLoading: Promise<CatalogCache | null> | null = null;

/** Tras el seed el catálogo de Mongo puede haber cambiado: fuerza una relectura. */
export function invalidateExerciseCache(): void {
  catalogCache = null;
  catalogLoading = null;
}

/**
 * Usa MongoDB cuando hay conexión y la colección tiene datos;
 * en cualquier otro caso cae al JSON estático. La capa de servicios
 * no sabe cuál de los dos está respondiendo (patrón repositorio).
 *
 * El catálogo de Mongo se guarda en memoria: generar una rutina ya no
 * descarga los 1.324 ejercicios de Atlas en cada petición.
 */
export class HybridExerciseRepository implements IExerciseRepository {
  private json = new JsonExerciseRepository();
  private mongo = new MongoExerciseRepository();

  /** Catálogo de Mongo cacheado, o null si no hay conexión / está vacío / falla. */
  private async loadCatalog(): Promise<CatalogCache | null> {
    if (!isDbConnected()) return null;
    if (catalogCache && catalogCache.expiresAt > Date.now()) return catalogCache;

    // Peticiones simultáneas con la caché fría comparten una sola lectura
    if (!catalogLoading) {
      const loading: Promise<CatalogCache | null> = this.mongo
        .getAll()
        .then(exercises => {
          if (exercises.length === 0) return null;
          const fresh: CatalogCache = {
            exercises,
            byId: new Map(exercises.map(ex => [ex.id, ex])),
            expiresAt: Date.now() + CATALOG_TTL_MS,
          };
          // Si el seed invalidó la caché a mitad de lectura, este resultado ya no vale
          if (catalogLoading === loading) catalogCache = fresh;
          return fresh;
        })
        .catch(error => {
          console.error('Mongo getAll falló — fallback a JSON:', error);
          return null;
        })
        .finally(() => {
          if (catalogLoading === loading) catalogLoading = null;
        });
      catalogLoading = loading;
    }
    return catalogLoading;
  }

  public async getAll(): Promise<Exercise[]> {
    const catalog = await this.loadCatalog();
    return catalog ? catalog.exercises : this.json.getAll();
  }

  public async getById(id: string): Promise<Exercise | null> {
    const catalog = await this.loadCatalog();
    return catalog?.byId.get(id) ?? this.json.getById(id);
  }

  public async search(query: string, options?: SearchOptions): Promise<Exercise[]> {
    if (isDbConnected()) {
      try {
        const exercises = await this.mongo.search(query, options);
        if (exercises.length > 0) return exercises;
      } catch (error) {
        console.error('Mongo search falló — fallback a JSON:', error);
      }
    }
    return this.json.search(query, options);
  }
}
