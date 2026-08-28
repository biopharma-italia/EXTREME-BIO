#!/usr/bin/env python3
"""
sync-site-facts.py — FONTE DELLA VERITA' dei numeri Bio-Clinic.

Legge:
  - site/data/site-facts.json            (totali canonici: recensioni, esami, ecc.)
  - site/data/entities/physicians.json   (medici reali -> conteggi per specialita')

Propaga i valori canonici su TUTTE le pagine HTML (incluse _components/ e _drafts/).

Uso:
  python3 scripts/sync-site-facts.py --check   # verifica (exit 1 se divergenze) - usato dal CI
  python3 scripts/sync-site-facts.py --apply   # corregge i file

Per cambiare un numero sul sito: modificare site-facts.json o physicians.json,
poi eseguire --apply. MAI modificare i numeri a mano nelle singole pagine.
"""
import json
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
FACTS_PATH = os.path.join(SITE, 'data', 'site-facts.json')
PHYSICIANS_PATH = os.path.join(SITE, 'data', 'entities', 'physicians.json')

SKIP_DIRS = {'node_modules', '.git'}


def load_data():
    facts = json.load(open(FACTS_PATH, encoding='utf-8'))
    phys = json.load(open(PHYSICIANS_PATH, encoding='utf-8'))
    # Conteggio per specialita': primaria + secondarie (es. Burrai = endocrinologia + pediatria)
    counts = Counter(d['specialty_id'] for d in phys['physicians'])
    for d in phys['physicians']:
        for s in d.get('secondary_specialty_ids', []):
            counts[s] += 1
    total = len(phys['physicians'])
    return facts, dict(counts), total


def singular(word):
    """Plurale italiano -> singolare per le professioni usate."""
    table = {
        'ostetriche': 'ostetrica', 'fisiatri': 'fisiatra', 'pediatri': 'pediatra',
        'oculisti': 'oculista', 'specialisti': 'specialista',
    }
    if word.lower() in table:
        out = table[word.lower()]
    elif word.lower().endswith('i'):
        out = word[:-1] + 'o'
    else:
        out = word
    return out.capitalize() if word[0].isupper() else out


def count_phrase(n, word):
    if n == 1:
        return f"1 {singular(word)}"
    return f"{n} {word}"


