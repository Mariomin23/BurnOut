import { useCallback, useEffect, useState } from 'react';
import { API_ROOT } from '../lib/api';
import { fileToAvatarDataUrl, validateImageFile } from '../lib/image';

export function useProfile(token: string | null) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_ROOT}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setAvatarUrl(data.avatarUrl ?? null);
      } catch {
        // sin conexión: la app funciona igual, solo sin foto
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!token) return;
    const invalid = validateImageFile(file);
    if (invalid) {
      setAvatarError(invalid);
      return;
    }
    setAvatarLoading(true);
    setAvatarError(null);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const res = await fetch(`${API_ROOT}/profile/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAvatarError(data.error ?? 'No se pudo guardar la foto');
        return;
      }
      setAvatarUrl(data.avatarUrl ?? dataUrl);
    } catch {
      setAvatarError('No se pudo procesar la imagen');
    } finally {
      setAvatarLoading(false);
    }
  }, [token]);

  const removeAvatar = useCallback(async () => {
    if (!token) return;
    setAvatarLoading(true);
    setAvatarError(null);
    try {
      const res = await fetch(`${API_ROOT}/profile/avatar`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setAvatarError('No se pudo eliminar la foto');
        return;
      }
      setAvatarUrl(null);
    } catch {
      setAvatarError('No se pudo conectar con el servidor');
    } finally {
      setAvatarLoading(false);
    }
  }, [token]);

  return { avatarUrl, avatarLoading, avatarError, uploadAvatar, removeAvatar };
}
