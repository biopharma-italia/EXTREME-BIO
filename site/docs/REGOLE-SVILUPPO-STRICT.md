# BIO-CLINIC SASSARI - REGOLE DI SVILUPPO STRICT

**Versione:** 2.0.0  
**Ultimo aggiornamento:** 2026-01-28  
**Stato:** OBBLIGATORIO per ogni modifica

---

## OBIETTIVO

Questo documento definisce le **REGOLE FERREE** che DEVONO essere seguite per OGNI modifica al sito Bio-Clinic Sassari. L'obiettivo è prevenire errori comuni come:

- Menu inconsistenti tra pagine
- Medici senza link al profilo
- Tag HTML sbilanciati
- JSON-LD invalido
- Path errati

---

## REGOLA 1: HEADER UNICO E CENTRALIZZATO

### Principio
L'header del sito DEVE essere definito in UN SOLO file:  
`/components/master-header.html`

### Cosa FARE
1. Modificare SOLO `/components/master-header.html` per cambiare il menu
2. Eseguire SEMPRE `python3 scripts/propagate-header.py` dopo la modifica
3. Verificare che il messaggio mostri "74 pagine aggiornate"

### Cosa NON FARE
- ❌ MAI modificare direttamente l'header in singole pagine
- ❌ MAI copiare/incollare l'header manualmente
- ❌ MAI aggiungere voci menu "solo in alcune pagine"

### Comando di Propagazione
```bash
cd /home/user/webapp/site
python3 scripts/propagate-header.py
```

---

## REGOLA 2: OGNI MEDICO DEVE ESSERE CLICCABILE

### Principio
Ogni volta che un nome di medico appare nel sito, DEVE essere un link cliccabile al profilo.

### Checklist Pre-Inserimento Medico
- [ ] Il medico esiste in `/data/entities/physicians-complete.json`?
- [ ] La pagina `/equipe/{slug}.html` esiste?
- [ ] Il medico ha `miodottore_url` configurato?

### Procedura per Aggiungere un Nuovo Medico
1. **Aggiungi al database JSON:**
   ```json
   {
     "id": "nome-cognome",
     "slug": "nome-cognome",
     "name": "Nome Cognome",
     "full_name": "Dott. Nome Cognome",
     "title": "Dott.",
     "specialty_id": "specialita",
     "job_title": "Titolo Professionale",
     "miodottore_url": "https://www.miodottore.it/...",
     "booking_enabled": true
   }
   ```

2. **Genera la pagina profilo:**
   ```bash
   python3 scripts/generate-physician-page.py nome-cognome
   ```

3. **Esegui auto-linker:**
   ```bash
   python3 scripts/physician-autolink-v3.py
   ```

4. **Verifica:**
   ```bash
   python3 scripts/validate-site-v2.py
   ```

### Cosa NON FARE
- ❌ MAI scrivere nomi di medici come testo semplice
- ❌ MAI linkare manualmente senza usare `class="physician-link"`
- ❌ MAI omettere l'attributo `title` con profilo e specialità

---

## REGOLA 3: PATH SEMPRE RELATIVI

### Principio
TUTTI i link interni DEVONO usare path relativi, MAI assoluti.

### Mappatura Path Corretti

| Posizione Pagina | CSS/JS/Images | Equipe |
|------------------|---------------|--------|
| `/index.html` (root) | `css/`, `js/`, `images/` | `equipe/` |
| `/pages/*.html` | `../css/`, `../js/`, `../images/` | `../equipe/` |
| `/laboratorio/*.html` | `../css/`, `../js/`, `../images/` | `../equipe/` |
| `/equipe/*.html` | `../css/`, `../js/`, `../images/` | (stesso livello) |

### Cosa NON FARE
- ❌ MAI usare `/equipe/` (path assoluto dal root)
- ❌ MAI usare `https://bio-clinic.it/...` per link interni
- ❌ MAI mischiare path assoluti e relativi

---

## REGOLA 4: TAG HTML BILANCIATI

### Principio
Ogni tag aperto DEVE essere chiuso. I tag singleton (header, footer, main) devono apparire UNA SOLA volta.

