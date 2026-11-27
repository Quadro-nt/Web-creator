<!-- Copia de quadro-squad (commit ff6dda7). No editar aqui: se edita en quadro-squad. -->

# Ruteo de modelos y motores

> Versión 1.0 — Antigravity nativo (`/swarm`, `/teamwork`, `run_workflow`) + autonomía de `commit`/`push` con escaneo de secretos.
> `scripts/cuota.py` aplica la tabla de modelos: si cambia una, cambia la otra. Los slugs de `agy` se confirman con `agy models`.

## Tamaño del ticket y Gates

| Tamaño | Ejemplos | Spec | Gate previo | Verificación final independiente |
|---|---|---|---|---|
| **S** | cambiar un texto, arreglar un bug obvio, ajustar estilos | 2-3 líneas | **No** *(salvo si es sensible o ambiguo)* | **No** *(salvo sensible)* |
| **M** | un feature acotado, un endpoint, una pantalla | corto en `.agents/tickets/` (o en el plan) | **No** *(salvo si es sensible o ambiguo)* | **Sí** |
| **L** | arquitectura, integraciones, pagos, datos de clientes | completo | **Sí** *(o lanzar directo con `/teamwork`)* | **Sí** |

## Modelo por rol

| Rol | Por defecto | Alternativa / fallback |
|---|---|---|
| Coordinador (UI `/squad-ag` / `/swarm`) | **Orchestrator** (`Neon` en Pro; `Carbon` en Ultra) | CLI `agy`: `gemini-4-neon-medium` (S/M) y `gemini-4-carbon-high` (L; fallback `gemini-4-neon-high`) |
| Ejecutor S | Tier `flash` / `gemini-4-hydrogen-low` | `gemini-4-neon-low` |
| Ejecutor M y sensible* | Tier `flash` / `gemini-4-hydrogen-medium` | `gemini-4-neon-medium` |
| Ejecutor difícil | `gemini-4-neon-medium` (vía `swarm` o CLI) | `gemini-4-hydrogen-high` |
| Compuerta por tarea | Sin modelo: comandos de `PROYECTO.md` + `escanear-fugas.py` | — |
| Verificador final (M, L y todo ticket sensible) | Tier `pro` / `gemini-4-neon-high` (distinto de los ejecutores Hydrogen) | `gemini-4-carbon-high` |

### Salvaguardas para tickets sensibles

*Sensible: toca datos de clientes, pagos/precios, esquema de base de datos, auth/permisos, integraciones críticas (Meta/WhatsApp/Gmail) o zonas sensibles declaradas en `PROYECTO.md`.*

Todo ticket sensible activa estas 5 capas:
1. **Gate previo obligatorio** (incluso si es tamaño S o M).
2. **Verificación final obligatoria** (`"sensible": true` fuerza verificador `pro` / `Neon` / `Carbon`).
3. **Worktrees/ramas sin `.env`** (los `.env` reales no están en git y están excluidos del sandbox).
4. **Revisión de secretos antes de publicar**: `escanear-fugas.py` en `pre-commit`, `pre-push` y verificación `--range main..HEAD`, además de lista cerrada de archivos por tarea.
5. **Cero ejecución de scripts reales** de producción (quedan como paso manual de Lionel al cierre) y **prohibido push directo a `main`** (se publica en `squad/<ticket>/integracion`).

## Revisión por resultado y cierre autónomo

Se revisa el resultado, no cada tarea (Constitución, Art. 5):
1. **Compuerta sin modelo** por tarea (`PROYECTO.md`).
2. **Verificación final independiente** (en M, L y todo ticket sensible) sobre la rama de integración.
3. **Escaneo obligatorio de fugas** (`python .squad/scripts/escanear-fugas.py --range main..HEAD`).
4. **Publicación autónoma (`commit` + `push`)**:
   - Si `PROYECTO.md` declara `Auto-deploy en main: No` y el ticket es **S o M no sensible** → puede integrar en `main` y hacer `git push origin main`.
   - Si `Auto-deploy en main: Sí` (o no confirmado, o ticket **L / sensible**) → hace `git push -u origin squad/<ticket>/integracion` y avisa a Lionel para que revise preview/CI y apruebe el merge a `main`.

