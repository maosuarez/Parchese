// Chatea con el bot sin desplegar nada.
//
//   MINIMAX_API_KEY=tu_key node scripts/chat.mjs
//
// Simula el flujo completo: extrae la intención, la guarda en memoria y
// hace match contra las intenciones que ya escribiste. Sirve para sentir
// el producto y para afinar el system prompt sin tocar Convex ni WhatsApp.

import Anthropic from "@anthropic-ai/sdk";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const client = new Anthropic({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: "https://api.minimax.io/anthropic",
});

const MODELO = process.env.MINIMAX_MODEL ?? "MiniMax-M2.5";
const ACTIVIDADES = ["caminar", "cafe", "cowork", "juego", "cancha", "otro"];

const SYSTEM = `Eres el asistente de PulseUp, que ayuda a la gente en Bogotá a encontrar con quién hacer un plan hoy.

Tu único trabajo es leer lo que la persona escribe y llamar a la herramienta registrar_intencion con lo que entendiste.

Actividades posibles:
- caminar: caminata, salir a andar, trote suave, sacar el perro
- cafe: tomar café, desayunar, almorzar, charlar en un café
- cowork: trabajar acompañado, estudiar junto a alguien, cowork en silencio
- juego: juegos de mesa, cartas, ajedrez, videojuegos presenciales
- cancha: fútbol, básquet, tenis, pádel, cualquier deporte de cancha
- otro: cualquier plan que no encaje arriba

Zonas de Bogotá: chapinero, usaquen, suba, teusaquillo, centro, chico, cedritos, kennedy, engativa, fontibon, candelaria, norte, sur, occidente. Normaliza sin tildes y en minúscula. "El norte" es norte. "La 93" o "zona T" es chico.

Reglas:
- Si no entiendes la actividad, la zona o cuándo quiere, pon confident en false. NUNCA inventes.
- Si no dice duración, asume 2 horas.
- Si dice "ahora" o "ya", hoursFromNow es 0. "Más tarde" o "esta tarde" es 3. "En la noche" es 5.
- Nunca menciones salud, sedentarismo, ejercicio como obligación, ni sugieras que la persona debería moverse o salir más. Ni una palabra sobre eso.
- Escribe en español de Colombia, cercano y breve. Sin emojis en exceso.`;

const TOOL = {
  name: "registrar_intencion",
  description:
    "Registra lo que la persona quiere hacer. Llama siempre a esta herramienta, incluso cuando no estés seguro (con confident en false).",
  input_schema: {
    type: "object",
    properties: {
      activity: { type: "string", enum: ACTIVIDADES },
      zone: { type: "string" },
      hoursFromNow: { type: "number" },
      durationHours: { type: "number" },
      confident: { type: "boolean" },
    },
    required: ["activity", "zone", "hoursFromNow", "durationHours", "confident"],
  },
};

/** Intenciones abiertas, en memoria. Hace las veces de la tabla `intents`. */
const abiertas = [];
let quienSoy = "tu";

const solapan = (a, b) =>
  a.windowStart < b.windowEnd && b.windowStart < a.windowEnd;

async function extraer(texto) {
  const res = await client.messages.create({
    model: MODELO,
    max_tokens: 1024,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "registrar_intencion" },
    messages: [{ role: "user", content: texto }],
  });
  const b = res.content.find((x) => x.type === "tool_use");
  return b ? b.input : null; // MiniMax a veces ignora tool_choice — ver docs
}

const rl = readline.createInterface({ input: stdin, output: stdout });

console.log(`
  PulseUp · chat local          modelo: ${MODELO}

  Escribe como si le hablaras al bot por WhatsApp.
  Comandos:  /yo <nombre>   cambiar de persona (para probar el match)
             /abiertas      ver las intenciones sin emparejar
             /salir
`);

while (true) {
  const texto = (await rl.question(`${quienSoy} › `)).trim();
  if (!texto) continue;

  if (texto === "/salir") break;
  if (texto.startsWith("/yo ")) {
    quienSoy = texto.slice(4).trim() || "tu";
    console.log(`   ahora eres ${quienSoy}\n`);
    continue;
  }
  if (texto === "/abiertas") {
    if (abiertas.length === 0) console.log("   (ninguna)\n");
    for (const i of abiertas) {
      console.log(`   ${i.autor}: ${i.activity} · ${i.zone}`);
    }
    console.log();
    continue;
  }

  let i;
  try {
    i = await extraer(texto);
  } catch (e) {
    console.log(`   💥 ${e.message}\n`);
    continue;
  }

  if (!i || !i.confident) {
    console.log(`   bot › ¿Qué te provoca hacer hoy?`);
    console.log(`         [ Caminar ]  [ Un café ]  [ Trabajar cerca ]\n`);
    continue;
  }

  const windowStart = Date.now() + i.hoursFromNow * 3_600_000;
  const nueva = {
    autor: quienSoy,
    activity: i.activity,
    zone: i.zone,
    windowStart,
    windowEnd: windowStart + i.durationHours * 3_600_000,
  };

  const otra = abiertas.find(
    (c) =>
      c.autor !== nueva.autor &&
      c.activity === nueva.activity &&
      c.zone === nueva.zone &&
      solapan(c, nueva),
  );

  if (otra) {
    abiertas.splice(abiertas.indexOf(otra), 1);
    const hora = new Date(
      Math.max(nueva.windowStart, otra.windowStart),
    ).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    console.log(`   ✨ MATCH con ${otra.autor}`);
    console.log(
      `   bot › Hay plan: ${i.activity} en ${i.zone}, a las ${hora}. Van 2 personas.\n`,
    );
  } else {
    abiertas.push(nueva);
    console.log(
      `   bot › Listo, anoté ${i.activity} por ${i.zone}. Si alguien más se apunta, te aviso.`,
    );
    console.log(`         (${abiertas.length} intención(es) abierta(s))\n`);
  }
}

rl.close();
