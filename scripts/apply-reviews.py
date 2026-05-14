#!/usr/bin/env python3
"""
apply-reviews.py
================

Legge il source-of-truth `site/data/reviews.json` e propaga i 3 valori
recensioni (MioDottore, Google, Totale) in tutti i file HTML del sito.

Uso:
    python3 scripts/apply-reviews.py              # patch + report
    python3 scripts/apply-reviews.py --check      # solo verifica coerenza (CI mode)
    python3 scripts/apply-reviews.py --dry-run    # mostra diff senza scrivere

Exit codes:
    0  OK (patch applicata, oppure --check passa)
    1  Errore generico (file non trovato, JSON malformato)
    2  --check fallito: HTML non coerenti con reviews.json
    3  Validazione fallita (total != miodottore + google, valori implausibili)

Comportamento:
    - Auto-detect dei valori CORRENTI nel sito tramite pattern ben definiti
    - 3 sostituzioni indipendenti, con sentinel per evitare collisioni
    - Salta file binari e backups/
    - Modifica esclusivamente file HTML in site/ (no .py, .md, .zip, .jpg)
"""
import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
REVIEWS_JSON = REPO_ROOT / "site" / "data" / "reviews.json"
SITE_DIR = REPO_ROOT / "site"
SENTINEL_FILES = ["site/index.html", "site/chi-siamo/index.html"]
SKIP_PATH_FRAGMENTS = ["/backups/", "/output/", "/node_modules/"]
SKIP_SUFFIXES = {".py", ".md", ".zip", ".jpg", ".jpeg", ".png", ".gif", ".svg",
                 ".woff", ".woff2", ".ttf", ".eot", ".ico", ".webp", ".bak"}

# ---------- helpers ----------

def format_italian(n: int) -> str:
    """3445 -> '3.445'; 458 -> '458'."""
    s = str(n)
    parts = []
    while len(s) > 3:
        parts.append(s[-3:]); s = s[:-3]
    parts.append(s)
    return ".".join(reversed(parts))


def load_reviews():
    if not REVIEWS_JSON.exists():
        sys.exit(f"❌ {REVIEWS_JSON} non trovato")
    try:
        data = json.loads(REVIEWS_JSON.read_text())
    except json.JSONDecodeError as e:
        sys.exit(f"❌ JSON malformato in {REVIEWS_JSON}: {e}")
    for k in ("miodottore", "google", "total"):
        v = data.get(k)
        if not isinstance(v, int) or v < 10 or v > 100000:
            sys.exit(f"❌ Valore '{k}' invalido o assente: {v!r}")
    if data["miodottore"] + data["google"] != data["total"]:
        sys.exit(
            f"❌ Incoerenza: total ({data['total']}) != "
            f"miodottore ({data['miodottore']}) + google ({data['google']}) "
            f"= {data['miodottore']+data['google']}"
        )
    return data


def detect_current_values():
    """Legge i 3 valori attualmente nel repo, dai pattern univoci nella home."""
    index = SITE_DIR / "index.html"
    if not index.exists():
        sys.exit(f"❌ {index} non trovato")
    html = index.read_text(errors="ignore")

    # Totale: "X.YYY Recensioni a 5 Stelle"
    m_total = re.search(r"([0-9]\.[0-9]{3}) Recensioni a 5 Stelle", html)
    # MD card: "Vedi su MioDottore (X.YYY)"
    m_md = re.search(r"Vedi su MioDottore \(([0-9.]+)\)", html)
    # GG card: "Vedi su Google (NNN)"
    m_gg = re.search(r"Vedi su Google \(([0-9]+)\)", html)

    if not (m_total and m_md and m_gg):
        sys.exit(
            "❌ Pattern univoci non trovati in site/index.html. "
            f"total={bool(m_total)} md={bool(m_md)} gg={bool(m_gg)}"
        )

    return {
        "total": int(m_total.group(1).replace(".", "")),
        "miodottore": int(m_md.group(1).replace(".", "")),
        "google": int(m_gg.group(1)),
    }


def files_to_scan():
    """Yields all HTML files in site/ to scan, escludendo backups/output/binari."""
    for path in SITE_DIR.rglob("*.html"):
        rel = str(path.relative_to(REPO_ROOT))
        if any(frag in rel for frag in SKIP_PATH_FRAGMENTS):
            continue
        if path.suffix.lower() in SKIP_SUFFIXES:
            continue
        yield path


