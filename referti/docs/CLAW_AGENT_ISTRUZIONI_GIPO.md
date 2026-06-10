# Istruzioni operative per Agente Claw — Estrazione pazienti da GipoNext e sincronizzazione con Bio-Clinic

## Contesto

Bio-Clinic usa **GipoNext** (https://www.giponext.it) come gestionale medico per appuntamenti, referti e anagrafica pazienti. Il portale referti di Bio-Clinic (**referti.bio-clinic.it**) ha un database separato su Supabase. Per collegare i due sistemi, devi estrarre l'anagrafica completa dei pazienti da GipoNext e caricarla nel database di Bio-Clinic tramite una API REST dedicata.

**Risultato atteso**: ogni paziente presente in GipoNext sara' ricercabile per codice fiscale nel portale referti, con i dati anagrafici pre-compilati.

---

## FASE 1 — Accesso a GipoNext

### 1.1 Apri GipoNext

Vai su:
```
https://www.giponext.it
```

### 1.2 Login

Inserisci le credenziali della clinica Bio-Clinic:
- **Username/Email**: _(le credenziali GipoNext della clinica — chiedile all'amministratore se non le hai)_
- **Password**: _(password GipoNext della clinica)_

Clicca il pulsante di accesso/login.

### 1.3 Verifica di essere nel pannello corretto

Dopo il login dovresti vedere la dashboard principale di GipoNext con il nome della struttura "Bio-Clinic" (o il nome registrato). Se vedi un selettore di strutture/sedi, seleziona la sede corretta.

---

## FASE 2 — Navigazione all'anagrafica pazienti

### 2.1 Trova la sezione Pazienti/Anagrafica

GipoNext organizza l'interfaccia con un menu laterale o superiore. Cerca una di queste voci:
- **"Pazienti"**
- **"Anagrafica"**
- **"Anagrafica Pazienti"**
- **"Rubrica pazienti"**
- Un'icona con una persona o un gruppo di persone

Cliccala per accedere alla lista completa dei pazienti.

### 2.2 Visualizza la lista completa

Una volta nella sezione pazienti:
1. **Rimuovi eventuali filtri attivi** (date, medico, stato) per vedere TUTTI i pazienti
2. Se c'e' un selettore per il numero di risultati per pagina (10, 25, 50, 100...), impostalo al **massimo disponibile**
3. Se c'e' un'opzione "Mostra tutti" o "Tutti i pazienti", usala
4. Prendi nota del **numero totale di pazienti** mostrato (es. "Totale: 1.247 pazienti")

### 2.3 Se esiste un'opzione di esportazione

Controlla se GipoNext offre un pulsante **"Esporta"**, **"Export"**, **"Scarica CSV"** o **"Scarica Excel"** nella sezione anagrafica.

- **Se SI'**: Esporta l'intera anagrafica. Poi analizza il file esportato e mappa i campi al formato richiesto dalla API (vedi Fase 3).
- **Se NO**: Dovrai estrarre i dati paziente per paziente navigando le schede (vedi sotto).

---

## FASE 3 — Estrazione dati di ogni paziente

### 3.1 Campi da estrarre

Per ogni paziente, apri la sua scheda/profilo e raccogli questi dati:

#### OBBLIGATORI (senza questi, il paziente viene scartato dalla API)

| Campo API | Cosa cercare in GipoNext | Formato richiesto | Note |
|-----------|--------------------------|-------------------|------|
| `fiscal_code` | **Codice Fiscale** o **C.F.** | 16 caratteri, MAIUSCOLO | Es: `RSSMRA85M01H501Z`. Se non c'e' il CF, il paziente NON puo' essere sincronizzato — saltalo |
| `first_name` | **Nome** | Testo | Es: `Mario` |
| `last_name` | **Cognome** | Testo | Es: `Rossi` |

#### OPZIONALI (inserisci SOLO se il campo ha un valore reale in GipoNext)

| Campo API | Cosa cercare in GipoNext | Formato richiesto | Conversione necessaria |
|-----------|--------------------------|-------------------|----------------------|
| `email` | **Email** o **E-mail** | email minuscolo | Converti tutto in minuscolo |
| `phone` | **Telefono**, **Cellulare**, **Tel** | solo cifre, opzionale +39 davanti | Rimuovi spazi, trattini, parentesi. Es: `+393331234567` |
| `date_of_birth` | **Data di nascita**, **Nato/a il** | `YYYY-MM-DD` | GipoNext mostra probabilmente `GG/MM/AAAA` → converti: `01/08/1985` diventa `1985-08-01` |
| `gender` | **Sesso**, **Genere** | `M`, `F`, o `X` | Se dice "Maschio"→`M`, "Femmina"→`F`. Se non presente, OMETTI il campo |
| `address` | **Indirizzo**, **Via** | testo libero | Es: `Via Roma 15` |
| `city` | **Citta'**, **Comune** | testo | Es: `Sassari` |
| `province` | **Provincia**, **Prov** | 2 lettere MAIUSCOLE | `Sassari`→`SS`, `Cagliari`→`CA`, `Nuoro`→`NU`, `Oristano`→`OR`, `Sud Sardegna`→`SU` |
| `zip_code` | **CAP** | 5 cifre | Es: `07100` |
| `gipo_patient_id` | **ID paziente**, **Codice**, **N. cartella**, **ID** (qualsiasi identificativo numerico/alfanumerico univoco mostrato da GipoNext) | testo | Questo e' MOLTO IMPORTANTE — se GipoNext mostra un numero ID, un codice interno, o un numero di cartella, raccoglilo SEMPRE |

### 3.2 Regole di conversione CRITICHE

**Codice Fiscale:**
- Deve avere esattamente 16 caratteri
- Pattern: `LLLLLL##L##L###L` (L=lettera, #=cifra)
- Regex: `^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$`
- Convertilo SEMPRE in maiuscolo
- Se un paziente non ha CF valido → **SALTALO**, non puo' essere sincronizzato

**Data di nascita:**
- GipoNext la mostra probabilmente come `01/08/1985` (formato italiano GG/MM/AAAA)
- DEVI convertirla in formato ISO: `1985-08-01` (AAAA-MM-GG)
- Esempio: `15/03/1972` → `1972-03-15`

**Telefono:**
- Rimuovi: spazi, trattini, punti, parentesi
- `333 12 34 567` → `3331234567`
- `+39 333-1234567` → `+393331234567`
- `0079 123456` → `0079123456`

**Campi vuoti:**
- Se un campo opzionale e' vuoto in GipoNext → **NON includerlo nel JSON**
- NON inviare `"email": ""` o `"email": null` → semplicemente ometti il campo

### 3.3 Strategia di estrazione

**Se la lista pazienti e' navigabile pagina per pagina:**
1. Vai alla prima pagina della lista pazienti
2. Per ogni paziente nella pagina, clicca sul suo nome/riga per aprire la scheda dettaglio
3. Raccogli tutti i campi disponibili
4. Torna alla lista
5. Ripeti per ogni paziente della pagina
6. Passa alla pagina successiva
7. Continua fino all'ultima pagina

**Se hai esportato un file CSV/Excel:**
1. Leggi il file riga per riga
2. Identifica quali colonne corrispondono ai campi richiesti
3. Mappa e converti i valori

**Costruisci un array JSON** in memoria con tutti i pazienti raccolti. Non servira' salvarli su file — li invierai direttamente alla API.

---

## FASE 4 — Invio alla API di Bio-Clinic

### 4.1 Endpoint e autenticazione

```
POST https://referti.bio-clinic.it/api/admin/gipo/sync
```

**Headers OBBLIGATORI per OGNI richiesta:**
```
Content-Type: application/json
X-Gipo-Sync-Key: EW7g2aJUY1xIWXLlhDJvbLNAqLpE7Yifd80MEeSk
```

La chiave `X-Gipo-Sync-Key` e' l'unica autenticazione necessaria. Senza di essa, la richiesta viene rifiutata con HTTP 401.

### 4.2 Formato del body JSON

Invia i pazienti in un array `patients`. **Massimo 50 pazienti per richiesta** (consigliato per evitare timeout; il limite tecnico e' 500 ma 50 e' piu' sicuro).

```json
{
  "patients": [
    {
      "fiscal_code": "RSSMRA85M01H501Z",
      "first_name": "Mario",
      "last_name": "Rossi",
      "email": "mario.rossi@email.com",
      "phone": "+393331234567",
      "date_of_birth": "1985-08-01",
      "gender": "M",
      "address": "Via Roma 15",
      "city": "Sassari",
      "province": "SS",
      "zip_code": "07100",
      "gipo_patient_id": "12345"
    },
    {
      "fiscal_code": "VRDLRA90D55B354S",
      "first_name": "Laura",
      "last_name": "Verdi",
      "phone": "3289876543",
      "date_of_birth": "1990-04-15",
      "gender": "F",
      "city": "Alghero",
      "province": "SS",
      "zip_code": "07041"
    }
  ]
}
```

Se hai un solo paziente, puoi usare il formato singolo:
```json
{
  "patient": {
    "fiscal_code": "RSSMRA85M01H501Z",
    "first_name": "Mario",
    "last_name": "Rossi"
  }
}
```

### 4.3 Strategia di invio batch

Se hai N pazienti totali, dividili in gruppi da 50 e invia un gruppo alla volta:

```
Pazienti   1-50   → POST richiesta 1 → attendi risposta → verifica
Pazienti  51-100  → POST richiesta 2 → attendi risposta → verifica
Pazienti 101-150  → POST richiesta 3 → attendi risposta → verifica
...e cosi' via fino all'ultimo gruppo
```

**IMPORTANTE:**
- Attendi la risposta di ogni richiesta prima di inviare la successiva
- Aspetta almeno 2 secondi tra una richiesta e l'altra
- Se ricevi HTTP 429 (rate limit), aspetta 10 secondi e riprova

### 4.4 Leggere la risposta

**Risposta di successo (HTTP 200):**
```json
{
  "success": true,
  "synced": 48,
  "total": 50,
  "errors": [
    {
      "fiscal_code": "ABC123",
      "error": "Codice fiscale non valido."
    },
    {
      "fiscal_code": "???",
      "error": "Campi obbligatori mancanti: fiscal_code, first_name, last_name"
    }
  ]
}
```

| Campo | Significato |
|-------|-------------|
| `success` | `true` se la richiesta e' stata elaborata (anche se alcuni pazienti hanno errori) |
| `synced` | Numero di pazienti inseriti/aggiornati con successo |
| `total` | Numero totale di pazienti inviati in questa richiesta |
| `errors` | Array di pazienti che hanno avuto problemi (presente solo se ci sono errori) |

**Risposte di errore:**

| HTTP | Messaggio | Causa | Azione |
|------|-----------|-------|--------|
| 401 | "Autenticazione richiesta. Usa X-Gipo-Sync-Key o un token admin." | Header `X-Gipo-Sync-Key` mancante o chiave errata | Verifica di aver incluso l'header `X-Gipo-Sync-Key` con il valore esatto |
| 400 | "JSON non valido." | Il body non e' JSON valido | Controlla la sintassi JSON (virgole, parentesi, virgolette) |
| 400 | "Nessun paziente fornito." | Array `patients` vuoto o assente | Verifica che il body contenga almeno un paziente |
| 400 | "Massimo 500 pazienti per chiamata." | Troppi pazienti in una richiesta | Riduci a 50 pazienti per richiesta |
| 429 | Rate limit | Troppe richieste consecutive | Aspetta 10 secondi e riprova |

---

## FASE 5 — Verifica e gestione errori

### 5.1 Dopo ogni batch

Dopo ogni richiesta POST, analizza la risposta:

1. **Se `synced` == `total`**: Tutto OK, nessun errore. Passa al batch successivo.
2. **Se `synced` < `total`**: Alcuni pazienti hanno avuto errori. Analizza l'array `errors`:
   - **"Codice fiscale non valido"**: Il CF non rispetta il formato italiano. Verifica il CF nella scheda GipoNext del paziente. Probabilmente e' un CF straniero o un errore di digitazione — skippa il paziente.
   - **"Campi obbligatori mancanti"**: Manca `fiscal_code`, `first_name` o `last_name`. Torna alla scheda del paziente in GipoNext e recupera il dato mancante.
   - **Errori database**: Possibili problemi di formato su date o altri campi. Correggi e riprova.

### 5.2 Alla fine di tutti i batch

Conta il totale dei pazienti sincronizzati con successo sommando i `synced` di ogni risposta. Confrontalo con il numero totale di pazienti estratti da GipoNext.

Crea un report finale:
```
Pazienti totali in GipoNext: XXX
Pazienti inviati alla API:   XXX
Pazienti sincronizzati OK:   XXX
Pazienti con errori:         XXX
Pazienti senza CF (saltati): XXX
```

### 5.3 Risoluzione errori comuni

| Errore | Causa probabile | Soluzione |
|--------|----------------|-----------|
| CF non valido | CF straniero, CF provvisorio, errore digitazione | Verifica in GipoNext; se CF non e' italiano standard, non puo' essere sincronizzato |
| Data non valida | Formato data sbagliato (`01/08/1985` invece di `1985-08-01`) | Riconverti la data in formato ISO |
| Genere non valido | Inviato "Maschio" invece di "M" | Converti in `M`, `F`, o `X` |
| Provincia troppo lunga | Inviato "Sassari" invece di "SS" | Usa la sigla di 2 lettere |
| Timeout | Batch troppo grande | Riduci da 50 a 20 pazienti per richiesta |

---

## FASE 6 — Riesecuzione (idempotente)

Il sistema usa **UPSERT** sul codice fiscale: se invii un paziente con un CF gia' presente nel database, i suoi dati vengono **aggiornati** (non duplicati). Questo significa:

- Puoi rieseguire l'intera sincronizzazione in qualsiasi momento senza problemi
- Se un paziente viene aggiornato in GipoNext (nuovo telefono, nuovo indirizzo...), basta reinviarlo
- Non devi preoccuparti di inviare duplicati

---

## RIASSUNTO OPERATIVO RAPIDO

```
1. Apri https://www.giponext.it → login con credenziali Bio-Clinic
2. Vai a Pazienti/Anagrafica → rimuovi filtri → mostra tutti
3. Per ogni paziente: raccogli CF, nome, cognome + tutti i campi disponibili
4. Converti: CF→maiuscolo, date→YYYY-MM-DD, sesso→M/F/X, provincia→sigla, telefono→solo cifre
5. Costruisci array JSON con max 50 pazienti
6. POST https://referti.bio-clinic.it/api/admin/gipo/sync
   Header: Content-Type: application/json
   Header: X-Gipo-Sync-Key: EW7g2aJUY1xIWXLlhDJvbLNAqLpE7Yifd80MEeSk
   Body: {"patients": [...]}
7. Verifica risposta → gestisci errori → prossimo batch
8. Ripeti fino a esaurimento pazienti
```

---

## ESEMPIO COMPLETO — Richiesta e risposta reale

### Richiesta:
```http
POST https://referti.bio-clinic.it/api/admin/gipo/sync
Content-Type: application/json
X-Gipo-Sync-Key: EW7g2aJUY1xIWXLlhDJvbLNAqLpE7Yifd80MEeSk

{
  "patients": [
    {
      "fiscal_code": "DSSMRG85L04I452G",
      "first_name": "Margherita",
      "last_name": "Dessole",
      "email": "margherita.dessole@email.com",
      "phone": "+393401234567",
      "date_of_birth": "1985-07-04",
      "gender": "F",
      "address": "Via Sardegna 22",
      "city": "Sassari",
      "province": "SS",
      "zip_code": "07100",
      "gipo_patient_id": "GPN-001"
    },
    {
      "fiscal_code": "CRTSRG83M08I452Y",
      "first_name": "Sergio",
      "last_name": "Cirotto",
      "email": "sergiocirotto@gmail.com",
      "phone": "+393489876543",
      "date_of_birth": "1983-08-08",
      "gender": "M",
      "city": "Sassari",
      "province": "SS",
      "zip_code": "07100",
      "gipo_patient_id": "GPN-002"
    },
    {
      "fiscal_code": "FSNGLC90A41H501Z",
      "first_name": "Angelica",
      "last_name": "Fois",
      "email": "foisangelica2@gmail.com",
      "gender": "F",
      "city": "Sassari",
      "province": "SS"
    }
  ]
}
```

### Risposta attesa (HTTP 200):
```json
{
  "success": true,
  "synced": 3,
  "total": 3
}
```

---

## NOTE TECNICHE PER L'AGENTE

1. **Il CF e' la chiave primaria** — tutto ruota intorno al codice fiscale. Senza CF valido non si puo' fare nulla.
2. **L'API e' idempotente** — puoi richiamarla quante volte vuoi, non crea duplicati.
3. **I dati vengono usati per il pre-fill** — quando un operatore inserisce un CF nel portale referti, il sistema cerca prima tra gli utenti registrati, poi nella tabella gipo_patients. Se trova un match, pre-compila i campi anagrafica.
4. **Non servono credenziali Supabase** — la API gestisce tutto internamente. Tu usi solo l'endpoint HTTPS con la chiave `X-Gipo-Sync-Key`.
5. **Se GipoNext ha un'API o un export CSV**, usalo — e' molto piu' veloce che navigare scheda per scheda.
6. **Se GipoNext mostra paginazione** (es. 25 pazienti per pagina), naviga TUTTE le pagine. Non fermarti alla prima.
7. **Se un paziente non ha il codice fiscale** in GipoNext (campo vuoto o placeholder), **saltalo** — non puo' essere sincronizzato senza CF.
