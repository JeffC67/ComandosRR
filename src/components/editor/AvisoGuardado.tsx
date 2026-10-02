/* ============================================================
   AvisoGuardado — Portal Capacitación RR / AS400
   Confirmación tras crear/editar un enlace (/editor/enlaces).
   El ?guardado=1 quedaba en la URL y el aviso reaparecía en cada
   refresh tapando el flujo de la página: este componente lo muestra,
   lo descarta solo a los pocos segundos (limpiando el parámetro con
   router.replace) y ofrece botón × para cerrarlo a mano.
   ============================================================ */
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const MS_AVISO = 4000;

export function AvisoGuardado() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      router.replace('/editor/enlaces');
    }, MS_AVISO);
    return () => clearTimeout(t);
  }, [router]);

  if (!visible) return null;

  const cerrar = () => {
    setVisible(false);
    router.replace('/editor/enlaces');
  };

  return (
    <p className="form-ok form-ok-cierre" role="status">
      <span>Enlace guardado.</span>
      <button type="button" className="form-ok-close" onClick={cerrar} aria-label="Descartar aviso">
        &times;
      </button>
    </p>
  );
}
