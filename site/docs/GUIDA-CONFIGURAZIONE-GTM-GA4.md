# Guida Configurazione GTM + GA4 — Bio-Clinic CGE v2.1

**Tempo stimato totale: 45 minuti**

---

## PARTE 1: Import Container GTM (15 minuti)

### Step 1.1 — Accedi a Google Tag Manager

1. Vai su **https://tagmanager.google.com**
2. Accedi con l'account Google che gestisce il container **GTM-PWZWX5RS**
3. Seleziona il container **Bio-Clinic CGE** (GTM-PWZWX5RS)

### Step 1.2 — Scarica il file JSON

Il file è già nel sito deployato:
- **URL:** https://bio-clinic.pages.dev/docs/gtm-container-CGE_v1_foundation.json
- Oppure lo trovi nel repository: `/site/docs/gtm-container-CGE_v1_foundation.json`

Scaricalo sul tuo computer.

### Step 1.3 — Importa il container

1. In GTM, clicca **Admin** (icona ingranaggio in alto)
2. Nella colonna "Container", clicca **Import Container**
3. Clicca **Choose container file** → seleziona il file JSON scaricato
4. **Choose workspace:** seleziona `Default Workspace`
5. **Choose an import option:** seleziona **Merge** → **Rename conflicting tags, triggers, and variables**
   - ⚠️ Usa "Merge" e NON "Overwrite" se hai già dei tag nel container
   - Se il container è vuoto, puoi usare "Overwrite"
6. Clicca **Confirm**

### Step 1.4 — Verifica l'import

Dopo l'import, verifica che siano presenti:

**Variables (25):** Vai in Variables → User-Defined Variables
- [ ] `dlv_bc_page_type`
- [ ] `dlv_bc_specialty`
- [ ] `dlv_bc_service_name`
- [ ] `dlv_bc_physician_name`
- [ ] `dlv_bc_price_range`
- [ ] `dlv_bc_funnel_stage`
- [ ] `dlv_bc_content_group`
- [ ] `dlv_bc_user_id`
- [ ] `dlv_bc_session_id`
- [ ] `dlv_bc_lead_type`
- [ ] `dlv_bc_phone_number`
- [ ] `dlv_bc_click_text`
- [ ] `dlv_bc_click_location`
- [ ] `dlv_bc_form_id`
- [ ] `dlv_bc_engagement_type`
- [ ] `dlv_bc_device_type`
- [ ] `dlv_bc_user_email_hash`
- [ ] `dlv_bc_user_phone_hash`
- [ ] `dlv_bc_selected_service`
- [ ] `dlv_bc_version`
- [ ] `dlv_bc_lead_id`
- [ ] `dlv_bc_revenue`
- [ ] `dlv_bc_transaction_id`
- [ ] `dlv_generate_lead_value`
- [ ] `dlv_purchase_transaction_id`

**Triggers (16):** Vai in Triggers
- [ ] `trg_All_Pages`
- [ ] `trg_DOM_Ready`
- [ ] `trg_bc_page_context`
- [ ] `trg_bc_phone_click`
- [ ] `trg_bc_whatsapp_click`
- [ ] `trg_bc_prenota_click`
- [ ] `trg_bc_form_submit`
- [ ] `trg_bc_deep_engagement`
- [ ] `trg_bc_price_interest`
- [ ] `trg_bc_consent_update`
- [ ] `trg_bc_lead_generated`
- [ ] `trg_bc_enhanced_conversion`
- [ ] `trg_generate_lead`
- [ ] `trg_purchase`
- [ ] `trg_bc_booking_confirmed`

