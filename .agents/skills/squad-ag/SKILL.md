---
name: squad-ag
description: Entrada maestra del escuadrón Quadro en Antigravity (v1.0). Mide el ticket (tamaño S/M/L, sensibilidad y acoplamiento), elige el motor óptimo (Directo, /swarm, /teamwork, run_workflow o /boost), pide Gate solo en L/sensibles/ambiguos, ejecuta, corre verificación + escaneo de secretos y hace commit/push autónomo.
---

# Skill: /squad-ag — entrada maestra y escuadrón en Antigravity (v1.0)

Esta conversación es el **coordinador**. Modelo recomendado: **Orchestrator** (`Neon` en Pro; `Carbon` en Ultra).
Mide cada ticket antes de gastar tokens y lo envía al motor nativo adecuado según `.squad/ruteo.md`.

---

## PASO 0 — Lectura obligatoria
1. `AGENTS.md`  2. `.squad/CONSTITUCION.md`  3. `.squad/roles/planificador.md`
4. `.squad/ruteo.md`  5. `PROYECTO.md`

## PASO 1 — Triage: medir el ticket y elegir motor
Explora lo mínimo indispensable para saber qué archivos y zonas toca el pedido, estimar tamaño (`S`, `M` o `L`) y detectar ambigüedades (si es ambiguo, pregunta antes de seguir).

Evalúa si toca zona **sensible** (datos de clientes, pagos/precios, esquema DB, auth/permisos, integraciones críticas o zonas sensibles de `PROYECTO.md`) y evalúa de arriba hacia abajo la tabla *Triage del ticket* de `.squad/ruteo.md`:

```
TRIAGE <ticket>
- Tamaño: <S | M | L> (<archivos estimados y motivo corto>)
- Sensible: <Sí: <zona> (Gate + verificación final + push solo a rama) | No>
- Motor elegido: <Directo | Swarm | Workflow | /teamwork | /boost>
- Gate previo: <Sí (L / sensible / ambiguo) | No (S / M estándar)>
- Motivo: <1 línea>
```

**Salidas tempranas:**
- **`/boost` (Bug duro):** entrega el bloque `/boost <objetivo + comando que reproduce + archivos sospechosos>` listo para lanzar y **termina**.
- **`/teamwork` (Largo / L abierto):** ofrece **(a)** partirlo en 2-4 tickets M aquí, o **(b)** entregar el prompt listo para `/teamwork` con **ruta absoluta del repo** (`pwd`), comandos de verificación de `PROYECTO.md`, `escanear-fugas.py` antes de publicar y zonas fuera de alcance. **Espera** la elección de Lionel.
- **`Directo`, `Swarm` o `Workflow`:** continúa al Paso 2.

## PASO 2 — Preflight técnico
1. El checkout principal está en `main` y limpio (`git status`).
2. Los comandos de *Verificación* de `PROYECTO.md` existen y pasan en `main`.
3. Cuota (`/usage` o `python .squad/scripts/cuota.py` si existe): bajo 30 % → avisa; bajo 15 % → no lances.

## PASO 3 — Escribir spec (solo si usas `Swarm` o `Workflow`, o si hay Gate)
En tickets **S** o **M simples** con motor `Directo`, no hace falta crear archivo JSON: ejecuta directo y valida.
En `Swarm` / `Workflow` / Gate, crea `.agents/tickets/<ticket>.json`:

```json
{
  "ticket": "nombre-corto-en-kebab",
  "tamano": "S | M | L",
  "sensible": false,
  "motor": "swarm | workflow",
  "objetivo": "una frase",
  "verificacion": ["comandos exactos de PROYECTO.md que deben pasar"],
  "criterios": ["criterio de aceptación ejecutable: comando/consulta + resultado esperado"],
  "reglas_extra": "límites del ticket (APIs prohibidas, zonas, etc.)",
  "tareas": [
    {"id": "T1", "objetivo": "...", "archivos": ["ruta/exacta.py", "tests/test_x.py"],
     "criterios": ["ejecutable"], "contrato": "qué recibe y qué devuelve", "depende_de": []}
  ]
}
```

Reglas: listas de archivos **cerradas y sin cruces** en la misma capa; si dos tareas tocan el mismo archivo, la segunda `depende_de` la primera.

## PASO 4 — Gate (SOLO en L, sensibles o ambiguos)
Tickets **S y M no sensibles** saltan directo al Paso 5 sin pedir aprobación.
Si aplica Gate: muestra a Lionel ficha `TRIAGE`, tareas/archivos, criterios ejecutables y ETA (hora de Lima). Cierra con `Responde: Aprobado / Cambios: <qué> / Cancelar` y **espera**.