## Bolsas y umbrales

| Bolsa | Cómo se mide | Se renueva | Observado |
|---|---|---|---|
| Gemini Models | `agy -p /usage` → `Gemini Models` | semanal + ventana de 5 h | cubre `Hydrogen`, `Neon`, `Carbon` y `Orchestrator` en bolsa unificada |
| Gemini 4 Pro (Neon / Carbon) | `agy -p /usage` → fila propia (si el plan la separa) | semanal + ventana de 5 h | si no aparece fila aparte, comparte `Gemini Models` |

La bolsa `"Claude and GPT models"` de Antigravity **no se usa** en el flujo por defecto.

- **Bajo 30 %:** avisar antes de lanzar y pasar a alternativa si existe una bolsa separada disponible.
- **Bajo 15 %:** **no lanzar** (`ESCALATION` a Lionel).
- **Modelos en retiro:** `gemini-3.8-flash-*` y `gemini-4-argon-*` no se usan. Ejecución = `gemini-4-hydrogen-*`; razonamiento y verificación = `gemini-4-neon-*` (y `gemini-4-carbon-*` en reserva L).
- **Esfuerzo (`agy` CLI):** `low` para tareas S y QA; `medium` por defecto; `high` para planificar L y verificación final de tickets L.

## Triage del ticket (elección de motor nativo)

Si un ticket es **sensible** o **L**, activa **Gate previo**. Luego `/squad-ag` evalúa esta tabla de arriba hacia abajo (aplica **la primera fila que coincida**):

| Prioridad | Señal al medir el ticket | Motor | Acción |
|---|---|---|---|
| **1. Bug duro** | Bug difícil y acotado (causa incierta, regresión sutil, race condition en pocos archivos) | **`/boost`** *(UI)* | Frena sin gastar cuota y entrega el prompt listo con síntoma y comando reproductor para lanzar `/boost`. |
| **2. Largo / L abierto** | Trabajo de varias horas/días, exploración abierta o arquitectura desde cero | **`/teamwork`** *(nativo)* | Da a elegir: **(a)** partirlo en 2-4 tickets M, o **(b)** lanzar `/teamwork` con prompt que incluye **ruta exacta del repo**, verificación de `PROYECTO.md`, escaneo de secretos y zonas fuera de alcance. |
| **3. Coordinado (2-5 tareas)** | Tareas que negocian contratos en vivo mientras codifican (ej. API + UI + tests) o requieren asignar modelo exacto por worker | **`/swarm`** *(nativo)* | Coordina workers en `workspace: "share"` (`gemini-4-hydrogen-medium`), pizarra compartida (`swarm_pane`), compuerta sin modelo, verificador `gemini-4-neon-high`, `escanear-fugas.py` y merge antes de `kill`. |
| **4. Paralelo por capas** | 3+ tareas repetitivas o independientes con listas de archivos separables | **`run_workflow`** (`squad_ticket.py`) | Flujo determinista por capas (`workspace: "share"`), compuerta sin modelo, verificación final y escaneo de secretos automático. |
| **5. Directo / Ágil** | Ticket S (1-2 archivos) o M simple (1-2 tareas acotadas sin cruce de contratos) | **Ejecución directa / `invoke_subagent`** | Sin overhead de `run_workflow` ni `swarm`: se ejecuta en la sesión actual (o con subagente `flash` + verificador `pro` en M), corre `PROYECTO.md` + `escanear-fugas.py`, hace `commit` y `push`. |

Reglas: máximo 3 tareas en paralelo por capa; bolsa bajo 30 % = avisar, bajo 15 % = no lanzar.