**Tags (12):** Vai in Tags
- [ ] `tag_GA4_Configuration` (tipo: Google Analytics: GA4 Configuration)
- [ ] `tag_GA4_bc_phone_click`
- [ ] `tag_GA4_bc_whatsapp_click`
- [ ] `tag_GA4_bc_prenota_click`
- [ ] `tag_GA4_bc_form_submit`
- [ ] `tag_GA4_bc_deep_engagement`
- [ ] `tag_GA4_bc_price_interest`
- [ ] `tag_GA4_bc_lead_generated`
- [ ] `tag_GA4_generate_lead`
- [ ] `tag_GA4_purchase`
- [ ] `tag_GA4_bc_booking_confirmed`

### Step 1.5 — Verifica il tag GA4 Configuration

1. Clicca su `tag_GA4_Configuration`
2. Controlla che il **Measurement ID** sia `G-9EXCL016VJ`
   - Se è diverso o vuoto, inserisci `G-9EXCL016VJ`
3. Controlla che **Send a page view event** sia attivo
4. Controlla che in **Fields to Set** ci siano:
   - `user_id` = `{{dlv_bc_user_id}}`
   - `content_group` = `{{dlv_bc_content_group}}`
5. Salva

### Step 1.6 — Abilita le Built-In Variables

1. Vai in **Variables** → sezione **Built-In Variables** → clicca **Configure**
2. Assicurati che siano abilitate:
   - [x] Page URL
   - [x] Page Hostname
   - [x] Page Path
   - [x] Referrer
   - [x] Click URL
   - [x] Click Text
   - [x] Click Classes
   - [x] Click ID
   - [x] Form ID
   - [x] Scroll Depth Threshold
   - [x] Scroll Depth Units
   - [x] Debug Mode

---

## PARTE 2: Test con GTM Preview (10 minuti)

### Step 2.1 — Attiva Preview Mode

1. In GTM, clicca il pulsante **Preview** (in alto a destra)
2. Si apre Tag Assistant: inserisci l'URL `https://bio-clinic.online`
3. Clicca **Connect**
4. Si apre il sito in una nuova scheda con il debugger attivo

### Step 2.2 — Verifica gli eventi

Nella finestra di Tag Assistant, dovresti vedere:

**Al caricamento della pagina:**
- ✅ `Consent Initialization` — consent defaults (tutto "denied")
- ✅ `Container Loaded` — GTM caricato
- ✅ `bc_page_context` — con tutti i parametri (page_type, specialty, etc.)
- ✅ `tag_GA4_Configuration` fired

**Azioni da testare:**

| Azione sul sito | Evento atteso in Tag Assistant |
|---|---|
| Clicca un numero di telefono | `bc_phone_click` |
| Clicca un link WhatsApp | `bc_whatsapp_click` |
| Clicca un pulsante "Prenota" | `bc_prenota_click` |
| Scrolla fino al 75% | `bc_deep_engagement` (scroll_75) |
| Aspetta 60 secondi sulla pagina | `bc_deep_engagement` (time_on_page_60s) |
| Visualizza una sezione prezzi | `bc_price_interest` |
| Accetta i cookie nel banner | `bc_consent_update` |

### Step 2.3 — Verifica i parametri

Per ogni evento, clicca sull'evento in Tag Assistant e verifica che i parametri contengano:
- `bc_specialty` → il valore corretto per la pagina (es. "cardiologia")
- `bc_service_name` → il servizio (es. "ecocardiogramma")
- `bc_physician_name` → il medico associato
- `bc_device_type` → mobile/tablet/desktop

### Step 2.4 — Testa la pagina di debug

Aggiungi `?cge_debug=1` all'URL del sito:
```
https://bio-clinic.online/?cge_debug=1
```
Apri la Console del browser (F12 → Console). Vedrai log verdi con `[CGE]` per ogni evento.

### Step 2.5 — Pubblica il container

Quando sei soddisfatto dei test:
1. Torna su GTM
2. Clicca **Submit** (in alto a destra)
3. **Version Name:** `CGE_v2.1_foundation`
4. **Version Description:** `Clinical Growth Engine v2.1 - Full tracking infrastructure con generate_lead, purchase, consent-gated user_id`
5. Clicca **Publish**

