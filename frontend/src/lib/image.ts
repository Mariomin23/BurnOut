export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const AVATAR_SIZE_PX = 256;

/** Devuelve el mensaje de error, o null si el fichero es válido. */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Formato no admitido. Usa PNG, JPG o WebP.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'La imagen pesa demasiado (máximo 8 MB).';
  }
  return null;
}

/** Recorte cuadrado centrado: coordenadas de origen para dibujar sin deformar. */
export function squareCrop(width: number, height: number) {
  const side = Math.min(width, height);
  return {
    sx: Math.round((width - side) / 2),
    sy: Math.round((height - side) / 2),
    side,
  };
}

/**
 * Redimensiona en el navegador a un cuadrado de `size` px y devuelve un data URL
 * JPEG. El backend guarda ese string tal cual, así que el recorte evita subir
 * fotos de varios MB.
 */
export async function fileToAvatarDataUrl(file: File, size: number = AVATAR_SIZE_PX): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const { sx, sy, side } = squareCrop(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');

  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', 0.85);
}
