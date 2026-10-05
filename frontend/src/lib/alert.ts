import type { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

const THEME: SweetAlertOptions = {
  confirmButtonColor: '#7c3aed',
  background: '#1a1a2e',
  color: '#e2e8f0',
};

/** SweetAlert2 se descarga solo cuando hay un aviso que enseñar, no en el arranque. */
export async function fireAlert(options: SweetAlertOptions): Promise<SweetAlertResult> {
  const { default: Swal } = await import('sweetalert2');
  return Swal.fire({ ...THEME, ...options } as SweetAlertOptions);
}

const WAKING_CLASS = 'server-waking';
let wakingWanted = false;

/** Aviso no bloqueante mientras el servidor arranca; el formulario sigue usable. */
export async function showServerWaking(): Promise<void> {
  wakingWanted = true;
  const { default: Swal } = await import('sweetalert2');
  // El servidor pudo responder mientras se descargaba; y no se pisa otro aviso abierto
  if (!wakingWanted || Swal.isVisible()) return;
  Swal.fire({
    ...THEME,
    toast: true,
    position: 'top',
    title: 'Arrancando el servidor…',
    text: 'Esto puede tardar hasta un minuto. Mientras tanto puedes ir rellenando tus datos.',
    showConfirmButton: false,
    customClass: { popup: WAKING_CLASS },
    didOpen: () => Swal.showLoading(),
  });
}

export async function hideServerWaking(): Promise<void> {
  if (!wakingWanted) return;
  wakingWanted = false;
  const { default: Swal } = await import('sweetalert2');
  if (Swal.getPopup()?.classList.contains(WAKING_CLASS)) Swal.close();
}