---

## PARTE 3: Configurazione GA4 (20 minuti)

### Step 3.1 — Accedi a GA4

1. Vai su **https://analytics.google.com**
2. Seleziona la proprietà **Bio-Clinic** (G-9EXCL016VJ)

### Step 3.2 — Registra le Custom Dimensions (12 totali)

1. Vai in **Admin** (ingranaggio in basso a sinistra)
2. Nella colonna "Property", clicca **Custom definitions**
3. Clicca **Create custom dimension**
4. Per ognuna delle seguenti, compila e salva:

| # | Dimension name | Scope | Event parameter |
|---|---|---|---|
| 1 | Page Type | Event | `bc_page_type` |
| 2 | Specialty | Event | `bc_specialty` |
| 3 | Service Name | Event | `bc_service_name` |
| 4 | Physician Name | Event | `bc_physician_name` |
| 5 | Price Range | Event | `bc_price_range` |
| 6 | Content Group | Event | `bc_content_group` |
| 7 | Funnel Stage | Event | `bc_funnel_stage` |
| 8 | Lead Type | Event | `bc_lead_type` |
| 9 | Click Location | Event | `bc_click_location` |
| 10 | Engagement Type | Event | `bc_engagement_type` |
| 11 | Device Type | Event | `bc_device_type` |
| 12 | Form ID | Event | `bc_form_id` |

**Come compilare ogni dimensione:**
1. Clicca **Create custom dimension**
2. **Dimension name:** copia il nome dalla colonna "Dimension name"
3. **Scope:** seleziona `Event`
4. **Description:** lascia vuoto o scrivi una breve descrizione
5. **Event parameter:** copia il valore dalla colonna "Event parameter"
6. Clicca **Save**
7. Ripeti per tutte e 12

### Step 3.3 — Contrassegna i Key Events

1. In GA4, vai in **Admin** → **Events**
2. Aspetta che gli eventi compaiano (possono servire 24-48h dopo il primo traffico)
3. Quando appaiono, contrassegna come **Key Event** (toggle ON):

| Evento | Contrassegnare? | Motivo |
|---|---|---|
| `bc_lead_generated` | ✅ **SÌ** | Conversione primaria — lead confermato da API |
| `generate_lead` | ✅ **SÌ** | Google Ads Smart Bidding tCPA |
| `bc_phone_click` | ✅ **SÌ** | Chiamata = lead diretto |
| `bc_whatsapp_click` | ✅ **SÌ** | WhatsApp = lead diretto |
| `bc_booking_confirmed` | ✅ **SÌ** | Revenue (quando disponibile) |
| `purchase` | ✅ **SÌ** | Google Ads Smart Bidding tROAS (quando disponibile) |
| `bc_form_submit` | ❌ **NO** | Solo micro-conversione (intenzione, non conferma) |
| `bc_prenota_click` | ❌ **NO** | Solo micro-conversione (click, non submission) |
| `bc_deep_engagement` | ❌ **NO** | Segnale di qualità, non conversione |
| `bc_price_interest` | ❌ **NO** | Segnale di interesse, non conversione |

> ⚠️ **IMPORTANTE:** NON contrassegnare `bc_form_submit` come Key Event. È un'intenzione, non una conferma. Se lo contrassegni, Google Ads conterà ogni tentativo di submit (anche quelli falliti) come conversione, gonfiando i numeri e rovinando lo Smart Bidding.

### Step 3.4 — Attiva Google Signals

1. Vai in **Admin** → **Data Settings** → **Data Collection**
2. Attiva **Google signals data collection**
3. Questo consente il cross-device tracking e le audience demographics

### Step 3.5 — Imposta Data Retention

1. Vai in **Admin** → **Data Settings** → **Data Retention**
2. Imposta **Event data retention** su **14 months** (il massimo)
3. Attiva **Reset user data on new activity**

