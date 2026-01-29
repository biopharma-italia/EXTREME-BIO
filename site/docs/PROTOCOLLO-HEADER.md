# 🔄 PROTOCOLLO GLOBAL UPDATE - HEADER BIO-CLINIC

**Versione:** 2.0  
**Data:** 2026-01-28  
**Stato:** ATTIVO  

---

## 📋 INDICE

1. [Regola Fondamentale](#regola-fondamentale)
2. [File Master](#file-master)
3. [Come Modificare il Menu](#come-modificare-il-menu)
4. [Verifica e Test](#verifica-e-test)
5. [Checklist Pre-Deploy](#checklist-pre-deploy)

---

## ⚠️ REGOLA FONDAMENTALE

> **OGNI MODIFICA ALL'HEADER DEVE ESSERE FATTA SOLO NEL FILE MASTER**  
> Poi eseguire lo script di propagazione per aggiornare TUTTE le 68+ pagine.

**NON MODIFICARE MAI** l'header direttamente nelle singole pagine HTML!

---

## 📁 FILE MASTER

### Percorso
```
/site/components/master-header.html
```

### Contenuto
Il file contiene:
- **Top Bar**: orari, telefono, social
- **Header principale**: logo, navigazione, CTA Prenota
- **Menu Mobile**: versione responsive completa

### Placeholder
Il file usa placeholder che vengono sostituiti automaticamente:

| Placeholder | Descrizione |
|-------------|-------------|
| `{{ROOT_PATH}}` | Path alla root (es. `../` o ``) |
| `{{PAGES_PATH}}` | Path alle pagine (es. `pages/` o ``) |
| `{{ACTIVE_HOME}}` | Classe `active` se pagina Home |
| `{{ACTIVE_SLIMCARE}}` | Classe `active` se pagina Slim Care |
| `{{ACTIVE_LAB}}` | Classe `active` se pagina Laboratorio |
| `{{ACTIVE_DONNA}}` | Classe `active` se pagina Donna/PMA |
| `{{ACTIVE_SPEC}}` | Classe `active` se pagina Specialisti |
| `{{ACTIVE_SHOP}}` | Classe `active` se pagina Shop |
| `{{ACTIVE_CONTATTI}}` | Classe `active` se pagina Contatti |

---

## 🛠️ COME MODIFICARE IL MENU

### Passo 1: Modifica il Master Header
Apri `/site/components/master-header.html` e fai le modifiche necessarie.

### Passo 2: Esegui lo Script di Propagazione
```bash
cd /home/user/webapp/site
python3 scripts/propagate-header.py
```

### Passo 3: Verifica l'Output
Lo script mostrerà:
- ✅ Pagine aggiornate
- ⏭️ Pagine già OK
- ❌ Eventuali errori

### Passo 4: Testa le Pagine Principali
Verifica almeno queste pagine:
- `index.html` (Home)
- `pages/cardiologia.html` (Specialità)
- `laboratorio/index.html` (Laboratorio)
- `equipe/index.html` (Équipe)
- `shop/index.html` (Shop)

---

## ✅ VERIFICA E TEST

### Test Manuale
1. Apri il browser in modalità privata
2. Naviga tra 5+ pagine diverse
3. Verifica che il menu sia IDENTICO su tutte
4. Testa i dropdown (hover desktop)
5. Testa il menu mobile (< 1024px)

### Test Automatico
```bash
cd /home/user/webapp/site
# Verifica uniformità voci menu
for f in index.html pages/*.html laboratorio/index.html; do
  echo "=== $f ===" 
  grep -o 'class="nav-link[^"]*">[^<]*' "$f" | head -7
done
```

### Controllo Link
```bash
# Verifica che tutti i link siano corretti
grep -rh 'href="[^"]*"' pages/*.html | grep -E '(slim-care|laboratorio|ginecologia)' | sort | uniq -c
```

---

## 📝 CHECKLIST PRE-DEPLOY

Prima di andare in produzione, verifica:

- [ ] Master header modificato correttamente
- [ ] Script di propagazione eseguito senza errori
- [ ] Tutte le 68+ pagine aggiornate
- [ ] Home page funzionante
- [ ] Pagine specialità funzionanti
- [ ] Laboratorio funzionante
- [ ] Équipe funzionante
- [ ] Shop funzionante
- [ ] Menu mobile funzionante
- [ ] Dropdown funzionanti
- [ ] CTA Prenota funzionante
- [ ] Nessun errore 404 nei link
- [ ] Nessun errore JavaScript in console

---

## 🗂️ STRUTTURA MENU ATTUALE (v2.0)

```
📌 TOP BAR
   └── 📞 079 956 1332
   └── 🕒 Lun-Ven 07:00-21:00 | Sab 08:00-14:00
   └── 📱 Facebook | Instagram

📌 HEADER
   └── 🏠 Home
   └── 💚 Slim Care Medical
       ├── Slim Care
       └── Slim Care Donna
   └── 🔬 Laboratorio
   └── 👶 Donna & PMA
       ├── Ginecologia
       └── PMA / Fertilità
   └── 👨‍⚕️ Specialisti
       ├── Cardiologia
       ├── Endocrinologia
       ├── Dermatologia
       ├── Neurologia
       ├── Oculistica
       ├── Ortopedia
       ├── Tutte le Specialità →
       └── Équipe Medica (48 Specialisti)
   └── 🛒 Medical Shop [NEW]
   └── 📍 Contatti
   └── [PRENOTA] (verde scuro)
```

---

## 📞 CONTATTI TECNICI

Per problemi con l'header:
- **Email tecnica:** gestione@bio-clinic.it
- **Tel:** 079 956 1332

---

*Documento generato automaticamente - 2026-01-28*
