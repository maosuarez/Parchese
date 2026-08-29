import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Vencer intenciones cuya ventana ya pasó.
//
// Cinco minutos de retraso no tienen efecto observable, porque el vencimiento
// NO notifica a nadie. Ver la spec del match.
crons.interval(
  "vencerIntenciones",
  { minutes: 5 },
  internal.matching.vencerIntenciones,
  {},
);

// Cerrar planes cuya ventana ya terminó: marca noShow a quien confirmó y no
// escaneó el QR, y le baja el score. Igual que el vencimiento de intenciones,
// cinco minutos de retraso no tienen efecto observable.
crons.interval(
  "cerrarPlanesVencidos",
  { minutes: 5 },
  internal.trust.cerrarPlanesVencidos,
  {},
);

// PENDIENTE — el empujón de las 7pm.
// Requiere una plantilla aprobada por Meta (tarda hasta 24h en aprobarse) para
// los usuarios fuera de la ventana de servicio de 24 horas. No sirve para el
// demo; se activa cuando la plantilla esté lista.
// Ver docs/frentes/dev-a-canal-whatsapp.md.

export default crons;
