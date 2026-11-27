# Copia de quadro-squad (commit ff6dda7). No editar aqui: se edita en quadro-squad.

"""
Escaner de fugas y secretos para hooks pre-commit, pre-push y auditorias.

Uso:
    python scripts/escanear-fugas.py --staged
    python scripts/escanear-fugas.py --pre-push   (lee stdin de git pre-push)
    python scripts/escanear-fugas.py --range main..HEAD
    python scripts/escanear-fugas.py --tracked
    python scripts/escanear-fugas.py --selftest
"""

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ZERO_SHA = "0" * 40
ALLOW_MARKER = "squad:allow-secret"

# Archivos .env permitidos por nombre (su contenido igual se escanea por si hay claves reales)
ALLOWED_ENV_NAMES = {
    ".env.example",
    ".env.sample",
    ".env.template",
    ".env.test",
    ".env.ci",
}

FORBIDDEN_EXACT_NAMES = {
    "id_rsa",
    "id_ed25519",
    "credentials.json",
    ".pypirc",
    ".netrc",
}

FORBIDDEN_EXTENSIONS = {
    ".pem",
    ".key",
    ".p12",
    ".pfx",
    ".jks",
    ".keystore",
}

FORBIDDEN_NAME_PATTERNS = [
    re.compile(r"(?i)^client_secret.*\.json$"),
    re.compile(r"(?i).*service[-_]account.*\.json$"),
]

# Prefijos de placeholders comunes para evitar falsos positivos en ejemplos o tests
PLACEHOLDER_PREFIXES = (
    "your_",
    "tu_",
    "example",
    "ejemplo",
    "dummy",
    "fake",
    "test",
    "mock",
    "placeholder",
    "changeme",
    "replace_",
    "xxx",
    "[redacted]",
    "[redactado]",
    "${",
    "<",
)

