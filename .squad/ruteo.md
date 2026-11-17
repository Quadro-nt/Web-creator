<!-- Copia de quadro-squad (commit d8f19e0). No editar aqui: se edita en quadro-squad. -->

# Ruteo de modelos

> Versión 0.5. `scripts/cuota.py` aplica esta tabla: si cambia una, cambia la otra. Basado en las mediciones de spike/ y spike2/ (nov 2026).
> Los slugs de agy se confirman con `agy models`.

## Tamaño del ticket

| Tamaño | Ejemplos | Spec | Gate de spec |
|---|---|---|---|
| **S** | cambiar un texto, arreglar un bug obvio, ajustar estilos | 2-3 líneas en la tarea | No |
| **M** | un feature acotado, un endpoint, una pantalla | corto | Sí |
| **L** | arquitectura, integraciones, pagos, datos de clientes | completo | Sí, y considerar partir en varios M |

## Modelo por rol

| Rol | Por defecto | Si su bolsa baja del umbral | Reserva |
|---|---|---|---|
| Planificador (ticket S o M) | Claude Code · Sonnet 5.5 | agy · `gemini-4-argon-medium` | — |
| Planificador (ticket L) | Claude Code · Opus 5.5 | Claude Code · Sonnet 5.5 | agy · `gemini-4-argon-medium` |
| Ejecutor S | agy · `gemini-3.8-flash-low` | agy · `gemini-4-argon-medium`; último recurso Claude Code · Haiku 5.5 | — |
| Ejecutor M | agy · `gemini-3.8-flash-medium` | agy · `gemini-4-argon-medium`; último recurso Claude Code · Sonnet 5.5 | — |
| Ejecutor sensible* | agy · `gemini-3.8-flash-medium`, con las salvaguardas de abajo | agy · `gemini-4-argon-medium` | — |
| Ejecutor difícil | agy · `gemini-4-argon-medium` | Claude Code · Sonnet 5.5 | — |
| Compuerta por tarea | Sin modelo: la corre el planificador (comandos de `PROYECTO.md`) | — | — |
| Verificador final (una vez por ticket M/L), ejecutores Gemini | Claude Code · Sonnet 5.5 | agy · `gemini-3.8-flash-high` | — |
| Verificador final, ejecutores Claude | agy · `gemini-3.8-flash-high` | Claude Code · Sonnet 5.5 (sesión distinta) | — |

*Sensible: toca datos de clientes, integraciones con Meta/WhatsApp/Gmail, precios o esquema de base de datos.
**Decisión (9 nov 2026): todos los ejecutores son Gemini (`agy`)**, para cuidar la cuota de Claude. Claude se
reserva para planificar y para la verificación final. Salvaguardas para tareas sensibles con `agy`
(los permisos por worktree solo existen en Claude Code, así que se compensa con otras capas):
- Los worktrees no contienen `.env` (no están en git): sin credenciales, una llamada real a un servicio falla.
- La lista de prohibidos de `agy` (push, borrar, red, secretos, lecturas fuera del worktree) sigue activa.
- Los hooks `pre-commit` y `pre-push` siguen bloqueando a los agentes.
- Verificación final obligatoria por otra familia (Claude) en todo ticket M y L.
- El `PROYECTO.md` lista qué scripts nunca se ejecutan (los que llaman a servicios reales).

## Revisión por resultado (12 nov 2026)

Se revisa el resultado, no cada tarea (Constitución, Art. 5): compuerta sin modelo por tarea y **una** verificación final
por ticket (M y L) que ejecuta los criterios del spec y lee el diff completo. Los tickets S solo pasan por la compuerta.
Motivo: la revisión por tarea duplicaba los agentes (tickets de 16 tareas, 8 de ellas de revisión) y un modelo que
solo lee el diff no ejecuta nada.

## Las tres bolsas

| Bolsa | Cómo se mide | Se renueva | Observado |
|---|---|---|---|
| Claude Code | `/usage` dentro de Claude Code | semanal + ventana de 5 h | sesiones largas y skills pesados son lo que más gasta |
| Gemini (Flash) | `agy -p /usage` → Gemini Models | semanal + ventana de 5 h | casi imperceptible por tarea chica |
| Gemini 4 Argon | `agy -p /usage` → Gemini 4 Argon | semanal | ~1-2 puntos por revisión mínima: **solo reserva** |

La bolsa "Claude and GPT models" de Antigravity **no se usa** en el flujo: su límite total es bajo.

## Umbrales

- Una bolsa **bajo 30%**: se pasa a la alternativa para tareas S y M.
- Una bolsa **bajo 15%**: se deja de usar salvo para la verificación final.
- **Argon** solo se usa en tareas L o cuando las otras dos bolsas están bajo 30%.
- Si todas las opciones de un rol están bajo umbral: **escalation**, no se improvisa.

## Esfuerzo

- `low`: tareas S y QA.
- `medium`: por defecto.
- `high`: planificar tickets L y verificación final de tickets L.

## Reglas de uso (aprendidas en producción, nov 2026)

- **Máximo 2 tickets simultáneos con Claude.** Cuatro planificadores y sus trabajadores en paralelo agotan
  la ventana de 5 horas en minutos. Lo que sobre espera o se pasa a `agy` si no es sensible.
- **Verificar el modelo al abrir la sesión** (`/model`): Orca puede arrancar Claude Code con un modelo
  anterior al configurado. El planificador debe ser Opus 5.5.
- **Slugs que no existen en agy:** `claude-sonnet-5-5-medium` no está disponible en el perfil actual.
  Revisor de código Gemini = `gemini-3.8-flash-high` hasta que se confirme otro slug con `agy models`.
- **Sensible por zona, no por repo.** Cada `PROYECTO.md` puede definir qué carpetas son sensibles
  (ver el CRM). Lo sensible va con Claude Code; lo demás, con `agy`.
- **Al agotarse una bolsa a media tarea:** no se cancela nada. Lo no sensible pendiente pasa a `agy`
  y lo sensible espera la renovación; el planificador deja un resumen antes de cerrar.

## Modo Antigravity completo (`/squad-ag`)

Todo dentro de Antigravity, sin Orca ni Claude Code. Motor: **`/run-workflow`** con el script guardado
`.agents/workflows/squad_ticket.py` (determinista: capas en paralelo, compuerta sin modelo, una verificación final).

| Rol | Cómo | Modelo |
|---|---|---|
| Planificador | Esta conversación (skill `/squad-ag`) | **Orchestrator** (Argon en Pro; Carbon en Ultra) |
| Ejecutor | Agente nativo `.agents/agents/ejecutor.md` | `flash` (por confirmar que el nivel "flash" corresponde a Gemini 4 Hydrogen) |
| Compuerta | El script del workflow, sin modelo | — |
| Verificador final | Agente nativo `.agents/agents/verificador.md` | `pro` (distinto de los ejecutores) |

Cuándo usar otras herramientas nativas:
- **`/boost`:** un bug difícil y acotado (varios intentos que se verifican entre sí).
- **`/swarm`:** solo si las tareas necesitan coordinarse entre sí mientras trabajan.
- **`/teamwork`:** solo proyectos L de varios días. Ojo: por defecto trabaja fuera del repo (`~/teamwork_projects/`)
  y revisa por hito (Critic, Challenger, Auditor), que es más caro; indica el repo en la entrevista inicial.

Reglas: máximo 3 tareas en paralelo por capa; bolsa bajo 30 % = avisar, bajo 15 % = no lanzar.