---

## PARTE 4: Collegare GA4 a Google Ads (5 minuti, opzionale ora)

Se hai un account Google Ads attivo:

### Step 4.1 — Link GA4 ↔ Google Ads

1. In GA4, vai in **Admin** → **Product links** → **Google Ads links**
2. Clicca **Link**
3. Seleziona il tuo account Google Ads
4. Attiva:
   - [x] Enable Personalized Advertising
   - [x] Enable Auto-tagging
5. Clicca **Submit**

### Step 4.2 — Importa le conversioni in Google Ads

1. In Google Ads, vai in **Tools** → **Conversions** → **Import**
2. Seleziona **Google Analytics 4 properties**
3. Importa:
   - `generate_lead` (con valore in EUR)
   - `bc_phone_click`
   - `bc_whatsapp_click`
4. **NON importare** `bc_form_submit`

---

## PARTE 5: Checklist Finale

### Dopo aver completato tutti gli step:

- [ ] GTM container importato con 25 variabili, 16 trigger, 12 tag
- [ ] Built-in variables abilitate
- [ ] Preview Mode testato: eventi visibili in Tag Assistant
- [ ] Container pubblicato come versione `CGE_v2.1_foundation`
- [ ] 12 custom dimensions registrate in GA4
- [ ] Key Events contrassegnati: `bc_lead_generated`, `generate_lead`, `bc_phone_click`, `bc_whatsapp_click`
- [ ] `bc_form_submit` e `bc_prenota_click` NON contrassegnati come Key Event
- [ ] Google Signals attivato
- [ ] Data Retention impostato a 14 mesi
- [ ] (Opzionale) GA4 collegato a Google Ads
- [ ] (Opzionale) Conversioni importate in Google Ads

### Verifica dopo 24-48 ore:

1. Vai in GA4 → **Reports** → **Realtime**
2. Dovresti vedere:
   - Utenti attivi
   - Eventi `bc_page_context` per ogni pagina visitata
   - Custom dimensions popolate (specialty, service_name, etc.)
3. Vai in GA4 → **Reports** → **Engagement** → **Events**
4. Verifica che tutti gli eventi `bc_*` compaiano con conteggi > 0

### Test veloce con ?cge_debug=1:

```
https://bio-clinic.online/cardiologia/ecocardiogramma/?cge_debug=1
```

Apri Console (F12) e vedrai:
```
[CGE] Clinical Growth Engine v2.1 initialized
[CGE] Context: {page_type: "service", specialty: "cardiologia", service_name: "ecocardiogramma", ...}
[CGE] User ID: bc_anon_xxxxx (session-only, no consent)
[CGE] Lead value for current page: 130 EUR
```

---

## Problemi Comuni

### "Non vedo eventi in GA4 Realtime"
- Verifica che il container GTM sia **pubblicato** (non solo salvato)
- Verifica che il Measurement ID sia `G-9EXCL016VJ` nel tag GA4 Configuration
- Prova ad accettare i cookie nel banner Iubenda (senza consenso, GA4 riceve solo ping cookieless)

### "Il banner cookie non appare"
- Verifica che nella sorgente HTML ci sia `siteId: "3313232"` e `cookiePolicyId: "85172996"`
- Prova in modalità incognito (il banner non appare se hai già accettato)

### "Gli eventi non hanno i parametri bc_specialty, etc."
- Verifica che il bcDataLayer sia presente nella sorgente HTML della pagina
- Cerca `window.bcDataLayer` nel codice sorgente (View Source)

### "generate_lead non appare in GA4"
- Questo evento si attiva solo quando un form viene inviato con successo
- Testa compilando un form sul sito (il form invia a /api/contact)
- Se /api/contact non è configurato, vedrai `bc_form_error` invece di `generate_lead`

---

*Guida creata il 2026-02-16 per Bio-Clinic CGE v2.1*
