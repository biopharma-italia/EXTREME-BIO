# 🛡️ REGOLE DI SVILUPPO BIO-CLINIC

**Versione:** 1.0  
**Data:** 2026-01-28  
**Stato:** OBBLIGATORIO  

---

## ⚠️ REGOLE INVIOLABILI

Queste regole DEVONO essere seguite SEMPRE. Nessuna eccezione.

---

## 📋 REGOLA 1: HEADER UNICO

### Principio
> **L'header DEVE essere identico al millimetro su TUTTE le pagine**

### Voci Menu Obbligatorie (in ordine)
```
1. Home
2. Slim Care Medical (dropdown)
3. Laboratorio
4. Donna & PMA (dropdown)
5. Specialisti (dropdown)
6. Medical Shop
7. Contatti
8. [Prenota] (pulsante verde)
```

### Procedura di Modifica
```bash
# 1. Modifica SOLO il file master
nano /site/components/master-header.html

# 2. Propaga a tutte le pagine
python3 scripts/propagate-header.py

# 3. Verifica
python3 scripts/validate-site.py
```

### ❌ VIETATO
- Modificare l'header direttamente nelle pagine HTML
- Avere voci di menu diverse tra pagine
- Omettere voci di menu

---

## 📋 REGOLA 2: MEDICI SEMPRE LINKATI

### Principio
> **OGNI nome di medico DEVE essere un link cliccabile al profilo**

### Formato Link Corretto
```html
<a href="../equipe/{slug}.html" 
   class="physician-link" 
   title="Vedi profilo e prenota - {Nome Completo} - {Specialità}">
   {Nome Visualizzato}
</a>
```

### Procedura
```bash
# 1. Aggiungi medico al database
# Modifica: data/entities/physicians-complete.json

# 2. Genera pagina profilo (se nuovo)
python3 scripts/generate-physician-pages.py

# 3. Applica auto-link a tutte le pagine
python3 scripts/physician-autolink-v3.py

# 4. Verifica
python3 scripts/validate-site.py
```

### ❌ VIETATO
- Lasciare nomi di medici come testo semplice
- Usare path assoluti (/equipe/) invece di relativi (../equipe/)
- Dimenticare la classe `physician-link`

---

## 📋 REGOLA 3: TAG HTML BILANCIATI

### Principio
> **Ogni tag aperto DEVE avere il suo tag di chiusura**

### Tag Critici da Verificare
- `<header>` / `</header>`
- `<nav>` / `</nav>`
- `<main>` / `</main>`
- `<section>` / `</section>`
- `<div>` / `</div>`
- `<footer>` / `</footer>`

### Verifica Rapida
```bash
# Conta tag aperti vs chiusi
for f in *.html; do
  opens=$(grep -o '<header' "$f" | wc -l)
  closes=$(grep -o '</header>' "$f" | wc -l)
  [ "$opens" != "$closes" ] && echo "❌ $f: header $opens/$closes"
done
```

### ❌ VIETATO
- Lasciare tag non chiusi
- Annidare tag header dentro altri header
- Avere contenuto "orfano" fuori da tag contenitori

---

## 📋 REGOLA 4: PATH RELATIVI

### Principio
> **Usare SEMPRE path relativi, MAI assoluti**

### Struttura Path per Profondità

| Posizione File | Path alla Root | Path a Pages | Path a Equipe |
|---------------|----------------|--------------|---------------|
| `/index.html` | ` ` | `pages/` | `equipe/` |
| `/pages/*.html` | `../` | ` ` | `../equipe/` |
| `/equipe/*.html` | `../` | `../pages/` | ` ` |
| `/laboratorio/*.html` | `../` | `../pages/` | `../equipe/` |

### ❌ VIETATO
- Usare path assoluti: `href="/equipe/..."` ❌
- Path corretti: `href="../equipe/..."` ✅

---

## 📋 REGOLA 5: VALIDAZIONE PRIMA DEL DEPLOY

### Principio
> **SEMPRE eseguire la validazione prima di qualsiasi deploy**

### Comando Obbligatorio
```bash
python3 scripts/validate-site.py
```

### Output Atteso
```
✅✅✅ ALL CHECKS PASSED! ✅✅✅
```

### Se Fallisce
1. NON deployare
2. Leggere gli errori
3. Correggere ogni errore
4. Ri-eseguire la validazione
5. Solo quando passa, procedere

---

## 🔧 CHECKLIST PRE-DEPLOY

Prima di ogni deploy, verificare:

```
□ python3 scripts/validate-site.py → PASSA
□ Header identico su tutte le pagine
□ Tutti i medici linkati
□ Nessun tag HTML sbilanciato
□ Nessun path assoluto
□ Testato in browser (cache pulita)
□ Testato su mobile
□ Console JavaScript senza errori
```

---

## 📁 SCRIPT DI MANUTENZIONE

| Script | Funzione |
|--------|----------|
| `validate-site.py` | Validazione completa del sito |
| `propagate-header.py` | Propaga header a tutte le pagine |
| `physician-autolink-v3.py` | Linka automaticamente i medici |
| `fix-header-tags.py` | Corregge tag header duplicati |
| `fix-orphan-content.py` | Rimuove contenuto orfano |

---

## 🚨 IN CASO DI ERRORI

### Problema: Menu diversi tra pagine
```bash
python3 scripts/propagate-header.py
python3 scripts/validate-site.py
```

### Problema: Medici non linkati
```bash
python3 scripts/physician-autolink-v3.py
python3 scripts/validate-site.py
```

### Problema: Tag HTML sbilanciati
```bash
python3 scripts/fix-header-tags.py
python3 scripts/fix-orphan-content.py
python3 scripts/validate-site.py
```

### Problema: Scroll bloccato
1. Verifica tag HTML bilanciati
2. Controlla CSS per `overflow: hidden` non voluto
3. Verifica che non ci siano `position: fixed` errati

---

## 📞 CONTATTI

Per problemi tecnici:
- **Email:** gestione@bio-clinic.it
- **Tel:** 079 956 1332

---

*Documento obbligatorio per tutti gli sviluppatori - 2026-01-28*
