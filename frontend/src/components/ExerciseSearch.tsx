import React, { useEffect, useState } from 'react';
import type { Exercise } from '../types';
import { API_ROOT } from '../lib/api';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 350;

interface ExerciseSearchProps {
  favoriteIds: Set<string>;
  onToggleFavorite: (exerciseId: string) => void;
}

export const ExerciseSearch: React.FC<ExerciseSearchProps> = ({ favoriteIds, onToggleFavorite }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_ROOT}/exercises/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('search failed');
        const data: Exercise[] = await res.json();
        setResults(data);
        setError(null);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError('No se pudo buscar. Revisa tu conexión.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const term = query.trim();

  return (
    <div className="exercise-search">
      <label htmlFor="exercise-search-input" className="exercise-search__label">
        Buscar ejercicios para tus favoritos
      </label>
      <input
        id="exercise-search-input"
        type="search"
        className="form-input"
        placeholder="Press de banca, sentadilla, bíceps…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        autoComplete="off"
      />

      {loading && <p className="exercise-search__status">Buscando…</p>}
      {error && <p className="exercise-search__status exercise-search__status--error">{error}</p>}
      {!loading && !error && term.length >= MIN_QUERY_LENGTH && results.length === 0 && (
        <p className="exercise-search__status">Sin resultados para “{term}”.</p>
      )}

      {results.map(ex => {
        const isFavorite = favoriteIds.has(ex.id);
        return (
          <div key={ex.id} className="glass search-result">
            {ex.gif_url && (
              <img src={ex.gif_url} loading="lazy" alt="" aria-hidden="true" className="search-result__gif" />
            )}
            <div className="search-result__info">
              <h4 className="search-result__name">{ex.name}</h4>
              <div className="exercise-card__badges">
                <span className="badge-pill badge-split" style={{ fontSize: '0.6rem' }}>
                  {ex.target_muscle}
                </span>
                {ex.equipment === 'none' && (
                  <span className="badge-pill badge-split" style={{ fontSize: '0.6rem' }}>Sin material</span>
                )}
              </div>
            </div>
            <button
              className="btn btn-secondary btn-circle search-result__star"
              onClick={() => onToggleFavorite(ex.id)}
              title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              aria-pressed={isFavorite}
            >
              {isFavorite ? '⭐' : '☆'}
            </button>
          </div>
        );
      })}
    </div>
  );
};
