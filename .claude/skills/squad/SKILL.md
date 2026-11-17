---
name: squad
description: Arranca el planificador del escuadrón de agentes para un ticket. Usar cuando se invoque /squad <objetivo del ticket> en un repo que tenga la carpeta .squad/.
---

# Skill: /squad

Arranca el planificador del escuadrón para un ticket.

Invocación: `/squad <objetivo del ticket>`

---

## PASO 0 — Lectura obligatoria antes de cualquier otra acción

Lee estos archivos en orden. No saltes ninguno.

1. `AGENTS.md` — jerarquía de instrucciones y documentos del squad
2. `.squad/CONSTITUCION.md` — reglas que no se rompen
3. `.squad/roles/planificador.md` — tu manual de rol
4. `.squad/ruteo.md` — modelos y umbrales de cuota
5. `PROYECTO.md` — stack, comandos de verificación, zonas prohibidas

Luego ejecuta:
```
python C:\dev\ORCA\quadro-squad\scripts\cuota.py --texto
```
Usa el ruteo recomendado para asignar modelos a cada rol en el ticket.

**Quién ejecuta (obligatorio):**
- El modelo de cada tarea sale **solo** de la salida de `cuota.py` (roles `ejecutor_s`, `ejecutor_m`,
  `ejecutor_sensible`, `ejecutor_dificil`). Los ejecutores son **Gemini (`agy`)**; Claude Code solo aparece
  como último recurso cuando `cuota.py` lo indica.
- **Ignora los nombres "Orca" y "Antigravity" de las tablas de dueños de carpetas** (AGENTS.md,
  PROYECTO.md): son nombres de zona, no el modelo que ejecuta. Una tarea de backend NO va a Claude por ser de "Orca".
- Si `PROYECTO.md` dice algo distinto sobre el ejecutor, vale `.squad/ruteo.md`; si hay duda, pregunta a Lionel.
- En el spec y en la tabla de tareas escribe el modelo concreto (ej. `agy · gemini-3.8-flash-medium`), no "Orca".
- Planificador S/M: Sonnet. Opus solo en tickets L.
Si alguna bolsa está en CRITICO y el rol no tiene alternativa → escala antes de continuar.

---

## PASO 1 — Entender y clasificar el ticket

**Si el objetivo es ambiguo** (no queda claro qué archivos toca, qué criterio es éxito, o hay
riesgo de pagar/desplegar/tocar datos de clientes): detente y pide clarificación a Lionel.
No planifiques sobre supuestos.

**Clasifica el tamaño** según `.squad/ruteo.md`:
- **S**: cambio puntual, 1-2 archivos, criterio obvio → sin gate
- **M**: feature acotado, varios archivos → gate antes de despachar
- **L**: arquitectura / integraciones / pagos → gate + considera partirlo en M

---

## PASO 2 — Explorar una sola vez

Usa Graphify si el repo lo tiene. Lee solo lo necesario para el spec.
No explores por explorar (Art. 6 — los tokens son plata).

---

## PASO 3 — Escribir el spec y calcular ETA

Escribe el spec del ticket con:
- Objetivo
- Lista de tareas (sin cruces de archivos entre tareas paralelas)
- Para cada tarea: objetivo, archivos que puede tocar, contrato entre tareas, criterio de éxito, modelo asignado
- Ramas: `squad/<ticket>/<tarea>` para cada trabajador

**Calcula el ETA** (hora de Lima) usando los valores del `Historial de tiempos` de `PROYECTO.md`.
Si no hay historial, usa estos valores y dilo explícitamente ("sin historial, estimación gruesa"):
- Tarea S: ~5 min | Tarea M: ~15-25 min | Verificación final: ~10-15 min | Integración: ~10 min

Las tareas paralelas cuentan una vez (la más larga). Las secuenciales se suman.
Suma margen para la verificación final, una posible ronda de correcciones e integración.

**Para ticket S**: empieza directamente en PASO 4 (sin gate).

**Para ticket M o L**: abre un gate antes de despachar.

---

## PASO 4 — Gate de spec (tickets M y L)

