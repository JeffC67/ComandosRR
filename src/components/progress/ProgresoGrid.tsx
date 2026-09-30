/* ============================================================
   ProgresoGrid — Portal Capacitación RR / AS400
   Rejilla de procesos con su estado de completado. Envuelve a
   ProcesoCard y separa la parte estática (tarjeta) de la que
   necesita la sesión del agente (botón de completar).
   ============================================================ */

import type { Proceso } from '@/types';
import { ProcesoCard } from '@/components/processes/ProcesoCard';

interface ProgresoGridProps {
  procesos: Proceso[];
  completadosIds: Set<string>;
  intentadosQuiz: Map<string, number>;
}

export function ProgresoGrid({ procesos, completadosIds, intentadosQuiz }: ProgresoGridProps) {
  return (
    <div className="processes-grid">
      {procesos.map((proceso) => (
        <ProcesoCard
          key={proceso.id}
          proceso={proceso}
          isCompleted={completadosIds.has(proceso.id)}
          mejorQuiz={intentadosQuiz.get(proceso.id)}
        />
      ))}
    </div>
  );
}