def build_rules(facts, spec_counts, total_physicians):
    t = facts['totals']
    reviews = t['reviews']          # "4.450"
    lab_tests = t['lab_tests']      # "1.162"
    n_med = str(total_physicians)   # "51"

    regex_rules = []  # (compiled_pattern, replacement, description)

    # --- Recensioni: tutte le varianti -> canonico ---
    regex_rules.append((re.compile(r'3\.200\+?(\s*[Rr]ecensioni)'), reviews + r'\1', 'recensioni 3.200 -> canonico'))
    regex_rules.append((re.compile(r'3\.914(\s*[Rr]ecensioni)'), reviews + r'\1', 'recensioni 3.914 -> canonico'))
    regex_rules.append((re.compile(re.escape(reviews) + r'\+(\s*[Rr]ecensioni)'), reviews + r'\1', 'recensioni con + spurio'))
    # varianti "oltre 3.200 recensioni positive" gia' coperte dal primo pattern

    # --- Esami laboratorio: 1.100 / 1.100+ / 1.136 / 1.200+ / 1.162+ -> canonico ---
    regex_rules.append((re.compile(r'1\.(?:100|136|200)\+?((?:</strong>)?\s*[Ee]sami)'), lab_tests + r'\1', 'esami -> canonico'))
    regex_rules.append((re.compile(re.escape(lab_tests) + r'\+((?:</strong>|</div>|</td>)?\s*(?:[Ee]sami|Esami))'), lab_tests + r'\1', 'esami con + spurio'))
    # stat-box split: <div ...>1.100+</div><div ...>Esami laboratorio interno</div>
    regex_rules.append((re.compile(r'>1\.(?:100|136|200)\+?(</div>\s*<div[^>]*>\s*Esami)'), '>' + lab_tests + r'\1', 'stat-box esami split'))
    regex_rules.append((re.compile(r'>1\.162\+(</div>\s*<div[^>]*>\s*Esami)'), '>' + lab_tests + r'\1', 'stat-box esami 1.162+'))
    regex_rules.append((re.compile(r'>1\.162\+(</td>)'), '>' + lab_tests + r'\1', 'td esami 1.162+'))
    regex_rules.append((re.compile(r'(listino-stat-value">)1\.200\+(</div>)'), r'\g<1>' + lab_tests + r'\g<2>', 'listino stat esami'))
    # laboratorio hero: <div ...>1.162+</div> seguito da "Esami Disponibili"
    regex_rules.append((re.compile(r'>1\.162\+(</div>\s*<div[^>]*>\s*Esami Disponibili)'), '>' + lab_tests + r'\1', 'hero lab esami'))

    # --- Totale medici/specialisti: 48/50/67 -> canonico ---
    for wrong in ('48', '50', '67'):
        if wrong == n_med:
            continue
        regex_rules.append((re.compile(r'\b' + wrong + r'(\s*(?:[Mm]edici|[Ss]pecialisti)\b)'), n_med + r'\1',
                            f'medici totali {wrong} -> {n_med}'))
        # contatori "split" su elementi separati: <div ...>67</div> <div>Medici Specialisti</div>
        regex_rules.append((
            re.compile(r'(data-counter=")' + wrong + r'(">)' + wrong + r'(</div>\s*<div[^>]*>\s*Medici Specialisti)'),
            r'\g<1>' + n_med + r'\g<2>' + n_med + r'\g<3>',
            f'contatore animato {wrong} -> {n_med}'))
        regex_rules.append((
            re.compile(r'>' + wrong + r'(</div>\s*<div class="label">\s*Medici Specialisti)'),
            '>' + n_med + r'\g<1>',
            f'stat-card {wrong} -> {n_med}'))
        # stat-item split: <div class="stat-number">67</div><div class="stat-label">Specialisti</div>
        regex_rules.append((
            re.compile(r'(stat-number">)' + wrong + r'(</div>\s*<div class="stat-label">\s*(?:Medici )?Specialisti)'),
            r'\g<1>' + n_med + r'\g<2>',
            f'stat-item {wrong} -> {n_med}'))

    # --- Claim "Ginecologia (N specialisti)" nel testo -> conteggio DB ---
    def paren_repl_factory(n):
        def repl(m):
            if int(m.group(2)) == n:
                return m.group(0)
            return m.group(1) + '(' + count_phrase(n, 'specialisti') + ')'
        return repl

    for spec_name, spec_id in (('Ginecologia', 'ginecologia'), ('Cardiologia', 'cardiologia'),
                               ('Endocrinologia', 'endocrinologia'), ('Dermatologia', 'dermatologia'),
                               ('Oculistica', 'oculistica'), ('Ortopedia', 'ortopedia'),
                               ('Neurologia', 'neurologia')):
        n = spec_counts.get(spec_id, 0)
        if n < 1:
            continue
        pat = re.compile('(' + spec_name + r'\s*)\((\d+)\s+specialist[io]\)')
        regex_rules.append((pat, paren_repl_factory(n), f'{spec_name} (N specialisti) -> {n}'))

    # --- Parole di specialita' (es. "6 ginecologi" -> "7 ginecologi") ---
    for spec_id, words in facts.get('specialty_words', {}).items():
        n = facts.get('specialty_overrides', {}).get(spec_id, spec_counts.get(spec_id, 0))
        if n < 1:
            continue
        for w in words:
            # matcha sia minuscolo che Capitalizzato, numero qualsiasi diverso dal canonico
            pat = re.compile(r'\b(\d+)\s+(' + w + r'|' + w.capitalize() + r')\b')

            def make_repl(n):
                def repl(m):
                    if int(m.group(1)) == n:
                        return m.group(0)
                    return count_phrase(n, m.group(2))
                return repl
            regex_rules.append((pat, make_repl(n), f'{spec_id}: N {w} -> {n}'))

    return regex_rules


# Regole esplicite (stringa -> stringa), idempotenti.
def build_literal_rules(facts, spec_counts):
    lab_tests = facts['totals']['lab_tests']
    return [
        # home: card Laboratorio (le biologhe sono 2, il claim "4 specialisti" non era verificabile)
        ('<span class="specialty-count">26 categorie • 4 specialisti</span>',
         f'<span class="specialty-count">26 categorie • {lab_tests} esami</span>'),
        # laboratorio: "I nostri 5 specialisti, iscritti all'Ordine dei Medici" -> senza numero non verificabile
        ('I nostri 5 specialisti, iscritti', 'I nostri specialisti, iscritti'),
    ]


