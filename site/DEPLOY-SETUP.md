# Bio-Clinic Cloudflare Pages Deploy Setup

## Configurazione GitHub Secrets

Per abilitare il deploy automatico su Cloudflare Pages, devi aggiungere 2 secrets nel repository GitHub.

### Passo 1: Crea un API Token su Cloudflare

1. Vai su [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Clicca sull'icona del profilo (in alto a destra) → **My Profile**
3. Nel menu laterale, clicca su **API Tokens**
4. Clicca **Create Token**
5. Seleziona **Create Custom Token**
6. Configura il token:
   - **Token name**: `Bio-Clinic GitHub Actions Deploy`
   - **Permissions**:
     - `Account` → `Cloudflare Pages` → `Edit`
     - `Account` → `Account Settings` → `Read`
   - **Account Resources**: Include → `Seleziona il tuo account`
7. Clicca **Continue to summary** → **Create Token**
8. **COPIA IL TOKEN** (non sarà più visibile dopo)

### Passo 2: Trova il tuo Account ID

1. Vai su [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Nella homepage, guarda l'URL: `https://dash.cloudflare.com/XXXXXXXXXX`
3. Il codice alfanumerico (`XXXXXXXXXX`) è il tuo **Account ID**
4. Oppure: clicca su **Workers & Pages** → il tuo Account ID è visibile nella sidebar

### Passo 3: Aggiungi i Secrets su GitHub

1. Vai al repository: [github.com/biopharma-italia/EXTREME-BIO](https://github.com/biopharma-italia/EXTREME-BIO)
2. Clicca su **Settings** (icona ingranaggio)
3. Nel menu laterale: **Secrets and variables** → **Actions**
4. Clicca **New repository secret**
5. Aggiungi i seguenti secrets:

| Nome Secret | Valore |
|-------------|--------|
| `CLOUDFLARE_API_TOKEN` | Il token API creato al Passo 1 |
| `CLOUDFLARE_ACCOUNT_ID` | L'Account ID trovato al Passo 2 |

### Passo 4: Trigger del Deploy

Una volta aggiunti i secrets, il deploy automatico funzionerà:

- **Automaticamente**: ad ogni push su `main` che modifica file in `site/`
- **Manualmente**: vai su **Actions** → **Build & Deploy Bio-Clinic** → **Run workflow**

## Verifica Deploy

Dopo un push, vai su:
- **GitHub**: Repository → Actions → Ultimo workflow
- **Cloudflare**: Dashboard → Workers & Pages → `project-9c397b80`

URL di produzione: **https://bio-clinic.pages.dev**

## Troubleshooting

### "Error: Authentication failed"
- Verifica che `CLOUDFLARE_API_TOKEN` sia corretto
- Verifica che il token abbia i permessi `Cloudflare Pages: Edit`

### "Error: Project not found"
- Verifica che `CLOUDFLARE_ACCOUNT_ID` sia corretto
- Verifica che il progetto `project-9c397b80` esista nel tuo account

### Deploy skipped
- Il deploy avviene solo su push a `main`
- Verifica che i file modificati siano in uno dei path monitorati:
  - `site/js/**`
  - `site/css/**`
  - `site/index.html`
  - `site/pages/**`
  - `site/equipe/**`
  - `site/laboratorio/**`
  - `site/data/**`
  - `site/build/**`
  - `site/templates/**`
  - `site/images/**`

## Configurazione Attuale

```yaml
Project Name: bio-clinic
Account ID: e40ec532ef28e0718e095d21bf508847
Branch: main
Directory: site/
Production URL: https://bio-clinic.pages.dev
Custom Domains: bio-clinic.online, www.bio-clinic.online
```

## Riferimenti

- [Cloudflare Wrangler Action](https://github.com/cloudflare/wrangler-action)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
