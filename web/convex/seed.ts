import { internalMutation } from "./_generated/server";

// Siembra del índice — el modo de un solo jugador.
//
// La parrilla tiene que servir aunque no haya un solo usuario más. De los
// 100 marketplaces analizados, el 34% arrancó así (OpenTable, Amazon).
// Sin esto, el primero que abre la app ve una pantalla muerta y se va.
//
// Estos son planes recurrentes reales de Bogotá. El scraping automático
// viene después; esto es lo que no se corta.

type Semilla = {
  title: string;
  activity: "caminar" | "cafe" | "cowork" | "juego" | "cancha" | "otro";
  zone: string;
  venue: string;
  address: string;
  /** 0 = domingo … 6 = sábado */
  dias: number[];
  hora: number;
  durationMinutes: number;
  capacity: number;
  intensity: "tranquilo" | "medio" | "movido";
};

const SEMILLAS: Semilla[] = [
  {
    title: "Ciclovía",
    activity: "caminar",
    zone: "centro",
    venue: "Carrera Séptima",
    address: "Cra. 7 con Calle 26",
    dias: [0],
    hora: 8,
    durationMinutes: 180,
    capacity: 40,
    intensity: "medio",
  },
  {
    title: "Caminata al Parque Nacional",
    activity: "caminar",
    zone: "teusaquillo",
    venue: "Parque Nacional Olaya Herrera",
    address: "Cra. 7 con Calle 39",
    dias: [6, 0],
    hora: 9,
    durationMinutes: 90,
    capacity: 12,
    intensity: "medio",
  },
  {
    title: "Vuelta al Virrey",
    activity: "caminar",
    zone: "chico",
    venue: "Parque El Virrey",
    address: "Cra. 15 con Calle 88",
    dias: [1, 2, 3, 4, 5],
    hora: 18,
    durationMinutes: 60,
    capacity: 10,
    intensity: "tranquilo",
  },
  {
    title: "Café de la tarde",
    activity: "cafe",
    zone: "chapinero",
    venue: "Zona G",
    address: "Calle 69 con Cra. 5",
    dias: [1, 2, 3, 4, 5],
    hora: 16,
    durationMinutes: 60,
    capacity: 6,
    intensity: "tranquilo",
  },
  {
    title: "Café y charla",
    activity: "cafe",
    zone: "usaquen",
    venue: "Plaza de Usaquén",
    address: "Cra. 6A con Calle 119",
    dias: [6, 0],
    hora: 10,
    durationMinutes: 90,
    capacity: 8,
    intensity: "tranquilo",
  },
  {
    title: "Cowork en silencio",
    activity: "cowork",
    zone: "chapinero",
    venue: "Biblioteca Virgilio Barco",
    address: "Av. Carrera 60 #57-60",
    dias: [1, 2, 3, 4, 5],
    hora: 9,
    durationMinutes: 180,
    capacity: 8,
    intensity: "tranquilo",
  },
  {
    title: "Cowork de la tarde",
    activity: "cowork",
    zone: "cedritos",
    venue: "Café con librería",
    address: "Calle 140 con Autopista",
    dias: [1, 2, 3, 4, 5],
    hora: 14,
    durationMinutes: 180,
    capacity: 6,
    intensity: "tranquilo",
  },
  {
    title: "Juegos de mesa",
    activity: "juego",
    zone: "chapinero",
    venue: "Café de juegos",
    address: "Calle 60 con Cra. 9",
    dias: [4, 5],
    hora: 19,
    durationMinutes: 150,
    capacity: 10,
    intensity: "tranquilo",
  },
  {
    title: "Ajedrez en el parque",
    activity: "juego",
    zone: "centro",
    venue: "Parque de los Periodistas",
    address: "Av. Jiménez con Cra. 3",
    dias: [6],
    hora: 15,
    durationMinutes: 120,
    capacity: 8,
    intensity: "tranquilo",
  },
  {
    title: "Fútbol 5",
    activity: "cancha",
    zone: "suba",
    venue: "Canchas sintéticas",
    address: "Av. Suba con Calle 127",
    dias: [2, 4],
    hora: 20,
    durationMinutes: 90,
    capacity: 10,
    intensity: "movido",
  },
  {
    title: "Pádel para principiantes",
    activity: "cancha",
    zone: "chico",
    venue: "Club de pádel",
    address: "Calle 100 con Cra. 15",
    dias: [3, 6],
    hora: 18,
    durationMinutes: 90,
    capacity: 8,
    intensity: "movido",
  },
  {
    title: "Baloncesto abierto",
    activity: "cancha",
    zone: "teusaquillo",
    venue: "Parque Simón Bolívar",
    address: "Calle 63 con Cra. 60",
    dias: [6, 0],
    hora: 16,
    durationMinutes: 120,
    capacity: 12,
    intensity: "movido",
  },
];

/** Próxima ocurrencia de un plan recurrente, dentro de los próximos 7 días. */
function proximaFecha(dias: number[], hora: number): number {
  const ahora = new Date();
  for (let d = 0; d < 8; d++) {
    const fecha = new Date(ahora);
    fecha.setDate(ahora.getDate() + d);
    fecha.setHours(hora, 0, 0, 0);
    if (dias.includes(fecha.getDay()) && fecha.getTime() > ahora.getTime()) {
      return fecha.getTime();
    }
  }
  return ahora.getTime() + 86_400_000;
}

/**
 * Siembra el índice. Idempotente: si ya hay planes sembrados, no duplica.
 * Correr desde el dashboard de Convex.
 */
export const sembrarPlanes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existentes = await ctx.db.query("plans").collect();
    const yaSembrados = new Set(
      existentes.filter((p) => p.origin === "seeded").map((p) => p.title),
    );

    let creados = 0;

    for (const s of SEMILLAS) {
      if (yaSembrados.has(s.title)) continue;

      let venue = await ctx.db
        .query("venues")
        .withIndex("by_zone", (q) => q.eq("zone", s.zone))
        .filter((q) => q.eq(q.field("name"), s.venue))
        .first();

      const venueId =
        venue?._id ??
        (await ctx.db.insert("venues", {
          name: s.venue,
          address: s.address,
          zone: s.zone,
          isPublic: true, // siempre público, nunca casa de nadie
        }));

      await ctx.db.insert("plans", {
        title: s.title,
        activity: s.activity,
        intensity: s.intensity,
        zone: s.zone,
        venueId,
        startsAt: proximaFecha(s.dias, s.hora),
        durationMinutes: s.durationMinutes,
        capacity: s.capacity,
        minPeople: 3, // nivel 1: mínimo tres, nunca dos desconocidos solos
        requiredTrustLevel: 1,
        origin: "seeded",
        qrToken: crypto.randomUUID(),
        // Sembrados nacen "active": son planes reales que ya ocurren en la
        // ciudad, no dependen de que se llene un aforo.
        status: "active",
        activatedAt: Date.now(),
      });
      creados++;
    }

    return { creados, yaExistian: yaSembrados.size };
  },
});

/** Borra solo lo sembrado. No toca planes de organizadores ni de matches. */
export const limpiarSembrados = internalMutation({
  args: {},
  handler: async (ctx) => {
    const sembrados = await ctx.db
      .query("plans")
      .filter((q) => q.eq(q.field("origin"), "seeded"))
      .collect();

    for (const p of sembrados) await ctx.db.delete(p._id);
    return { borrados: sembrados.length };
  },
});