def fix_specialty_cards(content, facts, spec_counts):
    """Corregge 'N specialisti' dentro le card <a href="/slug/">...</a> in base al DB."""
    slug_map = facts.get('slug_to_specialty', {})
    overrides = facts.get('specialty_overrides', {})

    def card_repl(m):
        href, body = m.group(1), m.group(0)
        slug = href.strip('/')
        spec = slug_map.get(slug)
        n = overrides.get(slug, None)
        if n is None and spec:
            n = spec_counts.get(spec)
        if not n:
            return body

        def num_repl(nm):
            if int(nm.group(1)) == n:
                return nm.group(0)
            return count_phrase(n, nm.group(2))
        return re.sub(r'\b(\d+)\s+([Ss]pecialisti)\b', num_repl, body)

    return re.sub(r'<a href="(/[a-z0-9/-]+/)"[^>]*>.*?</a>', card_repl, content, flags=re.S)


def fix_hub_pages(path, content, facts, spec_counts):
    """Nelle pagine hub di specialita' (site/<slug>/index.html) allinea 'N specialisti' al DB."""
    rel = os.path.relpath(path, SITE).replace(os.sep, '/')
    if not rel.endswith('/index.html'):
        return content
    slug = rel[:-len('/index.html')]
    spec = facts.get('slug_to_specialty', {}).get(slug)
    if not spec or slug == 'laboratorio':   # laboratorio: gestione speciale (biologhe vs refertanti)
        return content
    n = facts.get('specialty_overrides', {}).get(slug, spec_counts.get(spec, 0))
    if n < 1:
        return content

    def repl(m):
        if int(m.group(1)) == n:
            return m.group(0)
        return count_phrase(n, m.group(2))
    # solo numeri "piccoli" (1-2 cifre) per non toccare prezzi/quantita' estranee;
    # lookbehind: NON toccare la voce di menu "Équipe Medica (NN Specialisti)" (totale sito)
    return re.sub(r'(?<!Medica \()\b(\d{1,2})\s+([Ss]pecialisti)\b', repl, content)


STATBOX_LABELS = {
    # label (inizio) -> specialty_id
    'Specialisti Psicologia': 'psicologia',
    'Specialisti Gastroenterologia': 'gastroenterologia',
    'Specialisti Pneumologia': 'pneumologia',
    'Specialisti Reumatologia': 'reumatologia',
    'Specialisti Urologia': 'urologia',
    'Specialisti Medicina Interna': 'medicina-interna',
    'Specialisti Scienza della Nutrizione': 'nutrizione',
    'Specialisti Pediatria': 'pediatria',
    'Specialisti Ematologia': 'ematologia',
    'Specialisti Neurologia': 'neurologia',
    'Specialisti Oculistica': 'oculistica',
    'Specialisti Ortopedia': 'ortopedia',
    'Specialisti ORL': 'otorinolaringoiatria',
    'Specialisti Endocrinologia': 'endocrinologia',
    'Cardiologi specialisti': 'cardiologia',
    'Dermatologi specialisti': 'dermatologia',
    'Endocrinologi specialisti': 'endocrinologia',
    'Nefrologi specialisti': 'nefrologia',
}


def fix_stat_boxes(content, facts, spec_counts):
    """Stat-box split: <div ...>N</div><div class="text-gray-600 text-sm">Specialisti Urologia</div>
    Allinea N al DB e corregge la grammatica per N=1 (Specialista/Cardiologo/...)."""
    pat = re.compile(r'(>)(\d{1,2})(</div>\s*<div class="text-gray-600 text-sm">)([^<]+)(</div>)')

    def repl(m):
        label = m.group(4).strip()
        spec = None
        for prefix, sid in STATBOX_LABELS.items():
            if label.startswith(prefix):
                spec = sid
                break
        if spec is None:
            return m.group(0)
        n = spec_counts.get(spec, 0)
        if n < 1:
            return m.group(0)
        new_label = label
        if n == 1:
            new_label = (label.replace('Specialisti', 'Specialista')
                              .replace('specialisti', 'specialista')
                              .replace('Cardiologi', 'Cardiologo').replace('Dermatologi', 'Dermatologo')
                              .replace('Endocrinologi', 'Endocrinologo').replace('Nefrologi', 'Nefrologo'))
        else:
            new_label = (label.replace('Specialista', 'Specialisti').replace('specialista', 'specialisti'))
        return m.group(1) + str(n) + m.group(3) + new_label + m.group(5)

    return pat.sub(repl, content)


