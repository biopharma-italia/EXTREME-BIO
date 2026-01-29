# 👨‍⚕️ PROTOCOLLO AUTO-LINK MEDICI - BIO-CLINIC

**Versione:** 3.0  
**Data:** 2026-01-28  
**Stato:** ATTIVO  

---

## 📋 REGOLA FONDAMENTALE

> **OGNI NOME DI MEDICO NELLE PAGINE DEVE ESSERE CLICCABILE**  
> e collegato al profilo in `/equipe/{slug}.html`

---

## 🔧 COME FUNZIONA

### 1. Database Medici
Il file `data/entities/physicians-complete.json` contiene tutti i medici con:
- `slug`: identificativo URL (es. `giuliana-guagnozzi`)
- `full_name`: nome completo con titolo (es. `Dott.ssa Giuliana Guagnozzi`)
- `title`: titolo (es. `Dott.`, `Dott.ssa`, `Prof.`)
- `job_title`: specialità (es. `Cardiologa`)

### 2. Script Auto-Link
Lo script `scripts/physician-autolink-v3.py` scansiona tutte le pagine HTML e:
- Trova ogni menzione di un medico (es. "Dott.ssa Sara Uras")
- Crea un link cliccabile al profilo
- Gestisce varianti: Dott./Dott.ssa/Prof./Dr.

### 3. Pagine Profilo
Ogni medico ha una pagina dedicata in `/equipe/{slug}.html` con:
- Bio e specialità
- Pulsante prenotazione (telefono o MioDottore)

---

## 🚀 COME AGGIUNGERE UN NUOVO MEDICO

### Passo 1: Aggiungi al Database
```python
# Modifica data/entities/physicians-complete.json
{
  "id": "nome-cognome",
  "slug": "nome-cognome",
  "title": "Dott.",  # oppure "Dott.ssa", "Prof."
  "name": "Nome Cognome",
  "full_name": "Dott. Nome Cognome",
  "specialty_id": "cardiologia",  # ID specialità
  "job_title": "Cardiologo",
  "bio": "Descrizione del medico...",
  ...
}
```

### Passo 2: Genera la Pagina Profilo
```bash
# Esegui lo script di generazione
python3 scripts/generate-physician-pages.py
```

### Passo 3: Aggiorna i Link nelle Pagine
```bash
# Esegui lo script di auto-link
python3 scripts/physician-autolink-v3.py
```

### Passo 4: Verifica
```bash
# Controlla che il medico sia linkato
grep "nome-cognome" pages/*.html
```

---

## 📊 STATISTICHE ATTUALI

| Risorsa | Conteggio |
|---------|-----------|
| Medici nel database | 53 |
| Pagine profilo in /equipe/ | 55 |
| Link attivi in cardiologia.html | 5 |
| Link attivi in ginecologia.html | 9 |
| Link attivi totali | 35+ |

---

## ⚠️ TROUBLESHOOTING

### Medico non linkato?
1. Verifica che sia nel database JSON
2. Verifica che il `full_name` corrisponda esattamente al testo nella pagina
3. Riesegui `physician-autolink-v3.py`

### Link rotto (404)?
1. Verifica che esista il file `/equipe/{slug}.html`
2. Verifica che lo slug sia corretto (lowercase, con trattini)

### Variante nome non riconosciuta?
Aggiungi la variante nella funzione `build_physician_patterns()` dello script.

---

## 📁 FILE CORRELATI

- `data/entities/physicians-complete.json` - Database medici
- `scripts/physician-autolink-v3.py` - Script auto-link
- `equipe/*.html` - Pagine profilo medici
- `css/style.css` - Stili `.physician-link`

---

*Documento generato automaticamente - 2026-01-28*