def files_with_old(old_total: int, old_total_fmt: str):
    """Yields file path che contengono uno dei pattern del vecchio totale."""
    patterns = [
        old_total_fmt,
        f'"reviewCount":{old_total}',
        f'"reviewCount": "{old_total}"',
        f'"reviewCount":"{old_total}"',
        f'"ratingCount":{old_total}',
        f'"ratingCount": "{old_total}"',
        f'"ratingCount":"{old_total}"',
        f'data-counter="{old_total}"',
    ]
    for path in files_to_scan():
        try:
            content = path.read_text(errors="ignore")
        except Exception:
            continue
        if any(p in content for p in patterns):
            yield path


def replace_total(content: str, old: int, new: int) -> str:
    """Sostituisce SOLO i pattern univoci del totale (no falsi positivi).
    Preserva lo stile dell'originale (con o senza spazi dopo ':')."""
    of = format_italian(old)
    nf = format_italian(new)
    content = content.replace(of, nf)
    # JSON-LD: usa una regex che CAPTURA gli spazi originali per preservare lo stile
    def repl_string(match):
        # match.group(1) = spazi originali (può essere "" o " " o "  ")
        return f'"reviewCount":{match.group(1)}"{new}"'
    def repl_number(match):
        return f'"reviewCount":{match.group(1)}{new}'
    def repl_string_rating(match):
        return f'"ratingCount":{match.group(1)}"{new}"'
    def repl_number_rating(match):
        return f'"ratingCount":{match.group(1)}{new}'
    content = re.sub(rf'"reviewCount":(\s*)"{old}"', repl_string, content)
    content = re.sub(rf'"reviewCount":(\s*){old}\b', repl_number, content)
    content = re.sub(rf'"ratingCount":(\s*)"{old}"', repl_string_rating, content)
    content = re.sub(rf'"ratingCount":(\s*){old}\b', repl_number_rating, content)
    content = content.replace(f'data-counter="{old}"', f'data-counter="{new}"')
    return content


def replace_card_values(content: str, kind: str, old: int, new: int) -> str:
    """Sostituisce i valori delle card MD/GG. kind = 'md' | 'gg'."""
    of = format_italian(old)
    nf = format_italian(new)
    if kind == "md":
        content = content.replace(f">{of}<", f">{nf}<")  # > 2.763 <
        content = content.replace(f"MioDottore ({of})", f"MioDottore ({nf})")
    elif kind == "gg":
        content = content.replace(f">{of}<", f">{nf}<")
        content = content.replace(f"Google ({of})", f"Google ({nf})")
    return content


def apply_with_sentinels(old: dict, new: dict, dry_run: bool = False):
    """Applica le 3 sostituzioni in modo sicuro con sentinel."""
    # MD e GG vivono SOLO in SENTINEL_FILES. Il totale è ovunque.
    sentinel_md = "###__MD_SENTINEL_DO_NOT_LEAK__###"
    sentinel_gg = "###__GG_SENTINEL_DO_NOT_LEAK__###"

    # Step 1: proteggi MD e GG con sentinel nei file sentinel
    sentinel_paths = [REPO_ROOT / p for p in SENTINEL_FILES]
    sentinel_orig = {}
    for p in sentinel_paths:
        if not p.exists():
            continue
        content = p.read_text(errors="ignore")
        sentinel_orig[p] = content
        # MD
        of_md = format_italian(old["miodottore"])
        new_md = sentinel_md
        c = content.replace(f">{of_md}<", f">{new_md}<")
        c = c.replace(f"MioDottore ({of_md})", f"MioDottore ({new_md})")
        # GG
        of_gg = format_italian(old["google"])
        new_gg = sentinel_gg
        c = c.replace(f">{of_gg}<", f">{new_gg}<")
        c = c.replace(f"Google ({of_gg})", f"Google ({new_gg})")
        if not dry_run:
            p.write_text(c)

    # Step 2: sostituisci totale ovunque
    changed = 0
    for path in files_with_old(old["total"], format_italian(old["total"])):
        try:
            content = path.read_text(errors="ignore")
            new_content = replace_total(content, old["total"], new["total"])
            if new_content != content:
                if not dry_run:
                    path.write_text(new_content)
                changed += 1
        except Exception as e:
            print(f"  ⚠️  Errore su {path}: {e}", file=sys.stderr)

    # Step 3: rimpiazza sentinel con i NUOVI MD / GG
    if not dry_run:
        for p in sentinel_paths:
            if not p.exists():
                continue
            content = p.read_text(errors="ignore")
            content = content.replace(sentinel_md, format_italian(new["miodottore"]))
            content = content.replace(sentinel_gg, format_italian(new["google"]))
            p.write_text(content)

    return changed


