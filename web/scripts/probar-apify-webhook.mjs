// Prueba end-to-end de la ingesta de Apify sin depender de Apify.
//
//   cd web
//   APIFY_WEBHOOK_SECRET=tu_secreto node scripts/probar-apify-webhook.mjs
//
// Manda un payload simulado de Apify al webhook de Convex, reintenta para
// comprobar idempotencia, verifica que un token inválido reciba 401 y luego
// consulta Convex para confirmar que los planes sembrados quedaron con fecha
// futura y lugar público.
//
// La URL del deployment sale de VITE_CONVEX_SITE_URL (en web/.env.local) o de
// CONVEX_SITE_URL. El secreto tiene que coincidir con el APIFY_WEBHOOK_SECRET
// configurado en el entorno de Convex (`npx convex env set APIFY_WEBHOOK_SECRET ...`).

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function leerEnvLocal() {
  try {
    const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const out = {};
    for (const linea of txt.split("\n")) {
      const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}

const env = { ...leerEnvLocal(), ...process.env };
const SITE = (
  env.CONVEX_SITE_URL ||
  env.VITE_CONVEX_SITE_URL ||
  ""
).replace(/\/$/, "");
const SECRET = env.APIFY_WEBHOOK_SECRET;

if (!SITE) {
  console.error("Falta CONVEX_SITE_URL o VITE_CONVEX_SITE_URL.");
  process.exit(1);
}
if (!SECRET) {
  console.error("Falta APIFY_WEBHOOK_SECRET (el mismo que en el entorno de Convex).");
  process.exit(1);
}

const iso = (dias, hora) => {
  const d = new Date(Date.now() + dias * 86_400_000);
  d.setHours(hora, 0, 0, 0);
  return d.toISOString();
};

// Lote simulado: 3 eventos válidos en Bogotá, 1 sin fecha (se descarta en el
// filtro determinista) y 1 fuera de Bogotá (lo descarta el modelo).
const PAYLOAD = {
  platform: "luma",
  canal: "oferta",
  items: [
    {
      id: "luma-caminata-usaquen-001",
      title: "Caminata matutina por los cerros de Usaquén",
      description:
        "Recorrido guiado a pie saliendo del parque principal de Usaquén. Espacio público, apto para todos.",
      startDate: iso(2, 7),
      venue: "Parque de Usaquén",
      address: "Cra. 6a #117-A, Bogotá",
      url: "https://lu.ma/caminata-usaquen",
    },
    {
      id: "luma-cowork-chapinero-002",
      title: "Jornada de coworking en Chapinero",
      description:
        "Sesión de trabajo acompañado en una cafetería-biblioteca abierta al público sobre la carrera 13.",
      startDate: iso(1, 9),
      venue: "Café Biblioteca 13",
      address: "Cra. 13 #53-20, Bogotá",
      url: "https://lu.ma/cowork-chapinero",
    },
    {
      id: "luma-juego-centro-003",
      title: "Noche de juegos de mesa en La Candelaria",
      description:
        "Mesa abierta de juegos de mesa en un centro cultural de La Candelaria. Entrada libre.",
      startDate: iso(3, 18),
      venue: "Centro Cultural La Candelaria",
      address: "Calle 12 #2-40, Bogotá",
      url: "https://lu.ma/juegos-candelaria",
    },
    {
      id: "luma-sin-fecha-004",
      title: "Evento por confirmar",
      url: "https://lu.ma/por-confirmar",
    },
    {
      id: "luma-medellin-005",
      title: "Feria del libro de Medellín",
      description: "Gran feria en el Jardín Botánico de Medellín.",
      startDate: iso(5, 10),
      venue: "Jardín Botánico",
      address: "Cra. 52 #73-298, Medellín",
      url: "https://lu.ma/feria-medellin",
    },
  ],
};

async function postWebhook(token, body) {
  const res = await fetch(`${SITE}/webhook/apify?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.status;
}

function convexRun(fn) {
  const salida = execSync(`npx convex run "${fn}" '{}'`, {
    cwd: new URL("..", import.meta.url).pathname,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  // `convex run` imprime la línea de conexión antes del JSON.
  const inicio = salida.indexOf("{");
  return JSON.parse(salida.slice(inicio));
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`Webhook: ${SITE}/webhook/apify`);
console.log("─".repeat(70));

// 1. Token inválido → 401
const s401 = await postWebhook("token-que-no-es", PAYLOAD);
console.log(`${s401 === 401 ? "✅" : "❌"} token inválido → ${s401} (esperado 401)`);

// 2. Envío válido → 200
const s200 = await postWebhook(SECRET, PAYLOAD);
console.log(`${s200 === 200 ? "✅" : "❌"} lote válido → ${s200} (esperado 200)`);

// 3. Reenvío del mismo lote → 200 y sin duplicados (idempotencia por externalId)
const sDup = await postWebhook(SECRET, PAYLOAD);
console.log(`${sDup === 200 ? "✅" : "❌"} reenvío → ${sDup} (esperado 200, sin duplicar)`);

// 4. Esperar la normalización asíncrona (LLM) y consultar el resultado.
console.log("\nEsperando la normalización (hasta 40s)…");
let estado = null;
for (let i = 0; i < 8; i++) {
  await espera(5000);
  try {
    estado = convexRun("sources/apify:inspeccionarSiembraApify");
  } catch (e) {
    console.error("No se pudo consultar Convex:", e.message.split("\n")[0]);
    break;
  }
  if (estado && estado.sources.pending === 0) break;
}

if (estado) {
  console.log("\nEstado de las fuentes:", estado.sources);
  console.log(`Planes sembrados: ${estado.planesSembrados.length}`);
  for (const p of estado.planesSembrados) {
    const ok = p.futuro && p.venue && p.venue.isPublic;
    console.log(
      `  ${ok ? "✅" : "❌"} ${p.title} · ${p.activity} · ${p.zone} · ${new Date(p.startsAt).toLocaleString("es-CO")} · ${p.status} · venue=${p.venue ? p.venue.name : "—"}`,
    );
  }
  const todosFuturos = estado.planesSembrados.every((p) => p.futuro);
  const todosPublicos = estado.planesSembrados.every(
    (p) => p.venue && p.venue.isPublic,
  );
  console.log(
    `\n${todosFuturos && todosPublicos ? "✅" : "❌"} Todos los planes con fecha futura y lugar público.`,
  );
  if (estado.sources.pending > 0) {
    console.log(
      "ℹ️  Quedan fuentes pending: revisa que MINIMAX_API_KEY esté configurada en el entorno de Convex.",
    );
  }
}
