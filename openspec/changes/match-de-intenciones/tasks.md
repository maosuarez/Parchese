# Tareas — Match de intenciones

Dueño: **Dev B**. Trozos de máximo 2 horas, verificables por separado.

---

- [ ] **1. Tablas `intents` y `plans` en `convex/schema.ts`**
      Campos según `docs/03-modelo-de-datos.md`, más el índice `by_open` sobre `["status", "activity", "zone"]`.
      *Verificación:* `npx convex dev` levanta sin errores y las tablas aparecen en el dashboard.
      ⚠️ Definir con Dev A y Dev C presentes. Después de esto, el schema se congela.

- [ ] **2. `internalMutation` para sembrar intenciones a mano**
      Recibe autor, actividad, zona y ventana; inserta en estado `open`.
      *Verificación:* se puede crear una intención desde el dashboard de Convex.
      Esto desbloquea todo lo demás y es el plan B del demo.

- [ ] **3. La función de solapamiento, aislada**
      `solapan(a, b) => a.windowStart < b.windowEnd && b.windowStart < a.windowEnd`
      *Verificación:* casos a mano — ventanas idénticas, contenida, adyacentes sin tocarse, disjuntas.
      Adyacentes (una termina justo cuando la otra empieza) **no** se solapan.

- [ ] **4. El match**
      Mutation que, al insertar una intención, busca compatibles (`open`, misma actividad, misma zona, ventana solapada, **otro autor**), y si encuentra crea el plan y marca ambas `matched`. Con más de una candidata, gana la más antigua.
      *Verificación:* sembrar dos intenciones compatibles produce un plan; dos incompatibles, ninguno; dos del mismo autor, ninguno.
      **Este es el wow moment. Si algo se corta, esto no.**

- [ ] **5. Notificación agendada**
      `ctx.scheduler.runAfter(0, ...)` hacia una action que avisa a ambas partes.
      *Verificación:* al crear el plan queda una función agendada visible en el dashboard.
      Coordinar con Dev A el envío real por WhatsApp; mientras tanto, un log basta.

- [ ] **6. Vencimiento por cron**
      Cada 5 minutos, marcar `expired` las intenciones abiertas con la ventana ya pasada.
      *Verificación:* una intención con ventana vencida pasa a `expired` **y no se envía ningún mensaje**.

- [ ] **7. Auditoría de invisibilidad**
      Revisar cada query pública del proyecto y confirmar que ninguna expone intenciones `open` de otra persona — incluidos contadores agregados.
      *Verificación:* recorrer las queries una por una. Es la regla que más fácil se rompe sin darse cuenta.

---

## Si aprieta el tiempo

Orden de corte: **7 → 6 → 5**. Las tareas 1 a 4 no se cortan.
