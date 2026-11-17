---
name: squad-ag
description: Escuadrón Quadro en Antigravity completo (sin Orca ni Claude Code). Planifica el ticket, pide aprobación y lo ejecuta con el workflow guardado (.agents/workflows/squad_ticket.py) - ejecutores en paralelo, compuerta sin modelo y una verificación final. Usar con /squad-ag <objetivo del ticket> en un repo con carpeta .squad/.
---

# Skill: /squad-ag — escuadrón en Antigravity

Esta conversación es el **planificador**. Modelo recomendado: **Orchestrator** (Argon en Pro; Carbon en Ultra).
La ejecución la hace un **workflow determinista** (`/run-workflow`), no esta conversación: así el contexto se
mantiene limpio y el proceso es siempre el mismo.

**No uses** `/swarm` ni `/teamwork` para tickets normales. `/teamwork` solo para proyectos L de varios días (ver
`.squad/ruteo.md`), y `/boost` para un bug difícil puntual.

---

## PASO 0 — Lectura obligatoria
1. `AGENTS.md`  2. `.squad/CONSTITUCION.md`  3. `.squad/roles/planificador.md` (incluida la sección *Anti-retrabajo*)
4. `.squad/ruteo.md` (modo Antigravity)  5. `PROYECTO.md`

## PASO 1 — Preflight (si algo falla, detente y avisa; no lo "arregles" en silencio)
1. El checkout principal está en `main` y sin cambios (`git status`).
2. Los comandos de *Verificación* de `PROYECTO.md` existen y pasan en `main`. Si `PROYECTO.md` no tiene comandos
   reales, el primer ticket es definirlos.
3. `agy models`: los modelos que vas a usar existen. Si no, avisa; no cambies de modelo sin decirlo.
4. Cuota (`/usage`): bolsa bajo 30 % → avisa antes de seguir; bajo 15 % → no lances el workflow.
5. Los agentes `ejecutor` y `verificador` aparecen en `/agents` y el workflow existe en `.agents/workflows/`.

## PASO 2 — Clasificar y explorar (una sola vez)
Tamaño S, M o L según `.squad/ruteo.md`. Explora solo lo necesario: archivos a tocar, contratos, comandos.
Aplica las reglas *Anti-retrabajo* del rol planificador (archivos calientes, APIs externas, boceto de UI).
Si el ticket es ambiguo, pregunta antes de planificar.

## PASO 3 — Escribir el ticket como archivo
Crea `.agents/tickets/<ticket>.json` (es el spec: si la sesión se corta, se retoma desde aquí):

```json
{
  "ticket": "nombre-corto-en-kebab",
  "tamano": "S | M | L",
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

Reglas: listas de archivos **cerradas y sin cruces** entre tareas del mismo nivel; si dos tareas tocan el mismo
archivo, la segunda `depende_de` la primera; incluye los tests de cada tarea en su lista de archivos.

## PASO 4 — Gate
Muestra a Lionel: objetivo, tareas con sus archivos, criterios, ETA (hora de Lima) y cuota estimada.
Cierra con: `Responde: Aprobado / Cambios: <qué> / Cancelar` y **espera**. (Tickets S: sin gate.)

## PASO 5 — Ejecutar
Haz commit del archivo del ticket en `main` antes de lanzar (el preflight del workflow exige `main` limpio):
`git add .agents/tickets/<ticket>.json` y `git commit -m "ticket: <ticket>"`.
Luego:

```
/run-workflow Run .agents/workflows/squad_ticket.py with args {"ticket_file": ".agents/tickets/<ticket>.json"}
```

El workflow: ejecuta por capas de dependencias (en paralelo dentro de cada capa, cada tarea en su rama), aplica la
**compuerta sin modelo** (solo archivos permitidos, ningún archivo protegido, comandos de verificación verdes),
hace los commits, integra en `squad/<ticket>/integracion` y, en M y L, corre **una** verificación final.
Lionel aprueba el script la primera vez.

## PASO 6 — Leer el resultado
- **ESCALATION** (compuerta o verificación sin resolver tras 2 rondas): muestra a Lionel qué falló y propón el siguiente
  paso. No relances a ciegas.
- **APROBADO**: continúa al cierre. Los criterios NO_VERIFICABLE van como pasos de Lionel en el `merge_ready`.

## PASO 7 — Cierre
1. En la rama de integración, actualiza `PROYECTO.md`: aprendizajes verificados (del resumen del workflow) y una fila
   en *Historial de tiempos* con **rondas de compuerta y de verificación**. (Haz tú ese commit en un worktree de la
   rama de integración, no en `main`.)
2. Mensaje a Lionel, en español, con resumen y pasos:
   1. GitHub Desktop → rama `squad/<ticket>/integracion` → Push origin.
   2. Revisar el preview / CI de esa rama (si el repo despliega al hacer push a `main`, dilo: "push a main = deploy").
   3. Merge a `main` y push.
   4. Avisar "merge hecho".
3. Con "merge hecho": `git worktree prune` y borra las ramas locales `squad/<ticket>/*` ya integradas.

## Límites conocidos
- El verificador es otro modelo Gemini, no Claude.
- Todos los agentes comparten la configuración global de `agy`.
- Los hooks del repo aún no detectan agentes de Antigravity fuera de Orca: la compuerta del workflow es la que impide
  tocar archivos protegidos.
- El workflow se diseñó con la documentación de Antigravity (nov 2026) y se probó con agentes simulados; la primera
  corrida real puede requerir ajustes.
