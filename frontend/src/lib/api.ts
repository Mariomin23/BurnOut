export const ROUTINES_API_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000/api/routines';

/** Raíz de la API (sin /routines) para auth e historial. */
export const API_ROOT = ROUTINES_API_URL.replace(/\/routines\/?$/, '');

/**
 * Despierta el backend en cuanto se abre la app: el arranque en frío ocurre
 * mientras el usuario rellena el formulario, no cuando pulsa "generar".
 */
let wakePromise: Promise<boolean> | null = null;

/** Resuelve a true cuando el servidor responde; false si no hay conexión. Un solo ping por carga. */
export function wakeServer(): Promise<boolean> {
  wakePromise ??= fetch(`${API_ROOT.replace(/\/api\/?$/, '')}/health`, {
    signal: AbortSignal.timeout(90_000),
  })
    .then(res => res.ok)
    // sin conexión: el modo offline de useWorkout ya lo cubre
    .catch(() => false);
  return wakePromise;
}
