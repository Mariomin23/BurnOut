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
