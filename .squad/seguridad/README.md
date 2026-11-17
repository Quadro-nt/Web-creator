<!-- Copia de quadro-squad (commit d8f19e0). No editar aqui: se edita en quadro-squad. -->

# Seguridad

Modelo: **cerrar lo peligroso y aislar el entorno**, en vez de listar todo lo permitido.
Las pruebas de spike2 mostraron que las listas de comandos permitidos no funcionan con agentes
reales: usan demasiadas variantes para predecirlas.

## Capas
1. **Fuera de alcance**: secretos fuera de `C:\dev\ORCA`, sin `.env` reales en los worktrees.
2. **Escritura acotada**: cada tarea declara sus archivos (Claude Code lo aplica por worktree).
3. **Lista de prohibidos**: `agy-base.json` y `claude-base.json`.
4. **Hooks de git**: `pre-push` bloquea pushes de agentes; `pre-commit` bloquea commits que
   toquen `.claude/`, `.squad/`, `seguridad/`, `roles/` o `CONSTITUCION.md`. Instalados por `squad-init`.
5. **Guardrails externos**: push solo de Lionel (GitHub Desktop). Branch protection en GitHub
   queda **pendiente**: en repos privados del plan gratis los rulesets no se aplican.
6. **Nunca yolo.**

## Configuracion real de agy

Archivo: `~/.gemini/config/config.json` → `userSettings.globalPermissionGrants`

La base aplicada en fase 2 esta en `seguridad/agy-base.json`.

La regla `.gemini/.claude` NO requiere separador antes del punto (`\.(gemini|claude)[\\/]`),
asi captura tanto `C:\ruta\.claude\` como argumentos bare tipo `.claude/settings.json`.
Las entradas `write_file(...)` usan rutas absolutas — las relativas no funcionan porque agy
normaliza las rutas a absolutas antes de comparar.

Backups con fecha en `~/.gemini/config/config.json.bak-YYYY-MM-DD` y
`~/.gemini/antigravity-cli/settings.json.bak-YYYY-MM-DD`.

`trustedWorkspaces` en `~/.gemini/antigravity-cli/settings.json`:
lista vacia (los worktrees Orca no necesitan trust explicito para arrancar).

`nonWorkspaceFileAccessPolicy: AGENT_SETTING_POLICY_DENY` — workers que intentan leer
fuera de su worktree reciben denegacion silenciosa sin prompt interactivo.
Con POLICY_ASK el agente se traba esperando respuesta en headless.
Verificado en agy 1.5.2: la app de Antigravity sigue funcionando porque los repos
que Lionel abre son el workspace del agente — sus archivos no son "fuera del workspace".

## Limites conocidos

- Las reglas `deny` por patron son una red, no un muro: un agente puede formular un comando
  que no coincida. Por eso las capas 1 y 4 son las que de verdad protegen.
- `agy` dentro de Orca solo acepta configuracion global: todos los workers agy comparten caja.
  Lo sensible va con ejecutores Claude Code (ver `ruteo.md`).
- Para que workers agy puedan escribir archivos en sus worktrees sin prompt interactivo,
  se necesita una entrada `write_file(C:/Users/lione/orca/workspaces/)` en el allow list.
  Sin ella, agy pide confirmacion por cada archivo (bloquea workers orquestados).
- `write_file` no acepta regex (probado en agy 1.5.2). Las entradas de worktrees dinamicos
  no se pueden enumerar aqui. La proteccion de `.claude/` en worktrees la dan el command
  deny (`\.(gemini|claude)[\\/]`) y el hook pre-commit.
- Los deny de `write_file` protegen las herramientas nativas de agy pero no las escrituras
  via shell (ej. `Set-Content`, `echo >`). La proteccion real son las capas 1 y 2.
- Al crear un worktree nuevo NO es necesario agregar su `.claude/` al deny de agy:
  el command deny y el pre-commit hook cubren ese caso.