## PASO 5 — Ejecutar según el motor elegido

### 5A · Motor `Directo` (S o M simple de 1–2 tareas)
1. Crea rama `squad/<ticket>/integracion` desde `main` (o en `workspace: "share"` con `invoke_subagent`).
2. Implementa o delega la tarea puntual y corre los comandos de `PROYECTO.md`.
3. Si es **M** o **sensible**, lanza un subagente verificador (`model="pro"`) para validar criterios y revisar `git diff main...HEAD`.

### 5B · Motor `Swarm` (coordinado 2–5 tareas o slug exacto)
1. Carga el skill `swarm_pane` y crea `git branch -f squad/<ticket>/integracion main`.
2. Por capa de dependencias (máx. 3 workers en paralelo), lanza cada tarea con:
   `swarm(action="add", name="<id-minuscula>", model="gemini-4-hydrogen-medium", workspace="share", brief="...")`
   (`workspace: "share"` mantiene el worktree dentro del proyecto sin salir del Sandbox).
   Exige en el `brief`: crear rama `squad/<ticket>/<id>` desde `squad/<ticket>/integracion`, tocar solo su lista cerrada de archivos, correr verificación de `PROYECTO.md`, hacer `git commit` en su rama (sin `push` ni `--no-verify`) y reportar en la pizarra.
3. Cuando cada worker termine, corre la **compuerta sin modelo** sobre su rama (archivos permitidos, cero protegidos, verificación verde; máx. 2 rondas).
4. Integra las ramas aprobadas en `squad/<ticket>/integracion` **antes** de llamar a `swarm(action="kill", name="...")`.
5. En **M, L y todo ticket sensible**, lanza un worker `verificador` con `model="gemini-4-neon-high"` (`workspace="share"`) para ejecutar cada criterio sobre `squad/<ticket>/integracion` y revisar `git diff main...HEAD` (incluyendo fugas de credenciales); luego haz `kill`.

### 5C · Motor `Workflow` (paralelo por capas con `squad_ticket.py`)
1. Commit de `.agents/tickets/<ticket>.json` en `squad/<ticket>/integracion` (o rama de trabajo; nunca ensucies `main` si hace auto-deploy) o sigue el preflight de `squad_ticket.py`.
2. Llama a `run_workflow` con `ScriptPath=".agents/workflows/squad_ticket.py"` y `Args={"ticket_file": ".agents/tickets/<ticket>.json"}`.
3. Corre por capas (`workspace: "share"`), compuerta sin modelo, integración en `squad/<ticket>/integracion`, verificación final (M/L/sensible) y `escanear-fugas.py`.

## PASO 6 — Escaneo obligatorio de secretos y cierre autónomo
1. **Si hubo `ESCALATION`** tras 2 rondas: muestra a Lionel qué falló y detente.
2. **Revisión de secretos (obligatoria antes de publicar):**
   Corre `python .squad/scripts/escanear-fugas.py --range main..squad/<ticket>/integracion`.
   Si reporta fugas reales, detente y escala sin hacer push.
3. **Actualizar `PROYECTO.md`** en `squad/<ticket>/integracion`: aprendizajes verificados + fila en *Historial de tiempos* (incluyendo motor usado) y haz `git commit`.
4. **Publicar (`git push` autónomo):**
   - **Caso 1 — `PROYECTO.md` declara `Auto-deploy en main: No` Y el ticket es S o M no sensible:**
     Haz fast-forward/merge de `squad/<ticket>/integracion` en `main`, corre verificación final, ejecuta `git push origin main` y limpia worktrees y ramas `squad/<ticket>/*`. Reporta a Lionel qué quedó publicado en `main`.
   - **Caso 2 — `Auto-deploy en main: Sí` (o sin confirmar) O ticket L / sensible:**
     Ejecuta `git push -u origin squad/<ticket>/integracion` (el hook `pre-push` volverá a escanear secretos) y entrega a Lionel un resumen corto en español con la rama publicada para revisar preview/CI y aprobar el merge a `main` (más pasos `NO_VERIFICABLE` si hubiera).

## Límites conocidos
- El verificador usa modelo `pro` / `Neon` / `Carbon`, distinto del ejecutor `flash` / `Hydrogen`.
- Prohibido `--no-verify` y `--force` al publicar.
- En `run_workflow` los subagentes usan tiers (`flash` / `pro`); si necesitas clavar un slug exacto por agente, el triage usa `Swarm`.
