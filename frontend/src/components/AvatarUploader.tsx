import React, { useRef } from 'react';

interface AvatarUploaderProps {
  email: string;
  avatarUrl: string | null;
  loading: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  email,
  avatarUrl,
  loading,
  error,
  onUpload,
  onRemove,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    // permite volver a elegir el mismo fichero tras un error
    e.target.value = '';
  };

  return (
    <div className="avatar-uploader">
      {avatarUrl ? (
        <img src={avatarUrl} alt="Tu foto de perfil" className="avatar avatar--lg" />
      ) : (
        <div className="avatar avatar--lg avatar--empty" aria-hidden="true">
          {email.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="avatar-uploader__actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleChange}
          className="avatar-uploader__input"
          aria-label="Subir foto de perfil"
        />
        <button
          type="button"
          className="btn btn-secondary avatar-uploader__btn"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          {loading ? 'Guardando…' : avatarUrl ? '📷 Cambiar foto' : '📷 Subir foto'}
        </button>
        {avatarUrl && (
          <button
            type="button"
            className="btn btn-danger avatar-uploader__btn"
            onClick={onRemove}
            disabled={loading}
          >
            Quitar
          </button>
        )}
        {error && <p className="avatar-uploader__error">{error}</p>}
      </div>
    </div>
  );
};
