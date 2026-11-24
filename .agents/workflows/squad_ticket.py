# Workflow del escuadrón Quadro para Antigravity (/run-workflow).
# Se ejecuta con:  /run-workflow Run .agents/workflows/squad_ticket.py with args {"ticket_file": ".agents/tickets/<id>.json"}
# Usa las funciones que inyecta Antigravity: phase, log, agent, parallel, args.
# ESTADO: diseñado según la documentación de Antigravity (nov 2026), sin prueba real todavía.
#
# Flujo: preflight -> (por capas de dependencias) ejecutar en paralelo -> compuerta sin modelo
#        (alcance + archivos protegidos + comandos de verificación) -> commit + integrar
#        -> verificación final (una vez, M y L) -> resumen.

import json, os, subprocess, fnmatch, datetime, tempfile

ESQUEMA_EJECUTOR = {
    "type": "object",
    "properties": {
        "ruta": {"type": "string"},
        "rama": {"type": "string"},
        "archivos_tocados": {"type": "array", "items": {"type": "string"}},
        "resumen": {"type": "string"},
        "tests_ok": {"type": "boolean"},
        "dudas": {"type": "array", "items": {"type": "string"}},
        "aprendizajes": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["ruta", "rama", "archivos_tocados", "resumen", "tests_ok", "dudas"],
}

ESQUEMA_VERIFICADOR = {
    "type": "object",
    "properties": {
        "veredicto": {"type": "string", "enum": ["APROBADO", "CAMBIOS"]},
        "criterios": {"type": "array", "items": {"type": "object", "properties": {
            "criterio": {"type": "string"},
            "resultado": {"type": "string", "enum": ["OK", "FALLA", "NO_VERIFICABLE"]},
            "evidencia": {"type": "string"}},
            "required": ["criterio", "resultado", "evidencia"]}},
        "bloqueantes": {"type": "array", "items": {"type": "string"}},
        "sugerencias": {"type": "array", "items": {"type": "string"}},
        "aprendizajes": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["veredicto", "criterios", "bloqueantes"],
}

PROTEGIDOS = [".claude/*", ".squad/*", "seguridad/*", "roles/*", "CONSTITUCION.md",
              ".env*", "*credential*", "*secret*", ".github/workflows/*"]
MAX_RONDAS = 2


def sh(cmd, cwd, timeout=900):
    """Corre un comando y devuelve (ok, salida recortada)."""
    salida = ""
    for _ in range(5):
        r = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=timeout)
        salida = (r.stdout + "\n" + r.stderr).strip()
        if r.returncode == 0 or "EPERM: operation not permitted, mkdir" not in salida:
            return r.returncode == 0, salida[-3000:]
    return False, salida[-3000:]


def git(cmd, cwd):
    ok, out = sh("git " + cmd, cwd)
    if not ok:
        raise RuntimeError("git " + cmd + " -> " + out)
    return out


def es_junction(ruta):
    try:
        st = os.lstat(ruta)
        return os.path.islink(ruta) or bool(getattr(st, "st_file_attributes", 0) & 0x400)
    except OSError:
        return False


def asegurar_deps(ruta):
    nm_origen = os.path.join(repo, "node_modules")
    nm_destino = os.path.join(ruta, "node_modules")
    if os.path.isdir(nm_origen) and not os.path.exists(nm_destino):
        subprocess.run(["cmd", "/c", "mklink", "/J", nm_destino, nm_origen],
                       capture_output=True, text=True)


def quitar_junction_deps(ruta):
    nm = os.path.join(ruta, "node_modules")
    if es_junction(nm):
        subprocess.run(["cmd", "/c", "rmdir", nm], capture_output=True, text=True)


def coincide(ruta, patrones):
    ruta = ruta.replace("\\", "/")
    return any(fnmatch.fnmatch(ruta, p) or ruta == p.rstrip("/*") for p in patrones)


def cambios(ruta):
    """Archivos modificados o nuevos (sin commit) en un worktree."""
    out = git("status --porcelain --untracked-files=all", ruta)
    archivos = []
    for linea in out.splitlines():
        partes = linea.strip().split(maxsplit=1)   # "M  src/a.py" / "?? nuevo.py"
        nombre = partes[1] if len(partes) > 1 else ""
        if " -> " in nombre:
            nombre = nombre.split(" -> ")[1]
        if nombre:
            archivos.append(nombre.strip('"'))
    return archivos


def compuerta(tarea, ruta, verificacion):
    """Compuerta sin modelo. Devuelve lista de fallas (vacía = aceptada)."""
    asegurar_deps(ruta)
    fallas = []
    tocados = [
        a for a in cambios(ruta)
        if a != "node_modules" or not es_junction(os.path.join(ruta, "node_modules"))
    ]
    if not tocados:
        fallas.append("No hay cambios en el worktree.")
    fuera = [a for a in tocados if not coincide(a, tarea["archivos"])]
    if fuera:
        fallas.append("Archivos fuera de la lista permitida: " + ", ".join(fuera))
    prot = [a for a in tocados if coincide(a, PROTEGIDOS) and a != ".env.example"]
    if prot:
        fallas.append("Archivos protegidos tocados: " + ", ".join(prot))
    for cmd in verificacion:
        ok, out = sh(cmd, ruta)
        if not ok:
            fallas.append("Falla `" + cmd + "`:\n" + out)
    return fallas


def capas(tareas):
    """Agrupa tareas por dependencias (orden topológico)."""
    pendientes = {t["id"]: t for t in tareas}
    hechas, resultado = set(), []
    while pendientes:
        lista = [t for t in pendientes.values() if set(t.get("depende_de", [])) <= hechas]
        if not lista:
            raise RuntimeError("Dependencias circulares o inexistentes: " + ", ".join(pendientes))
        resultado.append(lista)
        for t in lista:
            hechas.add(t["id"])
            del pendientes[t["id"]]
    return resultado


# ---------------------------------------------------------------- preflight
phase("Preflight")
ticket = json.load(open(args["ticket_file"], encoding="utf-8"))
repo = os.getcwd()
nombre = ticket["ticket"]
rama_int = "squad/" + nombre + "/integracion"
verificacion = ticket["verificacion"]          # comandos de PROYECTO.md
reglas = ticket.get("reglas_extra", "")
dir_trabajo = os.path.join(os.path.expanduser("~"), "orca", "workspaces", os.path.basename(repo))
try:
    os.makedirs(dir_trabajo, exist_ok=True)
except PermissionError:
    dir_trabajo = os.path.join(tempfile.gettempdir(), "squad-wt-" + nombre)
    os.makedirs(dir_trabajo, exist_ok=True)
wt_int = os.path.join(dir_trabajo, nombre + "-integracion")

estado = git("status --porcelain", repo)
if git("rev-parse --abbrev-ref HEAD", repo).strip() != "main":
    raise RuntimeError("El checkout principal no está en main.")
if estado.strip():
    raise RuntimeError("El checkout principal tiene cambios sin commit:\n" + estado)
for cmd in verificacion:                      # la base debe estar verde antes de empezar
    ok, out = sh(cmd, repo)
    if not ok:
        raise RuntimeError("main ya falla la verificación antes de empezar (`" + cmd + "`):\n" + out)

git("branch -f " + rama_int + " main", repo)
log("Ticket " + nombre + ": " + str(len(ticket["tareas"])) + " tareas. Base verde.")

registro = {"inicio": datetime.datetime.now().isoformat(timespec="minutes"),
            "rondas_compuerta": 0, "rondas_verificacion": 0, "tareas": {}, "aprendizajes": []}


def prompt_tarea(t):
    rama_tarea = "squad/" + nombre + "/" + t["id"].lower()
    nm_repo = os.path.join(repo, "node_modules")
    return (
        "Tarea " + t["id"] + " del ticket " + nombre + ".\n"
        'Primero corre: git fetch "' + repo + '" ' + rama_int + " && git checkout -B " + rama_tarea + " && git merge --ff-only FETCH_HEAD\n"
        'Si en tu directorio de trabajo no existe node_modules, corre: cmd /c mklink /J node_modules "' + nm_repo + '"\n\n'
        "Objetivo: " + t["objetivo"] + "\n"
        "Archivos que puedes tocar (lista cerrada): " + ", ".join(t["archivos"]) + "\n"
        "Contrato con otras tareas: " + t.get("contrato", "ninguno") + "\n"
        "Criterios de éxito (ejecutables):\n- " + "\n- ".join(t["criterios"]) + "\n"
        "Antes de terminar corre: " + " && ".join(verificacion) + "\n"
        + ("Reglas extra del ticket: " + reglas + "\n" if reglas else "")
        + "En 'ruta' devuelve la ruta absoluta exacta de tu carpeta de trabajo (sin encabezados, ej. git rev-parse --show-toplevel).\n"
        "Sigue tu rol (.agents/agents/ejecutor.md) y la constitución (.squad/CONSTITUCION.md)."
    )


async def ejecutar(t):
    a = agent("", type_name="ejecutor", workspace="share",
              role=t["id"] + ": " + t["objetivo"][:50])
    res = await a(prompt_tarea(t), schema=ESQUEMA_EJECUTOR)
    for ronda in range(MAX_RONDAS + 1):
        ruta_wt = res["ruta"].strip().splitlines()[-1].strip()
        fallas = compuerta(t, ruta_wt, verificacion)
        if not fallas:
            quitar_junction_deps(ruta_wt)
            git("add -A", ruta_wt)
            git('commit -m "' + t["id"] + ": " + t["objetivo"][:60].replace('"', "'") + '"', ruta_wt)
            rama_canonica = "squad/" + nombre + "/" + t["id"].lower()
            head_wt = git("rev-parse HEAD", ruta_wt).strip()
            ok_ref, head_repo = sh("git rev-parse --verify refs/heads/" + rama_canonica, repo)
            if not ok_ref or head_repo.strip() != head_wt:
                git('fetch "' + ruta_wt + '" HEAD:refs/heads/' + rama_canonica, repo)
            return {"id": t["id"], "rama": rama_canonica, "res": res, "ok": True, "rondas": ronda}
        if ronda == MAX_RONDAS:
            return {"id": t["id"], "rama": res["rama"], "res": res, "ok": False,
                    "rondas": ronda, "fallas": fallas}
        registro["rondas_compuerta"] += 1
        res = await a("La compuerta falló. Corrige solo esto, sin tocar otros archivos:\n- "
                      + "\n- ".join(fallas), schema=ESQUEMA_EJECUTOR)


def integrar(ramas):
    """Une ramas en la rama de integración usando un worktree temporal."""
    if os.path.exists(wt_int):
        quitar_junction_deps(wt_int)
        git('worktree remove --force "' + wt_int + '"', repo)
    sh("git worktree prune", repo)
    git('worktree add "' + wt_int + '" ' + rama_int, repo)
    try:
        for r in ramas:
            ok, out = sh("git merge --no-ff --no-edit " + r, wt_int)
            if not ok:
                sh("git merge --abort", wt_int)
                raise RuntimeError("Conflicto al integrar " + r + ":\n" + out)
        asegurar_deps(wt_int)
        for cmd in verificacion:
            ok, out = sh(cmd, wt_int)
            if not ok:
                raise RuntimeError("La integración rompe `" + cmd + "`:\n" + out)
    finally:
        quitar_junction_deps(wt_int)
        git('worktree remove --force "' + wt_int + '"', repo)


# ---------------------------------------------------------------- ejecución por capas
for n, capa in enumerate(capas(ticket["tareas"]), start=1):
    phase("Capa " + str(n) + ": " + ", ".join(t["id"] for t in capa))
    resultados = await parallel(capa, ejecutar)
    malas = [r for r in resultados if not r["ok"]]
    for r in resultados:
        registro["tareas"][r["id"]] = {"rondas": r["rondas"], "ok": r["ok"], "resumen": r["res"]["resumen"],
                                       "dudas": r["res"].get("dudas", [])}
        registro["aprendizajes"] += r["res"].get("aprendizajes", [])
    if malas:
        log("ESCALATION: tareas que no pasaron la compuerta tras " + str(MAX_RONDAS) + " rondas:")
        for r in malas:
            log(r["id"] + ":\n" + "\n".join(r["fallas"]))
        print(json.dumps(registro, ensure_ascii=False, indent=2))
        raise RuntimeError("Compuerta fallida: se detiene el ticket para que decida Lionel.")
    integrar([r["rama"] for r in resultados])
    log("Capa " + str(n) + " integrada en " + rama_int)

# ---------------------------------------------------------------- verificación final
if ticket.get("tamano", "M") in ("M", "L"):
    phase("Verificación final")
    v = agent("", type_name="verificador", workspace="share", role="Verificador final")
    nm_repo = os.path.join(repo, "node_modules")
    prompt_v = (
        "Verificación final del ticket " + nombre + ".\n"
        'Primero corre: git fetch "' + repo + '" ' + rama_int + " && git checkout -B verificacion FETCH_HEAD\n"
        'Si en tu directorio de trabajo no existe node_modules, corre: cmd /c mklink /J node_modules "' + nm_repo + '"\n'
        "Criterios de aceptación del ticket (ejecuta cada uno):\n- " + "\n- ".join(ticket["criterios"]) + "\n"
        "Luego lee `git diff main...HEAD` solo para bloqueantes. Sigue .agents/agents/verificador.md."
    )
    veredicto = await v(prompt_v, schema=ESQUEMA_VERIFICADOR)
    while veredicto["veredicto"] != "APROBADO" and registro["rondas_verificacion"] < MAX_RONDAS:
        registro["rondas_verificacion"] += 1
        pendientes = veredicto["bloqueantes"] + [c["criterio"] + " -> " + c["evidencia"]
                                                 for c in veredicto["criterios"] if c["resultado"] == "FALLA"]
        log("Verificación devolvió " + str(len(pendientes)) + " puntos; ronda de corrección "
            + str(registro["rondas_verificacion"]))
        arreglo = {"id": "FIX" + str(registro["rondas_verificacion"]),
                   "objetivo": "Corregir lo que señaló la verificación final",
                   "archivos": sorted({a for t in ticket["tareas"] for a in t["archivos"]}),
                   "criterios": pendientes, "contrato": "ninguno"}
        r = await ejecutar(arreglo)
        if not r["ok"]:
            raise RuntimeError("La corrección no pasó la compuerta:\n" + "\n".join(r["fallas"]))
        integrar([r["rama"]])
        veredicto = await v(
            'Hay correcciones nuevas. Corre `git fetch "' + repo + '" ' + rama_int
            + ' && git checkout -B verificacion FETCH_HEAD` (y asegúrate de tener `node_modules` enlazado) y vuelve a verificar todos los criterios.',
            schema=ESQUEMA_VERIFICADOR,
        )
    registro["verificacion"] = veredicto
    if veredicto["veredicto"] != "APROBADO":
        log("ESCALATION: la verificación final no aprobó tras " + str(MAX_RONDAS) + " rondas.")

# ---------------------------------------------------------------- resumen
phase("Resumen")
registro["fin"] = datetime.datetime.now().isoformat(timespec="minutes")
registro["rama_integracion"] = rama_int
log("Listo. Rama para revisar y mergear: " + rama_int)
print(json.dumps(registro, ensure_ascii=False, indent=2))
