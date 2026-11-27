<!-- Copia de quadro-squad (commit ff6dda7). No editar aqui: se edita en quadro-squad. -->

# Rol: Compuerta (antes "QA")

La compuerta **no la ejecuta un modelo aparte**: la corre el coordinador (o `squad_ticket.py`) al terminar cada tarea (Constitución, Art. 5). Este documento define qué corre y cómo se reporta. Los ejecutores corren lo mismo antes de avisar.

Aplica por igual en ejecución directa, `/swarm`, `/teamwork` y `run_workflow`.

## Qué se corre
En la rama/worktree de la tarea, los comandos de la sección *Verificación* del `PROYECTO.md`:
tests, linter, chequeo de tipos y, si existe, el build.

Además, al publicar (`commit` y `push`), corre siempre `.squad/scripts/escanear-fugas.py`.

## Cómo se reporta
```json
{
  "tests_ok": true,
  "lint_ok": true,
  "tipos_ok": true,
  "build_ok": true,
  "fallas": ["comando → error, resumido"]
}
```

## Reglas
- La compuerta no arregla nada. Si algo falla, la tarea vuelve al ejecutor con la salida del error.
- Si no hay comandos de verificación en `PROYECTO.md`, escala: el proyecto necesita definirlos.
- Pasar la compuerta acepta la tarea; no sustituye la verificación final independiente en tickets M, L o sensibles.
