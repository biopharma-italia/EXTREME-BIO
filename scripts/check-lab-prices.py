#!/usr/bin/env python3
"""
check-lab-prices.py — Gate di coerenza prezzi esami di laboratorio.

Fonte di verità: site/data/listino-processed.json (campo `prezzo`, per `id`).

Il problema che risolve
-----------------------
Le pagine hanno più "rappresentazioni" dello stesso prezzo: card visibili,
FAQ visibili, FAQ in JSON-LD, OfferCatalog in JSON-LD, meta description,
blocchi <noscript>. Quando cambia il listino, di solito si aggiornano solo le
card e le altre restano stantie (es. emocromo €5 vs €6,50, vitamina D €22 vs
€16). Google usa il JSON-LD per rich result/AI Overview; chi non esegue JS
vede il noscript: il paziente trova al banco un prezzo diverso da quello
letto.

Cosa controlla
--------------
Per un insieme di esami "sentinella" (quelli citati a mano in FAQ/noscript/
meta), cerca in TUTTI gli HTML del sito pattern del tipo:

    <nome esame> ... €X   |   <nome esame> ... X euro   |   "name":"<nome>"..."price":"X"

e fallisce se X != prezzo di listino. Le regex sono strette (max 12 caratteri
fra nome e importo) per evitare falsi positivi su pacchetti che contengono
l'esame ("Check-up con emocromo... €89" NON matcha).

Uso
---
    python3 scripts/check-lab-prices.py            # report + exit 1 se incoerenze
    python3 scripts/check-lab-prices.py --verbose  # mostra anche i match corretti

Aggiungere una sentinella: una riga in SENTINELS (id listino, regex nome).
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
LISTINO = SITE / "data" / "listino-processed.json"

# Directory da NON scansionare (backup storici, bozze, admin, artefatti)
SKIP_DIRS = {"backups", "_drafts", "node_modules", "admin", ".git", "docs",
             "hover-demo", "demo-esami", ".deploy-staging"}

# (id nel listino, regex del nome come appare nei testi)
# NB: regex case-insensitive; non includere pacchetti (hanno prezzi propri).
SENTINELS: list[tuple[str, str]] = [
    ("emocromo",              r"emocromo(?:\s+completo)?(?!\s+(?:in\s+citrato|con\s+formula))"),
    ("vitamina-d-25-oh",      r"vitamina\s+d(?:\s*\(?25[\s-]*oh\)?)?(?!\s*(?:3|1-25|1,25))"),
    ("ferritina",             r"ferritina"),
    ("ormone-tireotropo-tsh", r"(?<![\w-])TSH(?:\s*-\s*Tireotropina)?(?!\s*(?:reflex|\+|,\s*FT|/))"),
    ("triiodotironina-libera-ft3", r"(?<![\w+])(?<!\+\s)FT3(?![\w+])(?!\s\+)"),
    ("tiroxina-libera-ft4",   r"(?<![\w+])(?<!\+\s)FT4(?![\w+])(?!\s\+)"),
    ("sideremia",             r"sideremia"),
    ("antigene-prostatico-specifico-psa-totale", r"PSA\s+totale"),
    ("glucosio",              r"glicemia(?!\s+(?:a\s+digiuno|post|curva))|glucosio(?!\s+(?:0|6-))"),
    ("colesterolo-totale",    r"colesterolo(?:\s+totale)?(?!\s+(?:hdl|ldl|non|vldl))"),
    ("beta-hcg-plasmatico",   r"beta[\s-]*hcg(?:\s+plasmatic[oa])?(?:\s*\(test\s+gravidanza\))?"),
    ("prelievo-venoso",       r"prelievo(?:\s+venoso|\s+ematico)?(?:\s+standard)?(?!\s+(?:a\s+domicilio|microbiologico|urgente))"),
    ("check-up-base",         r"check[\s-]?up\s+base"),
    ("check-up-donna-under-40", r"check[\s-]?up\s+donna\s+under\s+40"),
    ("check-up-uomo-under-40",  r"check[\s-]?up\s+uomo\s+under\s+40"),
    ("check-up-donna-over-40",  r"check[\s-]?up\s+donna\s+over\s+40"),
    ("check-up-uomo-over-40",   r"check[\s-]?up\s+uomo\s+over\s+40"),
    ("check-up-bambino",      r"check[\s-]?up\s+bambino"),
    ("check-up-sport",        r"check[\s-]?up\s+sport"),
    ("check-up-tiroide-base", r"check[\s-]?up\s+tiroide\s+base"),
    ("check-up-tiroide-plus", r"check[\s-]?up\s+tiroide\s+plus"),
    ("check-up-pre-gravidanza", r"check[\s-]?up\s+pre[\s-]gravidanza"),
]

# Incoerenze NOTE in attesa di decisione della direzione sanitaria/amministrativa.
# Vengono riportate come WARNING (non bloccano il deploy) finché non si decide
# quale sia il valore corretto. Rimuovere la voce appena risolta.
#   chiave: (percorso relativo a site/, id sentinella)
PENDING_DECISION: dict[tuple[str, str], str] = {
    ("endocrinologia/checkup-tiroide/index.html", "check-up-tiroide-plus"):
        "Pagina: Tiroide Plus €59 (TSH, FT3, FT4, anti-TPO, anti-TG). Listino: €87. "
        "Composizione/prezzo del pacchetto da confermare con il laboratorio.",
    ("laboratorio/prenota/index.html", "prelievo-venoso"):
        "Selettore prenotazione (D1 services.prelievo-standard) = €5; listino PRELIEVO VENOSO = €3,50. "
        "Allineare D1 o listino: e' il prezzo effettivamente incassato al banco a decidere.",
}

# importo subito dopo il nome: "- 5 euro", ": €5", " €5,00", " da €5", " costa €5"
PRICE_TAIL = (
    r"(?![\w)])(?!\s+Sassari)"
    r"[^<€\d\n]{0,12}?"
    r"(?:€\s?(?P<eur>\d+(?:[.,]\d{1,2})?)|(?P<num>\d+(?:[.,]\d{1,2})?)\s?euro)"
)
# "name":"Emocromo Completo" ... "price":"5"   (stesso oggetto Offer, max 160 char)
JSONLD_TAIL = r'[^"]*"[^}]{0,160}?"price":\s*"?(?P<jp>\d+(?:\.\d+)?)'


def load_listino() -> dict[str, float]:
    items = json.loads(LISTINO.read_text(encoding="utf-8"))
    out: dict[str, float] = {}
    for it in items:
        # id duplicati nel listino: tieni il primo (stesso prezzo nei casi noti)
        out.setdefault(it["id"], float(it["prezzo"]))
    return out


def fmt(v: float) -> str:
    return f"{v:.2f}".rstrip("0").rstrip(".").replace(".", ",")


def iter_html():
    for dirpath, dirnames, filenames in os.walk(SITE):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.endswith(".html") and not fn.endswith(".bak"):
                yield Path(dirpath) / fn


def main() -> int:
    verbose = "--verbose" in sys.argv
    listino = load_listino()
    missing = [i for i, _ in SENTINELS if i not in listino]
    if missing:
        print(f"::error::id non trovati nel listino: {missing}")
        return 2

    compiled = []
    for lid, rx in SENTINELS:
        compiled.append((
            lid, listino[lid],
            re.compile(r"(?i)(?:" + rx + r")" + PRICE_TAIL),
            re.compile(r'(?i)"name":\s*"(?:' + rx + r")" + JSONLD_TAIL),
        ))

    errors: list[str] = []
    warnings: list[str] = []
    ok = 0
    for path in iter_html():
        text = path.read_text(encoding="utf-8", errors="ignore")
        rel = path.relative_to(ROOT)
        for lid, expected, rx_text, rx_json in compiled:
            for m in rx_text.finditer(text):
                raw = m.group("eur") or m.group("num")
                if not raw:
                    continue
                val = float(raw.replace(",", "."))
                line = text.count("\n", 0, m.start()) + 1
                ctx = re.sub(r"\s+", " ", text[max(0, m.start() - 25): m.end() + 5])
                if abs(val - expected) > 0.004:
                    msg = f"{rel}:{line}  [{lid}] trovato €{fmt(val)} atteso €{fmt(expected)}  …{ctx}…"
                    key = (str(path.relative_to(SITE)), lid)
                    (warnings if key in PENDING_DECISION else errors).append(msg)
                else:
                    ok += 1
                    if verbose:
                        print(f"  ok  {rel}:{line} [{lid}] €{fmt(val)}")
            for m in rx_json.finditer(text):
                val = float(m.group("jp"))
                line = text.count("\n", 0, m.start()) + 1
                if abs(val - expected) > 0.004:
                    msg = f"{rel}:{line}  [{lid}] JSON-LD price {val} atteso {expected}  …{m.group(0)[:90]}…"
                    key = (str(path.relative_to(SITE)), lid)
                    (warnings if key in PENDING_DECISION else errors).append(msg)
                else:
                    ok += 1

    print(f"Listino: {LISTINO.relative_to(ROOT)} — {len(SENTINELS)} sentinelle, {ok} occorrenze coerenti")
    if warnings:
        print(f"\n⚠️  {len(warnings)} incoerenze NOTE in attesa di decisione (non bloccanti):")
        for w in warnings:
            print("  " + w)
        for key, why in PENDING_DECISION.items():
            print(f"    → {key[0]} [{key[1]}]: {why}")
    if errors:
        print(f"\n❌ {len(errors)} incoerenze prezzo vs listino:\n")
        for e in errors:
            print("  " + e)
        print("\nCorreggi l'HTML (o aggiorna il listino se è il listino a essere vecchio).")
        return 1
    print("✅ Tutti i prezzi sentinella coincidono con il listino.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