```bash
# Crear run primero
orca orchestration run-create --objective "<ticket-nombre>" --json
# Guarda el runId

# Crear la tarea de revisión de spec (tarea ficticia para el gate)
orca orchestration task-create \
  --run <runId> \
  --task-title "gate: aprobacion de spec" \
  --deps "[]" \
  --spec "<spec completo del ticket>"

# Crear el gate
# IMPORTANTE: usar Bash (no PowerShell) para --options con array JSON
orca orchestration gate-create \
  --task <taskId> \
  --question "Spec del ticket '<nombre>'. ETA: <HH:MM> (Lima). ¿Apruebas?" \
  --options '["Aprobado","Cambios","Cancelar"]'
```

**Además del gate, pregunta en tu propia terminal** y quédate esperando la respuesta:

```
GATE <ticket> — spec + ETA arriba. Responde: Aprobado / Cambios: <qué> / Cancelar
```

Lionel puede responder aquí, desde la PC o desde la app móvil de Orca. En cuanto responda,
resuelve el gate con `orca orchestration gate-resolve --id <gateId> --resolution "<respuesta>"`
y continúa sin esperar otro mensaje.
Si Lionel dice "Cambios" → ajusta el spec y vuelve a gatear.
Si dice "Cancelar" → cierra el run con `orca orchestration send --type escalation`.

---

## PASO 5 — Crear tareas con dependencias

**Solo tareas de ejecución.** No crees tareas de revisión por cada una: la compuerta (tests, tipos, build)
la corres tú al recibir cada `worker_done` (PASO 7). Las tareas que necesitan el trabajo de `Tn` dependen de `Tn`.
Escribe los criterios de éxito de cada spec como **comandos o consultas ejecutables** (Constitución, Art. 5).

Ejemplo: T1 → (T2 y T3 en paralelo) → integración → verificación final (M y L).

```bash
# Tarea sin dependencias (lista inmediatamente)
orca orchestration task-create \
  --run <runId> \
  --task-title "<T1: descripcion>" \
  --deps "[]" \
  --spec "<spec detallado con archivos, criterio de éxito, rama>"

# Tarea con dependencias (queda pending hasta que sus deps completen)
# IMPORTANTE: usar Bash para el JSON array en --deps
orca orchestration task-create \
  --run <runId> \
  --task-title "<T3: descripcion, depende de T1 y T2>" \
  --deps '["<taskId1>","<taskId2>"]' \
  --spec "<spec>"
```

---

## PASO 6 — Lanzar trabajadores

```bash
# Worker Claude Code
orca orchestration worker-start \
  --run <runId> \
  --task <taskId> \
  --agent claude \
  --model <slug-de-ruteo> \
  --effort <low|medium|high> \
  --worktree <nombre-worktree>

# Worker agy (Antigravity)
orca orchestration worker-start \
  --run <runId> \
  --task <taskId> \
  --agent antigravity \
  --model <slug-de-ruteo> \
  --effort <low|medium|high> \
  --worktree <nombre-worktree>

# Si un worker queda bloqueado (needs-input) → parar y relanzar
orca orchestration worker-stop --dispatch <ctxId>
orca orchestration worker-start ... --retry-of <ctxId>
```

