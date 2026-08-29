# Tareas — Match de intenciones

Dueño: **Luis** (Dev B). Trozos de máximo 2 horas, verificables por separado.

---

- [x] **1. Tablas `intents` y `plans` en `convex/schema.ts`**
      Campos según `docs/03-modelo-de-datos.md`, más el índice `by_open` sobre `["status", "activity", "zone"]`.
      *Verificación:* `npx convex dev` levanta sin errores y las tablas aparecen en el dashboard.
      ⚠️ Definir con Dev A y Dev C presentes. Después de esto, el schema se congela.

- [x] **2. `internalMutation` para sembrar intenciones a mano**
      Recibe autor, actividad, zona y ventana; inserta en estado `open`.
      *Verificación:* se puede crear una intención desde el dashboard de Convex.
      Esto desbloquea todo lo demás y es el plan B del demo.

- [x] **3. La función de solapamiento, aislada**
      `solapan(a, b) => a.windowStart < b.windowEnd && b.windowStart < a.windowEnd`
      *Verificación:* casos a mano — ventanas idénticas, contenida, adyacentes sin tocarse, disjuntas.
      Adyacentes (una termina justo cuando la otra empieza) **no** se solapan.

- [x] **4. El match**
      Mutation que, al insertar una intención, busca compatibles (`open`, misma actividad, misma zona, ventana solapada, **otro autor**), y si encuentra crea el plan y marca ambas `matched`. Con más de una candidata, gana la más antigua.
      *Verificación:* sembrar dos intenciones compatibles produce un plan; dos incompatibles, ninguno; dos del mismo autor, ninguno.
      **Este es el wow moment. Si algo se corta, esto no.**

- [x] **5. Notificación agendada**
      `ctx.scheduler.runAfter(0, ...)` hacia una action que avisa a ambas partes.
      *Verificación:* al crear el plan queda una función agendada visible en el dashboard.
      Coordinar con Dev A el envío real por WhatsApp; mientras tanto, un log basta.

- [x] **6. Vencimiento por cron**
      Cada 5 minutos, marcar `expired` las intenciones abiertas con la ventana ya pasada.
      *Verificación:* una intención con ventana vencida pasa a `expired` **y no se envía ningún mensaje**.

- [x] **7. Auditoría de invisibilidad**
      Revisar cada query pública del proyecto y confirmar que ninguna expone intenciones `open` de otra persona — incluidos contadores agregados.
      *Verificación:* recorrer las queries una por una. Es la regla que más fácil se rompe sin darse cuenta.

      **Resultado de la auditoría (superficie pública completa):**
      - `matching.declararIntencion` (mutation): escribe una intención; devuelve `{ intentId, planId }`. Con match, `planId` revela solo que *hubo* reciprocidad (el reveal buscado). Sin match, `planId: null` — no filtra nada de terceros.
      - `matching.misIntenciones` (query): único lector de `intents` en la superficie pública. Filtra por `by_user` sobre el `userId` del arg. Sin agregados.
      - `matching.cancelarIntencion` (mutation): valida `intent.userId !== userId` → throw.
      - `trust.ts` (`checkInWithQR`, `puedeUnirse`, `revealContact`, `perfilExtendidoDe`, `reportar`): no tocan `intents` (grep confirmado).
      - `http.ts` webhook, acciones internas (`notify.datosDelPlan`, `bot.*`): `internal*`, no expuestas al cliente.
      - `src/`: cero referencias a `intents`.
      - No existe ningún contador agregado de intenciones en ningún archivo.
      **Riesgo abierto:** todas las funciones reciben `userId: v.id("users")` como argumento del cliente y el proyecto aún no tiene `ctx.auth` / `auth.config.ts`. Mientras no haya identidad autenticada, un cliente podría pasar el `userId` de otra persona a `misIntenciones` y ver sus intenciones `open`. Cerrarlo depende de la capa de auth del proyecto (deuda conocida en CLAUDE.md), fuera del alcance de este cambio. Al invariante de código — un solo lector, filtrado por autor, sin agregados — se cumple.

---

## Si aprieta el tiempo

Orden de corte: **7 → 6 → 5**. Las tareas 1 a 4 no se cortan.