SECRET_RULES: list[tuple[str, re.Pattern[str]]] = [
    ("Anthropic API key", re.compile(r"sk-ant-[A-Za-z0-9\-_]{20,}")),
    ("OpenAI scoped key", re.compile(r"sk-(?:proj-|svcacct-)[A-Za-z0-9\-_]{20,}")),
    ("OpenAI legacy key", re.compile(r"\bsk-[A-Za-z0-9]{32,}\b")),
    ("Google / Gemini API key", re.compile(r"AIza[0-9A-Za-z\-_]{35}")),
    ("Google OAuth access token", re.compile(r"ya29\.[0-9A-Za-z\-_]{25,}")),
    ("Google OAuth client secret", re.compile(r"GOCSPX-[A-Za-z0-9\-_]{20,}")),
    ("GitHub token", re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{36,}\b")),
    ("GitHub fine-grained PAT", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{22,}\b")),
    ("GitLab PAT", re.compile(r"\bglpat-[A-Za-z0-9\-_]{20,}\b")),
    ("Notion token", re.compile(r"\b(?:ntn_[A-Za-z0-9]{30,}|secret_[A-Za-z0-9]{35,})\b")),
    ("Slack token", re.compile(r"\bxox[baprs]-[0-9A-Za-z\-]{10,}\b")),
    ("Stripe live key", re.compile(r"\b(?:sk|rk)_live_[0-9A-Za-z]{20,}\b")),
    ("AWS Access Key ID", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("SendGrid API key", re.compile(r"\bSG\.[A-Za-z0-9_\-]{16,}\.[A-Za-z0-9_\-]{20,}\b")),
    ("Telegram Bot token", re.compile(r"\b\d{8,10}:[A-Za-z0-9_-]{35}\b")),
    ("Meta access token", re.compile(r"\bEAAB[A-Za-z0-9]{40,}\b")),
    (
        "Private key block",
        re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----"),
    ),
    (
        "Remote DB/broker URL with credentials",
        re.compile(
            r"(?i)\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp)://"
            r"[^/\s:@<>{}]+:([^/\s@<>{}]{6,})@"
            r"(?!(?:localhost|127\.0\.0\.1|0\.0\.0\.0|db|postgres|redis|mongo)(?:[:/\s'\"]|$))"
        ),
    ),
    (
        "Direct secret assignment",
        re.compile(
            r"(?i)\b(?:api[_-]?key|client[_-]?secret|auth[_-]?token|access[_-]?token|"
            r"private[_-]?key|secret[_-]?key|apollo_api_key|hunter_api_key)\b"
            r"\s*[:=]\s*['\"]([^\s'\"]{16,})['\"]"
        ),
    ),
]


def _run_git(args: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=cwd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=60,
    )


def _redact(value: str) -> str:
    if len(value) <= 8:
        return "****"
    return f"{value[:4]}...{value[-2:]}****"


def _is_placeholder(val: str) -> bool:
    low = val.strip().lower()
    if any(low.startswith(p) for p in PLACEHOLDER_PREFIXES):
        return True
    if low in {"password", "changeme", "secret", "example", "token", "apikey", "api_key"}:
        return True
    if len(set(low)) <= 2:
        return True
    return False


def check_forbidden_path(rel_path: str) -> str | None:
    """Devuelve motivo si el archivo esta prohibido por nombre/extension, o None."""
    norm = rel_path.replace("\\", "/")
    name = os.path.basename(norm)
    low = name.lower()

    if low == ".env" or low.startswith(".env."):
        if low in ALLOWED_ENV_NAMES:
            return None
        return f"archivo .env real prohibido ({name})"

    if low in FORBIDDEN_EXACT_NAMES:
        return f"archivo de credenciales prohibido ({name})"

    _, ext = os.path.splitext(low)
    if ext in FORBIDDEN_EXTENSIONS:
        return f"llave o certificado prohibido ({ext})"

    for pat in FORBIDDEN_NAME_PATTERNS:
        if pat.match(name):
            return f"archivo de credenciales prohibido ({name})"

    return None


def scan_line(line: str) -> list[tuple[str, str]]:
    """Escanea una linea y devuelve [(regla, valor_redactado)]."""
    if ALLOW_MARKER in line:
        return []
    hits: list[tuple[str, str]] = []
    for label, pat in SECRET_RULES:
        for m in pat.finditer(line):
            candidate = m.group(1) if m.lastindex else m.group(0)
            if _is_placeholder(candidate):
                continue
            hits.append((label, _redact(m.group(0))))
    return hits


def scan_diff_text(diff_text: str) -> list[str]:
    """Escanea lineas anadidas (+) de un `git diff -U0`."""
    findings: list[str] = []
    current_file = "<desconocido>"
    current_line = 0

    for raw in diff_text.splitlines():
        if raw.startswith("+++ "):
            target = raw[4:].strip()
            if target == "/dev/null":
                current_file = "/dev/null"
            elif target.startswith("b/"):
                current_file = target[2:]
            else:
                current_file = target
            continue
        if raw.startswith("@@ "):
            m = re.search(r"\+(\d+)", raw)
            current_line = int(m.group(1)) if m else 1
            continue
        if raw.startswith("+") and not raw.startswith("+++"):
            content = raw[1:]
            for label, masked in scan_line(content):
                findings.append(f"{current_file}:{current_line} [{label}] -> {masked}")
            current_line += 1
    return findings


def scan_paths_and_diff(repo: Path, diff_args_name: list[str], diff_args_patch: list[str]) -> list[str]:
    findings: list[str] = []
    res_names = _run_git(["diff", "--name-only", "--diff-filter=ACMR", *diff_args_name], repo)
    if res_names.returncode != 0:
        raise RuntimeError(res_names.stderr.strip() or "git diff --name-only fallo")
    for rel in res_names.stdout.splitlines():
        rel = rel.strip()
        if not rel:
            continue
        reason = check_forbidden_path(rel)
        if reason:
            findings.append(f"{rel} [Archivo prohibido] -> {reason}")

    res_patch = _run_git(["diff", "-U0", "--diff-filter=ACMR", *diff_args_patch], repo)
    if res_patch.returncode != 0:
        raise RuntimeError(res_patch.stderr.strip() or "git diff -U0 fallo")
    findings.extend(scan_diff_text(res_patch.stdout))
    return findings


def run_staged(repo: Path) -> list[str]:
    findings = scan_paths_and_diff(repo, ["--cached"], ["--cached"])
    if shutil.which("gitleaks"):
        proc = subprocess.run(
            ["gitleaks", "protect", "--staged", "--redact", "--no-banner"],
            cwd=repo,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=60,
        )
        if proc.returncode != 0:
            out = (proc.stdout + "\n" + proc.stderr).strip()
            findings.append(f"gitleaks detecto posibles fugas:\n{out[-1500:]}")
    return findings


def run_range(repo: Path, rev_range: str) -> list[str]:
    return scan_paths_and_diff(repo, [rev_range], [rev_range])


def run_pre_push(repo: Path) -> list[str]:
    lines = [ln.strip() for ln in sys.stdin.read().splitlines() if ln.strip()]
    if not lines:
        return []

    findings: list[str] = []
    empty_tree = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"

    for line in lines:
        parts = line.split()
        if len(parts) != 4:
            continue
        _local_ref, local_sha, _remote_ref, remote_sha = parts
        if local_sha == ZERO_SHA:
            continue

        if remote_sha != ZERO_SHA:
            findings.extend(run_range(repo, f"{remote_sha}..{local_sha}"))
            continue

        base = None
        for candidate_branch in ("origin/main", "origin/master", "main", "master"):
            mb = _run_git(["merge-base", local_sha, candidate_branch], repo)
            if mb.returncode == 0 and mb.stdout.strip():
                candidate_sha = mb.stdout.strip()
                if candidate_sha != local_sha:
                    base = candidate_sha
                    break
        rev = f"{base}..{local_sha}" if base else f"{empty_tree}..{local_sha}"
        findings.extend(run_range(repo, rev))

    return findings


def run_tracked(repo: Path) -> list[str]:
    res = _run_git(["ls-files"], repo)
    if res.returncode != 0:
        raise RuntimeError(res.stderr.strip() or "git ls-files fallo")
    findings: list[str] = []
    for rel in res.stdout.splitlines():
        rel = rel.strip()
        if not rel:
            continue
        reason = check_forbidden_path(rel)
        if reason:
            findings.append(f"{rel} [Archivo prohibido] -> {reason}")
        path = repo / rel
        if not path.is_file():
            continue
        try:
            raw = path.read_bytes()
        except OSError:
            continue
        if b"\x00" in raw[:4096]:
            continue
        text = raw.decode("utf-8", errors="ignore")
        for idx, line in enumerate(text.splitlines(), start=1):
            for label, masked in scan_line(line):
                findings.append(f"{rel}:{idx} [{label}] -> {masked}")
    return findings


def run_selftest() -> int:
    # Tokens sinteticos construidos por concatenacion para no activar reglas al escanear este archivo
    samples_positive = [
        ("Anthropic", "TOKEN=" + "sk-" + "ant-" + "api03-" + "A" * 24),
        ("Google", "KEY=" + "AIza" + "Sy" + "B" * 33),
        ("GitHub", "GH=" + "ghp_" + "C" * 36),
        ("PrivateKey", "-----BEGIN " + "RSA PRIVATE KEY-----"),
        ("RemoteDB", "postgres" + "://" + "admin:Sup3rClav3@" + "db.prod.example.com:5432/app"),
        ("DirectAssign", "apollo_api" + "_key = '" + "Zx9QpLm2Rt8Vy4Wn7Kb3" + "'"),
    ]
    for name, sample in samples_positive:
        hits = scan_line(sample)
        assert hits, f"Fallo deteccion positiva para {name}"
        raw_secret = sample.split("=", 1)[-1].strip().strip("'")
        for _label, masked in hits:
            assert raw_secret not in masked, f"El secreto completo se filtro en salida para {name}"

    assert scan_line(("KEY=" + "AIza" + "Sy" + "B" * 33) + "  # " + ALLOW_MARKER) == []
    assert scan_line('api_key = "your_api_key_placeholder_here"') == []
    assert scan_line("postgresql://user:password123@localhost:5432/dev") == []

    assert check_forbidden_path(".env") is not None
    assert check_forbidden_path("apps/web/.env.production") is not None
    assert check_forbidden_path("secrets/credentials.json") is not None
    assert check_forbidden_path("certs/prod.pem") is not None
    assert check_forbidden_path(".env.example") is None
    assert check_forbidden_path(".env.test") is None

    diff_sample = (
        "+++ b/src/app.py\n"
        "@@ -10,0 +11,2 @@\n"
        "+ok = True\n"
        "+k = '" + "sk-" + "ant-" + "D" * 26 + "'\n"
    )
    diff_hits = scan_diff_text(diff_sample)
    assert len(diff_hits) == 1 and "src/app.py:12" in diff_hits[0], f"Diff inesperado: {diff_hits}"

    print("SELFTEST OK")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Escaner de fugas y secretos de Quadro Squad.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--staged", action="store_true", help="Escanea cambios staged para commit")
    group.add_argument("--pre-push", action="store_true", help="Escanea commits salientes desde stdin de pre-push")
    group.add_argument("--range", metavar="REV_RANGE", help="Escanea rango git diff (ej. main..HEAD)")
    group.add_argument("--tracked", action="store_true", help="Escanea todos los archivos trackeados")
    group.add_argument("--selftest", action="store_true", help="Ejecuta pruebas internas del escaner")
    parser.add_argument("--repo", default=".", help="Ruta al repositorio git (por defecto .)")
    args = parser.parse_args()

    if args.selftest:
        return run_selftest()

    repo = Path(args.repo).resolve()
    try:
        if args.staged:
            findings = run_staged(repo)
        elif args.pre_push:
            findings = run_pre_push(repo)
        elif args.range:
            findings = run_range(repo, args.range)
        else:
            findings = run_tracked(repo)
    except Exception as exc:
        print(f"ERROR en escaner de fugas: {exc}", file=sys.stderr)
        return 2

    if findings:
        print("\nBLOQUEADO — posibles secretos o archivos sensibles detectados:", file=sys.stderr)
        for item in findings[:30]:
            print(f"  - {item}", file=sys.stderr)
        if len(findings) > 30:
            print(f"  ... y {len(findings) - 30} hallazgo(s) mas.", file=sys.stderr)
        print(
            f"\nSi es un falso positivo intencional (ejemplo/test), agrega `# {ALLOW_MARKER}` en esa linea.",
            file=sys.stderr,
        )
        return 1

    print("OK — sin fugas detectadas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