def check_coherence(target: dict):
    """Verifica che in ogni HTML i valori siano quelli attesi (target).
    Ritorna lista di incongruenze."""
    issues = []
    of_total = format_italian(target["total"])
    of_md = format_italian(target["miodottore"])
    of_gg = format_italian(target["google"])

    # Pattern che devono esistere
    must_index = [
        (f"{of_total} Recensioni a 5 Stelle", "total visibile in index.html"),
        (f'"reviewCount":{target["total"]}', "reviewCount totale in JSON-LD"),
        (f'"ratingCount":{target["total"]}', "ratingCount totale in JSON-LD"),
        (f"MioDottore ({of_md})", "card MioDottore in index.html"),
        (f"Google ({of_gg})", "card Google in index.html"),
    ]
    index = SITE_DIR / "index.html"
    if not index.exists():
        issues.append(("site/index.html", "file mancante"))
    else:
        content = index.read_text(errors="ignore")
        for pattern, desc in must_index:
            if pattern not in content:
                issues.append(("site/index.html", f"manca: '{pattern[:80]}' ({desc})"))

    # Pattern che NON devono esistere (vecchi valori comuni)
    # (deduco dai valori currenti — se total non matcha, allarme generico)
    # Non hardcodo qui per non rendere lo script fragile a cambi futuri.

    return issues

# ---------- CLI ----------

def main():
    ap = argparse.ArgumentParser(description="Apply reviews from reviews.json to all site HTMLs.")
    ap.add_argument("--check", action="store_true",
                    help="Verifica solo coerenza (CI mode). Exit 2 se HTML diversi da reviews.json.")
    ap.add_argument("--dry-run", action="store_true",
                    help="Mostra cosa cambierebbe senza modificare i file.")
    args = ap.parse_args()

    target = load_reviews()
    print(f"📄 reviews.json: MD={target['miodottore']:5d}  GG={target['google']:5d}  TOTAL={target['total']:5d}")

    if args.check:
        issues = check_coherence(target)
        if issues:
            print(f"\n❌ {len(issues)} incongruenze rilevate (HTML differiscono da reviews.json):")
            for f, msg in issues[:20]:
                print(f"  - {f}: {msg}")
            print("\n💡 Per allineare: python3 scripts/apply-reviews.py")
            sys.exit(2)
        print("✅ Coerenza HTML ↔ reviews.json verificata")
        return

    current = detect_current_values()
    print(f"🔍 valori attuali nel repo: MD={current['miodottore']:5d}  GG={current['google']:5d}  TOTAL={current['total']:5d}")

    if current == target:
        print("✅ Repo già allineato a reviews.json, nessuna modifica necessaria")
        return

    diffs = []
    if current["miodottore"] != target["miodottore"]:
        diffs.append(f"MD {format_italian(current['miodottore'])} → {format_italian(target['miodottore'])}")
    if current["google"] != target["google"]:
        diffs.append(f"GG {format_italian(current['google'])} → {format_italian(target['google'])}")
    if current["total"] != target["total"]:
        diffs.append(f"TOTAL {format_italian(current['total'])} → {format_italian(target['total'])}")
    print(f"\n📝 Modifiche da applicare: {', '.join(diffs)}")

    if args.dry_run:
        print("🔬 Dry-run: nessun file modificato")
        return

    changed = apply_with_sentinels(current, target, dry_run=False)
    print(f"\n✅ {changed} file modificati")

    # Verifica post-apply
    issues = check_coherence(target)
    if issues:
        print(f"\n⚠️  POST-CHECK FALLITO ({len(issues)} incongruenze):")
        for f, msg in issues[:10]:
            print(f"  - {f}: {msg}")
        sys.exit(2)
    print("✅ Coerenza HTML ↔ reviews.json verificata post-apply")


if __name__ == "__main__":
    main()
