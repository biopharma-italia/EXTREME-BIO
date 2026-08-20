#!/usr/bin/env python3
"""
Internal linking /salute/ -> /esami/
Inserisce un box "Esami correlati" (con prezzi reali dal listino) prima della
<section class="cta"> di ogni articolo, secondo una mappa clinica CURATA.
Idempotente: marker <!-- box-esami-correlati --> (se presente, sostituisce il box).

Uso: python3 scripts/link-salute-esami.py [--dry-run]
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(__file__), '..')
SALUTE = os.path.join(ROOT, 'site', 'salute')
ESAMI = os.path.join(ROOT, 'site', 'esami')
LISTINO = os.path.join(ROOT, 'site', 'data', 'listino-processed.json')

MARK_START = '<!-- box-esami-correlati -->'
MARK_END = '<!-- /box-esami-correlati -->'

# ============================================================
# MAPPA CLINICA CURATA: articolo /salute/<slug>/ -> id landing /esami/<id>/
# Solo correlazioni clinicamente fondate. Articoli senza esami di
# laboratorio pertinenti sono volutamente assenti.
# ============================================================
MAP = {
    'anemia-mediterranea-talassemia': ['emocromo', 'elettroforesi-emoglobina-hb', 'sideremia', 'ferritina', 'transferrina', 'hb-emoglobine-anomale-hbs-hbd-hbh-ecc'],
    'noduli-tiroidei': ['ormone-tireotropo-tsh', 'tiroxina-libera-ft4', 'triiodotironina-libera-ft3', 'calcitonina', 'anticorpi-anti-tireoglobulina', 'anticorpi-anti-tireoperossidasi'],
    'ipotiroidismo': ['ormone-tireotropo-tsh', 'tsh-reflex', 'tiroxina-libera-ft4', 'triiodotironina-libera-ft3', 'anticorpi-anti-tireoperossidasi', 'anticorpi-anti-tireoglobulina'],
    'ipertiroidismo': ['ormone-tireotropo-tsh', 'tiroxina-libera-ft4', 'triiodotironina-libera-ft3', 'anticorpi-anti-tireoperossidasi'],
    'tiroide-gravidanza': ['ormone-tireotropo-tsh', 'tiroxina-libera-ft4', 'anticorpi-anti-tireoperossidasi'],
    'colesterolo-alto': ['colesterolo-totale', 'colesterolo-hdl', 'colesterolo-ldl', 'trigliceridi', 'lipoproteina-a', 'omocisteina'],
    'diabete-tipo-2-sardegna': ['glucosio', 'emoglobina-glicata-hba1c', 'insulinemia', 'glucosio-0-60-120'],
    'celiachia-sardegna': ['anticorpi-anti-transglutaminasi-iga', 'anticorpi-anti-endomisio-ema-iga', 'anticorpi-anti-gliadina-deamidata-iga', 'immunoglobuline-iga'],
    'helicobacter-pylori': ['breath-test-helicobacter', 'helicobacter-pylori-ricerca-antigene-nelle-feci'],
    'reflusso-gastroesofageo': ['breath-test-helicobacter', 'helicobacter-pylori-ricerca-antigene-nelle-feci'],
    'gastrite-cronica': ['breath-test-helicobacter', 'helicobacter-pylori-ricerca-antigene-nelle-feci', 'emocromo'],
    'sindrome-intestino-irritabile': ['calprotectina-fecale-quantitativa', 'breath-test-al-lattosio', 'anticorpi-anti-transglutaminasi-iga', 'feci-esame-chimico-fisico-parassitologico'],
    'vitamina-d-carenza': ['vitamina-d-25-oh', 'calcio', 'fosforo', 'pth-intatto-paratormone'],
    'osteoporosi-prevenzione': ['vitamina-d-25-oh', 'calcio', 'pth-intatto-paratormone', 'fosfatasi-alcalina'],
    'menopausa-sintomi': ['ormone-follicolo-stimolante-fsh', 'estradiolo', 'ormone-luteinizzante-lh', 'ormone-tireotropo-tsh'],
    'sindrome-ovaio-policistico': ['testosterone', 'dhea-s-deidroepiandrosterone-solfato', 'ormone-luteinizzante-lh', 'ormone-follicolo-stimolante-fsh', 'insulinemia', 'prolattina'],
    'infertilita-femminile': ['ormone-anti-mulleriano-amh', 'ormone-follicolo-stimolante-fsh', 'ormone-luteinizzante-lh', 'estradiolo', 'progesterone', 'prolattina'],
    'infertilita-maschile': ['spermiogramma-esame-del-liquido-seminale', 'spermiocoltura-completa', 'testosterone', 'ormone-follicolo-stimolante-fsh'],
    'ipertrofia-prostatica': ['antigene-prostatico-specifico-psa-totale', 'psa-libero-free-psa', 'psa-reflex'],
    'prostatite': ['antigene-prostatico-specifico-psa-totale', 'esame-colturale-dell-urina-urinocoltura', 'spermiocoltura-completa'],
    'cistite-ricorrente': ['esame-colturale-dell-urina-urinocoltura', 'esame-chimico-fisico-delle-urine'],
    'incontinenza-urinaria': ['esame-colturale-dell-urina-urinocoltura', 'esame-chimico-fisico-delle-urine'],
    'calcoli-renali': ['creatinina', 'azotemia', 'acido-urico', 'calcio', 'esame-chimico-fisico-delle-urine'],
    'nefropatia-diabetica': ['creatinina', 'azotemia', 'emoglobina-glicata-hba1c', 'esame-chimico-fisico-delle-urine'],
    'epatite-steatosi-epatica': ['transaminasi-g-p-t-alt', 'transaminasi-g-o-t-ast', 'gamma-glutamiltransferasi', 'bilirubina-totale', 'hbsag-antigene-australia', 'anticorpi-anti-hcv'],
    'artrite-reumatoide-sardegna': ['reuma-test-fattore-reumatoide', 'ves', 'proteina-c-reattiva-pcr', 'anticorpi-anti-nucleo-ana'],
    'fibromialgia': ['ves', 'proteina-c-reattiva-pcr', 'ormone-tireotropo-tsh', 'vitamina-d-25-oh', 'emocromo'],
    'check-up-cardiovascolare': ['colesterolo-totale', 'colesterolo-hdl', 'colesterolo-ldl', 'trigliceridi', 'glucosio', 'omocisteina'],
    'ipertensione-arteriosa': ['creatinina', 'potassio', 'sodio', 'esame-chimico-fisico-delle-urine', 'colesterolo-totale'],
    'fibrillazione-atriale': ['ormone-tireotropo-tsh', 'potassio', 'emocromo', 'd-dimero'],
    'aritmie-cardiache': ['potassio', 'magnesio', 'ormone-tireotropo-tsh', 'emocromo'],
    'obesita-sindrome-metabolica': ['glucosio', 'emoglobina-glicata-hba1c', 'insulinemia', 'colesterolo-totale', 'trigliceridi', 'ormone-tireotropo-tsh'],
    'ansia-attacchi-panico': ['ormone-tireotropo-tsh', 'emocromo', 'vitamina-b12', 'vitamina-d-25-oh'],
    'cefalea-emicrania': ['emocromo', 'ves', 'proteina-c-reattiva-pcr'],
    'vertigini-labirintite': ['emocromo', 'glucosio', 'vitamina-b12'],
    'neuropatia-periferica': ['vitamina-b12', 'glucosio', 'emoglobina-glicata-hba1c', 'emocromo'],
    'pap-test-hpv': ['tamponi-cervico-vaginali-completi', 'esame-colturale-tampone-vaginale', 'ricerca-ag-chlamydia', 'ricerca-mycoplasmi-e-ureaplasmi-tampone-vaginale'],
    'endometriosi-sintomi': ['antigene-carboidratico-ca-125', 'emocromo'],
    'ecografia-gravidanza': ['beta-hcg-plasmatico', 'ogtt-curva-glicemica-in-gravidanza', 'gruppo-sanguigno-fattore-rh', 'test-di-coombs-indiretto', 'anticorpi-anti-toxoplasma-igg', 'anticorpi-anti-rosolia-igg'],
    'analisi-sangue-guida': ['emocromo', 'glucosio', 'colesterolo-totale', 'ormone-tireotropo-tsh', 'creatinina', 'transaminasi-g-p-t-alt'],
    'alimentazione-sport': ['emocromo', 'ferritina', 'creatinchinasi-ck', 'glucosio'],
    'visita-medicina-sport': ['emocromo', 'ferritina', 'creatinchinasi-ck', 'glucosio'],
    'medicina-lavoro-sassari': ['esami-medicina-del-lavoro-base', 'drug-test', 'emocromo'],
    'allergie-stagionali': ['ige-totali', 'emocromo'],
    'asma-bronchiale': ['ige-totali', 'emocromo'],
    'dermatite-atopica': ['ige-totali'],
    'eczema-mani': ['ige-totali'],
    'acne-adulti': ['testosterone', 'dhea-s-deidroepiandrosterone-solfato'],
    'psoriasi': ['ves', 'proteina-c-reattiva-pcr', 'acido-urico'],
    'apnee-notturne': ['emocromo', 'glucosio', 'ormone-tireotropo-tsh'],
    'insufficienza-venosa': ['d-dimero', 'emocromo'],
}


def load_prices():
    data = json.load(open(LISTINO))
    return {e['id']: e for e in data}


def exam_name(eid):
    """Nome pulito dall'H1 della landing (senza ' a Sassari')."""
    p = os.path.join(ESAMI, eid, 'index.html')
    html = open(p).read()
    m = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
    name = m.group(1).strip()
    return re.sub(r'\s+a Sassari$', '', name)