**Cada trabajador en su propio worktree (obligatorio).**
- Nunca uses el checkout principal del repo (el "primary") como worktree de un trabajador.
- Usa un nombre nuevo por tarea: `<ticket>-<tarea>` (ej. `heritage-favoritos-core`).
- Después de lanzarlo, verifica con `orca worktree ps --json` que la ruta del worktree esté bajo
  `C:\Users\lione\orca\workspaces\`. Si cayó en el repo principal, detén al trabajador
  (`worker-stop`) y relánzalo en un worktree nuevo.
- Tú tampoco cambias de rama en el checkout principal: debe quedar siempre en `main`.

**Validar el modelo antes de lanzar (obligatorio).** Corre `agy models` una vez por ticket y usa
solo slugs que aparezcan en esa lista. Para Claude Code usa los nombres que acepta `/model`.
Si el slug de `.squad/ruteo.md` no existe, usa la alternativa del ruteo y anótalo como aprendizaje.

**Slugs de modelo validados** (de `agy models` + Claude Code):
- `gemini-3.8-flash-low`, `gemini-3.8-flash-medium`, `gemini-3.8-flash-high`
- `gemini-4-argon-low`, `gemini-4-argon-medium`, `gemini-4-argon-high`
- Para Claude Code: pasar sin `--model` y Claude Code usa el modelo del perfil activo,
  o bien `--model claude-sonnet-5-5-medium` etc.

**Esfuerzo según `.squad/ruteo.md`**:
- `low`: tareas S y QA
- `medium`: por defecto (tareas M)
- `high`: planificar L y verificación final de tickets L

---

## PASO 7 — Monitorear workers y procesar mensajes

```bash
# Sondear mensajes del run
orca orchestration check --run <runId> --types worker_done,escalation
```

**No termines tu turno mientras haya tareas activas.** Espera los avisos en un ciclo:

```bash
orca orchestration check --run <runId> --wait --types worker_done,escalation --timeout-ms 300000
```

Si vence el tiempo sin mensajes, vuelve a llamar (no es un error).

**Trabajador quieto sin `worker_done` (pasa seguido):** si un trabajador lleva ~10 min sin
mensajes, lee su terminal (`orca terminal read --terminal <handle>`):
- Si ya terminó pero no avisó → pídele que envíe el `worker_done` con el formato de su rol
  (`orca terminal send --terminal <handle> --text "..." --enter`).
- Si está esperando una aprobación o un input → no la apruebes tú: avisa a Lionel qué pide.
- Si sigue trabajando → espera otro ciclo.
Solo terminas el turno al llegar al PASO 10 o ante una escalation que bloquee todo.

**Al recibir `worker_done`:**
- Lee `archivos_tocados`, `resumen`, `tests_ok`, `dudas`, `aprendizajes`
- Si `tests_ok: false` → trata como falla de la compuerta
- **Compuerta (tú, sin modelo):** corre en el worktree de la tarea los comandos de verificación de `PROYECTO.md`.
  - Si pasan → acepta la tarea y lanza las que dependían de ella.
  - Si fallan → devuélvela al ejecutor con la salida del error (máximo 2 rondas). La tercera → escalation a Lionel.

**Al recibir `escalation`:**
- Lee el tipo. Si es `ACCIÓN MANUAL` → notifica a Lionel los pasos exactos y pon el ETA "en pausa"
- Sigue con tareas que no dependan de esa acción

**Actualiza el ETA** cuando:
- Una tarea vuelve con CAMBIOS
- Hay escalation o ACCIÓN MANUAL
- El ETA se mueve más de 15 min respecto al último dado

Formato: `ETA: HH:MM (Lima) · N/M tareas listas · próxima: <descripcion>`

---

## PASO 8 — Integración

Cuando todas las tareas estén `completed`:

```bash
# Crear la rama de integración en un worktree propio (NO en el checkout principal)
git worktree add C:/Users/lione/orca/workspaces/<repo>/<ticket>-integracion -b squad/<ticket>/integracion main
cd C:/Users/lione/orca/workspaces/<repo>/<ticket>-integracion

# Traer ramas de los trabajadores
git merge squad/<ticket>/<tarea1>
git merge squad/<ticket>/<tarea2>
# ... resolver conflictos si los hay

# Correr TODOS los tests del repo (ver PROYECTO.md sección Verificación)
<comando-tests-del-repo>
<comando-lint>
<comando-tipos>
```

Si los tests pasan → continúa a PASO 9.
Si fallan → identifica qué tarea los rompió y vuelve a ese ejecutor.

---

## PASO 9 — Verificación final (tickets M y L)

Los tickets S terminan en el PASO 8: salta al PASO 10.

En M y L lanza **una sola** tarea de verificación sobre la rama de integración, con un modelo de otra familia
que los ejecutores (según `.squad/ruteo.md`) y el rol `.squad/roles/revisor.md`:

```bash
orca orchestration task-create \
  --run <runId> \
  --task-title "V: verificacion final <ticket>" \
  --deps '["<id de la tarea de integracion>"]' \
  --spec "Rama squad/<ticket>/integracion. Criterios, uno por linea, cada uno con su comando o consulta: <...>. Rol: .squad/roles/revisor.md"
