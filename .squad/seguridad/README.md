<!-- Copia de quadro-squad (commit ff6dda7). No editar aqui: se edita en quadro-squad. -->

# Seguridad (v1.0)

Modelo: **Terminal Sandbox + Preset `Auto` + escaneo de secretos antes de publicar**, eliminando aprobaciones innecesarias sin perder protección real.

## Capas de protección
1. **Secretos fuera del workspace y git**: credenciales productivas fuera de `C:\dev\ORCA`; sin `.env` reales versionados (solo `.env.example` / `.env.test` con datos falsos).
2. **Terminal Sandbox + Preset `Auto` (Antigravity)**: los comandos dentro del workspace corren aislados sin pedir confirmación; `nonWorkspaceFileAccessPolicy: AGENT_SETTING_POLICY_DENY` impide leer o escribir fuera del repo asignado (y `workspace: "share"` / `.worktrees/` mantiene los worktrees dentro del proyecto).
3. **Lista de prohibidos quirúrgica (`agy-base.json` / `claude-base.json`)**:
   - Permite `git commit`, `git push`, `git pull`, `git fetch` y comandos diarios sin prompts.
   - Bloquea acciones irreversibles o productivas: `git push --force`, `git reset --hard`, `git clean -f`, `--no-verify`, borrados recursivos (`rm -rf` / `Remove-Item -Recurse`), `vercel --prod`, `ssh`/`scp`, `.env` reales y archivos de configuración de permisos (`.gemini/config`, `.claude/settings*`).
   - Se corrigió el falso positivo histórico de `del` (ya no bloquea la palabra en español ni commits que digan `del panel`) y de `secret` / `.env.example`.
4. **Escaneo obligatorio de secretos (`scripts/escanear-fugas.py`)**:
   - Corre automáticamente en cada `git commit` (`pre-commit`) y cada `git push` (`pre-push`), además de `--range main..HEAD` en el cierre del ticket.
   - Bloquea `.env` reales, llaves privadas (`.pem`, `.key`, `id_rsa`, bloques `PRIVATE KEY`), `credentials.json` y tokens conocidos (Anthropic, OpenAI, Google/Gemini, GitHub, Notion, Slack, Stripe, AWS, Telegram, Meta, URLs remotas de BD), redactando los valores en consola.
   - Si `gitleaks` está instalado en el sistema, también lo ejecuta en `--staged`.
5. **Protección de ramas y reglas en hooks git**:
   - `pre-push` impide borrar o forzar historial en `main`/`master`, y bloquea `git push` directo de agentes a `main` cuando `PROYECTO.md` no declara explícitamente `Auto-deploy en main: No`.
   - `pre-commit` impide a agentes modificar `.squad/` o `.claude/settings*` (salvo `SQUAD_ALLOW_SYNC=1` en sincronizaciones autorizadas).
6. **Nunca modo `Turbo` sin sandbox ni `--dangerously-skip-permissions`.**

## Notas de configuración de Antigravity (`agy`)

- Archivo global: `~/.gemini/config/config.json` → `userSettings`.
- Ajustes recomendados:
  - `permissionPreset`: `"AGENT_PERMISSION_PRESET_AUTO"`
  - `enableTerminalSandbox`: `true`
  - `nonWorkspaceFileAccessPolicy`: `"AGENT_SETTING_POLICY_DENY"`
- Auditar reglas acumuladas mensualmente con:
  ```powershell
  python scripts/auditar-permisos.py
  ```
- Si tienes decenas de reglas one-off antiguas en `globalPermissionGrants.allow`, puedes reemplazarlas por el bloque limpio de `seguridad/agy-base.json` para que el preset `Auto` + Sandbox gobierne sin ruido.