def fmt_price(v):
    s = f"{v:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    return s[:-3] if s.endswith(',00') else s


def build_box(slug, exam_ids, prices):
    items = []
    for eid in exam_ids:
        if not os.path.isdir(os.path.join(ESAMI, eid)):
            print(f"  ⚠ {slug}: landing /esami/{eid}/ inesistente, salto")
            continue
        name = exam_name(eid)
        price = prices.get(eid, {}).get('prezzo')
        price_html = f'<span style="color:#00704A;font-weight:700;white-space:nowrap;">€ {fmt_price(price)}</span>' if price else ''
        items.append(
            f'<a href="/esami/{eid}/" title="{name}: prezzo, preparazione e prenotazione" '
            f'style="display:flex;justify-content:space-between;align-items:center;gap:.75rem;'
            f'padding:.7rem 1rem;background:#fff;border:1px solid #d1e7dd;border-radius:10px;'
            f'text-decoration:none;color:#1f2937;font-weight:600;font-size:.95rem;">'
            f'<span>{name}</span>{price_html}</a>')
    if not items:
        return None
    grid = '\n        '.join(items)
    return f'''{MARK_START}
<section aria-label="Esami di laboratorio correlati" style="background:#f0fdf4;border-top:1px solid #d1e7dd;border-bottom:1px solid #d1e7dd;padding:2.5rem 0;">
  <div class="container">
    <h2 style="font-size:1.35rem;color:#00704A;margin-bottom:.5rem;">🔬 Esami di laboratorio correlati</h2>
    <p style="color:#4b5563;margin-bottom:1.25rem;font-size:.95rem;">Disponibili al laboratorio Bio-Clinic di Sassari, Via Renzo Mossa 23 &mdash; prelievi Lun-Ven 7:00-21:00, Sab 8:00-14:00, senza prenotazione.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.75rem;">
        {grid}
    </div>
    <p style="margin-top:1rem;font-size:.9rem;"><a href="/esami/" style="color:#00704A;font-weight:600;">Vedi tutti gli esami e i prezzi &rarr;</a></p>
  </div>
</section>
{MARK_END}
'''


def main():
    dry = '--dry-run' in sys.argv
    prices = load_prices()
    done = skipped = 0
    for slug, exam_ids in sorted(MAP.items()):
        path = os.path.join(SALUTE, slug, 'index.html')
        if not os.path.isfile(path):
            print(f"⚠ articolo mancante: {slug}")
            continue
        html = open(path).read()
        box = build_box(slug, exam_ids, prices)
        if not box:
            skipped += 1
            continue
        # idempotenza: rimuovi box esistente
        html = re.sub(re.escape(MARK_START) + r'.*?' + re.escape(MARK_END) + r'\n?', '', html, flags=re.S)
        anchor = '<section class="cta">'
        if anchor not in html:
            print(f"⚠ {slug}: anchor CTA non trovato, salto")
            skipped += 1
            continue
        html = html.replace(anchor, box + '\n' + anchor, 1)
        if not dry:
            open(path, 'w').write(html)
        done += 1
        print(f"✓ {slug}: {len(exam_ids)} esami linkati")
    print(f"\n{'DRY-RUN — ' if dry else ''}Articoli aggiornati: {done}, saltati: {skipped}, mappati: {len(MAP)}")


if __name__ == '__main__':
    main()
