# HEADER LAYOUT RULES - Bio-Clinic
## Guida Definitiva per Layout Fisso dell'Header

**Versione:** 3.0  
**Ultimo Aggiornamento:** 2026-01-28  
**Stato:** BARRA SUPERIORE (header-top) RIMOSSA - Layout Semplificato

---

## 1. Struttura Header Attuale

Il layout dell'header è ora semplificato con la **rimozione completa della barra superiore** (`header-top`):

```
┌─────────────────────────────────────────────┐
│           HEADER PRINCIPALE                  │  ~70px
│  [Logo]     [Menu Navigazione]     [CTA]    │
├─────────────────────────────────────────────┤
│                                              │  100px padding-top body
│           CONTENUTO PAGINA                   │
│           (Trust Bar, etc.)                  │
└─────────────────────────────────────────────┘
```

### Misure CSS Definitive

| Elemento | Altezza | Note |
|----------|---------|------|
| `header` (fisso) | ~70px | `position: fixed; top: 0;` |
| `body padding-top` | 100px | Compensa header fisso |
| `.trust-bar margin-top` | 15px | Separa visivamente dal menu |
| **Spazio totale header-contenuto** | ~115px | 100px + 15px |

---

## 2. File CSS Coinvolti

### 2.1 header-spacing-fix.css (CRITICO)

```css
/* BIO-CLINIC - HEADER SPACING FIX v3.0 */
/* Layout semplificato SENZA header-top */

body {
  margin: 0 !important;
  padding-top: 100px !important;
}

.header {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
  background: white !important;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
}

.trust-bar {
  margin-top: 15px !important;
  padding-top: 1.5rem !important;
}
```

### 2.2 CSS Inline Critico (in ogni pagina)

Ogni pagina HTML deve includere nel `<head>`:

```html
<style>
/* CRITICAL FIX - Layout Header Semplificato */
body {
  padding-top: 100px !important;
  margin: 0 !important;
}
.header {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
  background: white !important;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
}
.trust-bar {
  margin-top: 15px !important;
  padding-top: 1.5rem !important;
}
</style>
```

---

## 3. Come Includere il Fix nelle Nuove Pagine

### 3.1 Metodo 1: CSS Esterno + Inline (RACCOMANDATO)

```html
<head>
  <!-- Altri meta e CSS -->
  
  <!-- CSS Fix Header -->
  <link rel="stylesheet" href="../css/header-spacing-fix.css?v=TIMESTAMP">
  
  <!-- CSS Inline Critico (fallback) -->
  <style>
  /* CRITICAL FIX - Layout Header Semplificato */
  body { padding-top: 100px !important; margin: 0 !important; }
  .header { position: fixed !important; top: 0 !important; left: 0; right: 0; z-index: 1000 !important; background: white !important; box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important; }
  .trust-bar { margin-top: 15px !important; padding-top: 1.5rem !important; }
  </style>
</head>
```

### 3.2 Verifica Cache-Busting

Sempre usare un parametro di versione per i CSS:
```html
<link rel="stylesheet" href="css/header-spacing-fix.css?v=1769644001">
```

---

## 4. Elementi Rimossi (NON più usare)

### 4.1 Header-top (ELIMINATO)

La barra superiore `header-top` è stata rimossa. **NON aggiungere** mai:

```html
<!-- VECCHIO - NON USARE -->
<div class="header-top">
  <span>079 956 1332</span>
</div>
```

### 4.2 CSS da NON usare

```css
/* DEPRECATO - Non usare */
.header-top { ... }
body { padding-top: 120px; } /* Era per header-top + header */
```

---

## 5. Struttura HTML Corretta

### Template Header Pagina Specialità

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Specialità Sassari | N Specialisti | Bio-Clinic</title>
  
  <!-- CSS -->
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/header-spacing-fix.css?v=TIMESTAMP">
  
  <!-- CSS Inline Critico -->
  <style>
  body { padding-top: 100px !important; margin: 0 !important; }
  .header { position: fixed !important; top: 0 !important; z-index: 1000 !important; }
  .trust-bar { margin-top: 15px !important; }
  </style>
</head>
<body>
  <!-- Header (incluso da template) -->
  <header class="header">
    <!-- Menu navigazione -->
  </header>
  
  <!-- Contenuto con Trust Bar -->
  <section class="trust-bar">
    <!-- Info specialità -->
  </section>
  
  <!-- Resto contenuto -->
</body>
</html>
```

---

## 6. Checklist Verifica Layout

Prima di pubblicare una pagina, verificare:

- [ ] CSS inline critico presente nel `<head>`
- [ ] `header-spacing-fix.css` linkato con `?v=TIMESTAMP`
- [ ] **NESSUN** `header-top` nel markup
- [ ] `body` ha `padding-top: 100px`
- [ ] `.header` ha `position: fixed`
- [ ] `.trust-bar` ha `margin-top: 15px`
- [ ] Test visivo: nessuna sovrapposizione header/contenuto
- [ ] Test scroll: header rimane fisso in alto

---

## 7. Troubleshooting

### Problema: Header copre il contenuto
**Soluzione:** Verificare `body { padding-top: 100px !important; }`

### Problema: Spazio eccessivo tra header e contenuto
**Soluzione:** Controllare che non ci sia CSS duplicato, verificare `margin-top` del primo elemento

### Problema: Stili non applicati
**Soluzione:** Usare cache-busting `?v=TIMESTAMP` e hard refresh (`Ctrl+Shift+R`)

### Problema: Vecchio header-top appare
**Soluzione:** Cercare e rimuovere qualsiasi `<div class="header-top">` e relativi CSS

---

## 8. Stato Attuale

| Metrica | Valore |
|---------|--------|
| Pagine HTML totali | 84 |
| Pagine con fix CSS | 82 |
| Header-top rimossi | 100% |
| CSS inline critico | 82 pagine |
| File CSS fix | `header-spacing-fix.css` (1.1K) |

---

## 9. Contatti

Per modifiche al layout header, contattare il team di sviluppo prima di procedere.

**File principale:** `css/header-spacing-fix.css`  
**Pagine template:** `templates/master-header.html`

---

*Documento generato automaticamente - Bio-Clinic 2026*