```

Lánzala como en el PASO 6 (worktree propio). Con el veredicto:
- **APROBADO** → PASO 10.
- **CAMBIOS o criterios con FALLA** → crea tareas de corrección solo para lo señalado (máximo 2 rondas) y repite la
  verificación. Una tercera ronda → escalation a Lionel.
- **NO_VERIFICABLE** → si solo Lionel puede comprobarlo, agrégalo como paso de su lista en el `merge_ready`.

---

## PASO 10 — Cierre

**Primero cierra, después avisas.** Haz los puntos 1-4 de "Actualizar PROYECTO.md" (abajo)
**en la rama de integración**, con commit, para que viajen junto con el código. Recién entonces
envía el merge_ready.

El `--body` del merge_ready debe incluir, además del resumen, estos pasos para Lionel:

```
1. GitHub Desktop → quadro-<repo> → Current branch: squad/<ticket>/integracion → Push origin.
2. Revisa el preview de Vercel de esa rama.
3. Si está bien: Current branch: main → Branch → Merge into current branch →
   squad/<ticket>/integracion → Merge → Push origin.
4. Avísame "merge hecho" y limpio los worktrees.
```

Cuando Lionel diga "merge hecho": elimina los worktrees del ticket (`orca worktree rm`) y las
ramas locales `squad/<ticket>/*` ya mergeadas (`git branch -d`). Las ramas remotas las borra
Lionel desde GitHub Desktop (tú no puedes hacer push).

```bash
# Enviar merge_ready a Lionel
orca orchestration send \
  --run <runId> \
  --type merge_ready \
  --subject "merge_ready: <ticket>" \
  --body "<resumen en español: qué se hizo, rama, tests OK, dudas pendientes>"
```

**Actualizar PROYECTO.md** (Art. 10 y Art. 11 Constitución):

1. Sección *Lo que el escuadrón ha aprendido*: agrega solo lo verificado y útil de los `aprendizajes` de los trabajadores. Nada de supuestos. Nada de datos externos sin verificar.

2. Sección *Historial de tiempos*: agrega una fila:
   ```
   | <fecha> | <ticket> | <S/M/L> | <nro-tareas> | <ETA-inicial> | <hora-fin-real> | <+/-min> |
   ```

3. Si PROYECTO.md se acerca a ~300 líneas → consolida y poda lo obsoleto.

4. Si un aprendizaje ya apareció en otro proyecto → propónselo a Lionel como enmienda a quadro-squad (no lo escribas directamente en `.squad/CONSTITUCION.md` ni en los roles).

---

## Notas de implementación — comandos orca y agy

**NO uses bloques de script PowerShell** (`{ ... }`, `Where-Object`, `ForEach-Object`, etc.)
en comandos de `orca orchestration` ni en prompts de `agy`. Los bloques de script hacen
que PowerShell pida aprobación interactiva por cada ejecución, bloqueando los workers.

Correcto — filtrar DESPUÉS de capturar:
```bash
# Captura en archivo, filtra con Select-String
orca orchestration check --run <runId> > tmp_out.txt
Select-String -NotMatch "crashpad" tmp_out.txt
```

Correcto — usar Bash tool con grep para filtrar salida:
```bash
orca orchestration check --run <runId> 2>&1 | grep -v crashpad
```

Incorrecto (bloquea):
```powershell
# NO: script block obliga a aprobación manual
orca orchestration check --run <runId> | Where-Object { $_ -notmatch "crashpad" }
```

---

## Reglas que nunca rompes en este rol

- No haces push. Solo commit en rama `squad/<ticket>/...`
- No ejecutas el código de las tareas tú mismo (Art. 4)
- No saltas un gate porque "era obvio"
- Si algo requiere saltarse la Constitución → detente y escala
- Una sesión por ticket. `/clear` al terminar. `/compact` si pasas de ~100k tokens