### Verifica Automatica
```bash
python3 scripts/validate-site-v2.py
```

Se vedi `E001` o `E002`, c'è un problema di tag.

### Fix Automatico per Header Duplicati
```bash
python3 scripts/fix-header-tags.py
```

---

## REGOLA 5: JSON-LD VALIDO

### Principio
Ogni JSON-LD DEVE essere sintatticamente corretto.

### Verifica Sintassi
Prima di committare, valida il JSON-LD:
```bash
grep -A 50 'application/ld+json' pages/nomepagina.html | python3 -c "import sys, json; json.loads(sys.stdin.read())"
```

### Errori Comuni
- ❌ Virgola finale prima di `}`
- ❌ Tag HTML dentro JSON (da autolinker mal configurato)
- ❌ Stringhe non escapate

### Cosa NON FARE
- ❌ MAI inserire HTML dentro blocchi JSON-LD
- ❌ MAI modificare JSON-LD manualmente senza validare

---

## REGOLA 6: META DESCRIPTION

### Principio
Ogni pagina DEVE avere una meta description di max 160 caratteri.

### Formato Consigliato
```
{Specialità} Bio-Clinic Sassari: {X} specialisti, {Y} prestazioni. {Lista servizi}. Prenota: 079 956 1332.
```

### Esempio
```html
<meta name="description" content="Cardiologia Bio-Clinic Sassari: 5 cardiologi, 39 prestazioni. ECG, ecocardiogramma, holter. Prenota: 079 956 1332.">
```

---

## CHECKLIST PRE-COMMIT

Prima di ogni commit, esegui:

```bash
cd /home/user/webapp/site

# 1. Propaga header se modificato
python3 scripts/propagate-header.py

# 2. Auto-link medici
python3 scripts/physician-autolink-v3.py

# 3. Valida tutto il sito
python3 scripts/validate-site-v2.py
```

### Commit SOLO se:
- [ ] validate-site-v2.py mostra "VALIDAZIONE COMPLETATA CON SUCCESSO"
- [ ] Nessun errore E001-E010
- [ ] Warning sono accettabili (es. meta description 165 chars invece di 160)

---

## CODICI DI ERRORE

| Codice | Descrizione | Fix |
|--------|-------------|-----|
| E001 | Tag HTML non bilanciato | `fix-header-tags.py` |
| E002 | Header duplicato | `fix-header-tags.py` |
| E003 | Menu inconsistente | `propagate-header.py` |
| E004 | Medico senza link | `physician-autolink-v3.py` |
| E005 | Path assoluto (errato) | Correggere manualmente |
| E006 | Pagina équipe mancante | Generare con script |
| E007 | JSON-LD invalido | Correggere manualmente |
| E008 | Meta mancante/lunga | Correggere manualmente |
| E009 | Footer mancante | Verificare template |
| E010 | Mobile nav mancante | Verificare master-header |

---

## WORKFLOW COMPLETO PER NUOVA PAGINA

1. **Crea la pagina** usando come template una esistente
2. **Includi l'header** dal master (usa placeholder `{{ROOT_PATH}}` ecc.)
3. **Aggiungi JSON-LD** valido
4. **Aggiungi meta description** (max 160 chars)
5. **Se ci sono medici**, assicurati che siano nel database
6. **Esegui propagate-header.py**
7. **Esegui physician-autolink-v3.py**
8. **Esegui validate-site-v2.py**
9. **Testa la pagina** nel browser
10. **Commit** solo se validazione OK

---

## CONTATTI PER SUPPORTO

In caso di dubbi, consultare:
- `/docs/SCHEMA-TECNICO-GEMINI.md` - Architettura completa
- `/docs/PROTOCOLLO-HEADER.md` - Gestione header
- `/docs/PROTOCOLLO-MEDICI-AUTOLINK.md` - Gestione link medici
- `/data/SCHEMA-VALIDAZIONE.json` - Regole in formato JSON

---

**RICORDA**: Queste regole esistono per evitare ore di debugging. Seguile SEMPRE!
