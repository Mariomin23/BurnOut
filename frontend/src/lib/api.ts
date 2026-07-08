export const ROUTINES_API_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000/api/routines';

/** Raíz de la API (sin /routines) para auth e historial. */
export const API_ROOT = ROUTINES_API_URL.replace(/\/routines\/?$/, '');
