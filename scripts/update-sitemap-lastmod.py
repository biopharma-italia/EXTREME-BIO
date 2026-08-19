#!/usr/bin/env python3
"""Aggiorna i <lastmod> di site/sitemap.xml con la data reale dell'ultimo
commit git che ha toccato l'index.html corrispondente a ciascun URL.

Uso: python3 scripts/update-sitemap-lastmod.py [--dry-run]
Exit: 0 ok, 1 errore
"""
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SITEMAP = REPO / "site" / "sitemap.xml"


def git_lastmod(path: Path) -> str | None:
    rel = str(path.relative_to(REPO))
    try:
        # File con modifiche non ancora committate -> oggi
        st = subprocess.run(
            ["git", "status", "--porcelain", "--", rel],
            cwd=REPO, capture_output=True, text=True, timeout=30,
        )
        if st.stdout.strip():
            from datetime import date
            return date.today().isoformat()
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", rel],
            cwd=REPO, capture_output=True, text=True, timeout=30,
        )
        d = out.stdout.strip()
        return d if re.fullmatch(r"\d{4}-\d{2}-\d{2}", d) else None
    except Exception:
        return None


def main() -> int:
    dry = "--dry-run" in sys.argv
    xml = SITEMAP.read_text()
    changed = 0

    def repl(m: re.Match) -> str:
        nonlocal changed
        url, old = m.group(1), m.group(2)
        rel = url.replace("https://bio-clinic.it", "").strip("/")
        f = REPO / "site" / rel / "index.html" if rel else REPO / "site" / "index.html"
        if not f.exists():
            return m.group(0)
        new = git_lastmod(f)
        if new and new != old:
            changed += 1
            return m.group(0).replace(f"<lastmod>{old}</lastmod>", f"<lastmod>{new}</lastmod>")
        return m.group(0)

    xml_new = re.sub(
        r"<loc>(https://bio-clinic\.it[^<]*)</loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})</lastmod>",
        repl, xml,
    )
    if not dry and changed:
        SITEMAP.write_text(xml_new)
    print(f"lastmod aggiornati: {changed}/{xml.count('<lastmod>')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
