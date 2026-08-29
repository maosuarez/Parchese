import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: "https://api.minimax.io/anthropic",
});

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

const CASOS = [
  "quiero salir a caminar por chapinero en 2 horas",
  "uy me provoca un tinto con alguien, por la 93, ahorita",
  "alguien pa jugar parqués esta noche en cedritos?",
  "hola",
  "qué hay para hacer",
  "necesito trabajar pero solo en la casa me da pereza, algo por usaquén hoy",
  "hay pichanga hoy por suba?",
  "voy a sacar al perro más tarde por el parque de la 93",
  "estoy aburrido",
  "quiero conocer gente",
];

const MODELO = process.env.MINIMAX_MODEL ?? "MiniMax-M2.5";
console.log(`Modelo: ${MODELO}\n${"─".repeat(70)}`);

for (const texto of CASOS) {
  const t0 = Date.now();
  try {
    const res = await client.messages.create({
      model: MODELO,
      max_tokens: 1024,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "registrar_intencion" },
      messages: [{ role: "user", content: texto }],
    });

    const ms = Date.now() - t0;
    const bloque = res.content.find((b) => b.type === "tool_use");

    if (!bloque) {
      console.log(`❌ "${texto}"\n   sin tool_use — stop_reason: ${res.stop_reason}\n`);
      continue;
    }

    const i = bloque.input;
    const ok = i.confident ? "✅" : "❓";
    console.log(
      `${ok} "${texto}"\n   ${i.activity} · ${i.zone} · en ${i.hoursFromNow}h · dura ${i.durationHours}h · confident=${i.confident}   [${ms}ms · ${res.usage.input_tokens}in/${res.usage.output_tokens}out]\n`,
    );
  } catch (e) {
    console.log(`💥 "${texto}"\n   ${e.message}\n`);
  }
}