def extra_home_rules(path, content):
    """Regole puntuali della home."""
    if os.path.relpath(path, SITE) != 'index.html':
        return content
    # <li><strong>Ginecologia</strong> - 6 Specialisti -> conteggio card (gia' allineato dalle card rules? no: e' una <li>)
    content = re.sub(r'(Ginecologia</strong>\s*-\s*)\d+(\s*Specialisti)', r'\g<1>7\g<2>', content)
    return content


FORBIDDEN = [
    (r'3\.200\+?\s*[Rr]ecensioni', 'recensioni 3.200'),
    (r'3\.914', 'recensioni 3.914'),
    (r'4\.450\+', 'recensioni 4.450+'),
    (r'1\.1(?:00|36)\+?(?:</strong>)?\s*[Ee]sami', 'esami non canonici'),
    (r'\b(?:48|50|67)\s*(?:[Mm]edici|[Ss]pecialisti)\b', 'totale medici non canonico'),
]


def iter_html_files():
    for root, dirs, files in os.walk(SITE):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith('.html'):
                yield os.path.join(root, f)


def process(apply=False):
    facts, spec_counts, total = load_data()
    regex_rules = build_rules(facts, spec_counts, total)
    literal_rules = build_literal_rules(facts, spec_counts)

    changed_files = []
    forbidden_hits = []

    for path in iter_html_files():
        original = open(path, encoding='utf-8').read()
        content = original

        for old, new in literal_rules:
            content = content.replace(old, new)
        for pat, repl, _desc in regex_rules:
            content = pat.sub(repl, content)
        content = fix_specialty_cards(content, facts, spec_counts)
        content = fix_hub_pages(path, content, facts, spec_counts)
        content = fix_stat_boxes(content, facts, spec_counts)
        content = extra_home_rules(path, content)

        if content != original:
            changed_files.append(os.path.relpath(path, ROOT))
            if apply:
                open(path, 'w', encoding='utf-8').write(content)

        # scan pattern vietati sul contenuto finale
        for pat, label in FORBIDDEN:
            for m in re.finditer(pat, content):
                snippet = content[max(0, m.start()-40):m.end()+20].replace('\n', ' ')
                forbidden_hits.append((os.path.relpath(path, ROOT), label, snippet))

    return changed_files, forbidden_hits, facts, spec_counts, total


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--check'
    apply = (mode == '--apply')

    changed, forbidden, facts, spec_counts, total = process(apply=apply)

    print(f"Fonte della verita': {total} professionisti | recensioni {facts['totals']['reviews']} | "
          f"esami {facts['totals']['lab_tests']} | rating {facts['totals']['rating']}")
    print(f"Conteggi specialita' (da physicians.json): {json.dumps(spec_counts, ensure_ascii=False)}")

    if apply:
        print(f"\n[APPLY] File corretti: {len(changed)}")
        for f in changed[:40]:
            print(f"  ~ {f}")
        if len(changed) > 40:
            print(f"  ... e altri {len(changed)-40}")
    else:
        if changed:
            print(f"\n[CHECK] DIVERGENZE in {len(changed)} file (eseguire: python3 scripts/sync-site-facts.py --apply):")
            for f in changed[:40]:
                print(f"  ! {f}")

    if forbidden:
        print(f"\n[CHECK] Pattern vietati residui ({len(forbidden)}):")
        for f, label, snip in forbidden[:20]:
            print(f"  ! {f} [{label}]: ...{snip}...")

    if not apply and (changed or forbidden):
        sys.exit(1)
    if apply and forbidden:
        print("\nATTENZIONE: pattern vietati non risolti automaticamente — correggere a mano.")
        sys.exit(1)
    print("\nOK: tutti i numeri del sito sono allineati alla fonte della verita'.")


if __name__ == '__main__':
    main()
