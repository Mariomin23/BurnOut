import { describe, it, expect } from 'vitest';
import { validateImageFile, squareCrop, MAX_UPLOAD_BYTES } from './image';

describe('validateImageFile', () => {
  it('acepta PNG, JPEG y WebP dentro del límite', () => {
    expect(validateImageFile({ type: 'image/png', size: 1024 })).toBeNull();
    expect(validateImageFile({ type: 'image/jpeg', size: 1024 })).toBeNull();
    expect(validateImageFile({ type: 'image/webp', size: 1024 })).toBeNull();
  });

  it('rechaza formatos no soportados', () => {
    expect(validateImageFile({ type: 'image/gif', size: 1024 })).toMatch(/Formato/);
    expect(validateImageFile({ type: 'application/pdf', size: 1024 })).toMatch(/Formato/);
  });

  it('rechaza ficheros por encima del máximo', () => {
    expect(validateImageFile({ type: 'image/png', size: MAX_UPLOAD_BYTES + 1 })).toMatch(/demasiado/);
  });
});

describe('squareCrop', () => {
  it('centra el recorte en imágenes apaisadas', () => {
    expect(squareCrop(400, 200)).toEqual({ sx: 100, sy: 0, side: 200 });
  });

  it('centra el recorte en imágenes verticales', () => {
    expect(squareCrop(200, 500)).toEqual({ sx: 0, sy: 150, side: 200 });
  });

  it('no recorta si ya es cuadrada', () => {
    expect(squareCrop(300, 300)).toEqual({ sx: 0, sy: 0, side: 300 });
  });
});
