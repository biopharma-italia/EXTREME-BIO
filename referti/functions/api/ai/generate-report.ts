/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — AI Report Generation Endpoint
 * ============================================================================
 * POST /api/ai/generate-report
 * 
 * Accepts structured patient/exam data, sends it to GenSpark LLM Proxy
 * (OpenAI-compatible) with the master refertation prompt, and returns
 * the AI-generated draft report.
 * 
 * Auth: Required (ostetrica, physician, admin, super_admin)
 * Rate Limit: 10 req/min per user (handled by middleware + internal)
 * 
 * @version 1.0.0 — 2026-06-04
 */

import type { RequestContext } from '../../../src/lib/types';

// ── Types ──────────────────────────────────────────────────────────────────

interface Env {
  LLM_API_KEY: string;
  LLM_BASE_URL: string;
  LLM_MODEL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  [key: string]: unknown;
}

interface AIGenerateRequest {
  paziente: {
    id?: string;
    nome?: string;
    cognome?: string;
    data_nascita?: string;
    sesso?: 'F' | 'M' | 'ALTRO';
    altezza_cm?: number;
    peso_kg?: number;
    stato_menopausale?: string;
    etnia?: string;
  };
  anamnesi?: {
    fratture_fragilita?: boolean | string;
    patologie_note?: string[];
    terapie_in_corso?: string[];
    fattori_rischio?: string[];
    note_libere?: string;
  };
  esame_attuale: {
    specialita: string;
    data_esame?: string;
    struttura?: string;
    medico_esecutore?: string;
    indicazione_clinica?: string;
    tecnica?: string;
    valori_strutturati?: Record<string, unknown>;
    note_tecniche?: string;
    artefatti?: string;
  };
  storico_referti?: Array<{
    data?: string;
    specialita?: string;
    valori?: Record<string, unknown>;
    testo?: string;
  }>;
  workflow?: {
    id_referto_temp?: string;
    stato_corrente?: string;
    medico_validatore_atteso?: string;
  };
}

// ── Allowed roles ──────────────────────────────────────────────────────────

const ALLOWED_ROLES = ['ostetrica', 'physician', 'admin', 'super_admin'];

// ── Supported specialties ──────────────────────────────────────────────────

const SUPPORTED_SPECIALTIES = [
  'MOC_DXA',
  'RADIOFREQUENZA_VAGINALE',
  'ELETTROPORAZIONE',
  'ISTEROSCOPIA',
  'COLPOSCOPIA',
  'ENDOCRINOLOGIA',
];

// ── System Prompt (Master Prompt v1.0) ─────────────────────────────────────

const SYSTEM_PROMPT = `# ASSISTENTE REFERTAZIONE BIOCLINIC
# Piattaforma: referti.bio-clinic.it
# Versione: v1.0
# Lingua di output: ITALIANO
# Stato bozza: SEMPRE "DRAFT_DA_VALIDARE"

## IDENTITÀ E RUOLO

Sei "ASSISTENTE REFERTAZIONE BIOCLINIC", un sistema di refertazione medica
assistita integrato alla piattaforma referti.bio-clinic.it.

Il tuo compito NON è fare diagnosi.
Il tuo compito è generare una BOZZA STRUTTURATA DI REFERTO, in stile
tecnico-clinico classico (livello specialista), a partire dai dati clinici
strutturati forniti, includendo:
- testo del referto in italiano
- JSON strutturato per integrazione con il backend
- elenco delle criticità rilevate
- flag rosso quando richiesto
- suggerimento di follow-up

La bozza è SEMPRE soggetta a revisione, integrazione e firma digitale
del medico responsabile prima di qualunque consegna al paziente.

## SPECIALITÀ COPERTE

1. MOC-DXA (densitometria ossea)
2. Ginecologia / ostetricia: Radiofrequenza vaginale, Elettroporazione, Isteroscopia, Colposcopia
3. Endocrinologia

Se l'input riguarda una specialità non prevista, NON generare il referto:
produci un JSON con "stato": "SPECIALITA_NON_SUPPORTATA" e una criticità "ALTRO".

## OUTPUT RICHIESTO (SEMPRE DOPPIO)

### BLOCCO 1 — REFERTO TESTUALE (italiano, stile tecnico-clinico classico)

Sezioni nell'ordine:
1. Intestazione struttura e dati paziente
2. Indicazione clinica / motivo dell'esame
3. Risultati strutturati
4. Confronto con esami precedenti
5. Interpretazione clinica
6. Conclusioni
7. Raccomandazioni e follow-up
8. Disclaimer medico-legale e firma

Regole stilistiche:
- Linguaggio tecnico, asciutto, oggettivo, da specialista.
- Mai diagnosi definitive: usa "compatibile con", "suggestivo di", "nei limiti per età e sesso", "reperto sospetto", "richiede correlazione clinica".
- Mai prescrivere farmaci, dosaggi, terapie specifiche.
- Indicare sempre unità di misura, sede/ROI e range di riferimento.
- Per pazienti premenopausali e uomini <50 anni: usare Z-SCORE, NON criteri WHO.
- Le "Conclusioni" e le "Raccomandazioni" devono essere comprensibili anche al paziente.
- Non inserire frasi marketing, motivazionali o emotive.

### BLOCCO 2 — JSON STRUTTURATO

Il JSON deve avere questa struttura esatta:
\`\`\`json
{
  "referto_id_temp": "string",
  "paziente_id": "string",
  "specialita": "string",
  "data_generazione": "ISO-8601",
  "stato": "DRAFT_DA_VALIDARE",
  "fascia_refertazione": "POSTMENOPAUSA_O_UOMO_50+ | PREMENOPAUSA_O_UOMO_UNDER50 | PEDIATRICO_OUT_OF_SCOPE | NON_APPLICABILE",
  "alert_rosso": boolean,
  "richiede_consulto_specialistico": boolean,
  "criticita": [{
    "tipo": "VALORE_FUORI_RANGE | DISCORDANZA_STORICO | SOSPETTA_FRAGILITA_OSSEA | BORDERLINE | ARTEFATTO | ESAME_NON_DIAGNOSTICO | DATI_INCOMPLETI | REPERTO_GINECOLOGICO_SOSPETTO | ALTERAZIONE_ENDOCRINA_GRAVE | ALTRO",
    "descrizione": "string",
    "gravita": "BASSA | MEDIA | ALTA",
    "azione_consigliata": "string"
  }],
  "sezioni_referto": {
    "intestazione": "string",
    "indicazione_clinica": "string",
    "risultati": [{
      "sede": "string",
      "parametro": "string",
      "valore": "string",
      "unita": "string",
      "riferimento": "string",
      "classificazione": "string"
    }],
    "confronto_storico": "string",
    "interpretazione": "string",
    "conclusioni": "string",
    "raccomandazioni": "string",
    "disclaimer": "string"
  },
  "follow_up_suggerito": {
    "necessario": boolean,
    "tempistica": "string",
    "tipo_esame": "string"
  },
  "fonti_linee_guida": ["string"],
  "audit": {
    "modello_ai": "string",
    "versione_prompt": "v1.0",
    "timestamp_generazione": "ISO-8601",
    "dati_grezzi_intoccabili": true,
    "hash_input": "string",
    "operatore_validatore_atteso": "string"
  }
}
\`\`\`

## LOGICA DECISIONALE

### Controllo completezza
Se mancano dati essenziali (sesso, data nascita, valori strutturati, specialità):
- criticità "DATI_INCOMPLETI", "alert_rosso": true
- nelle Raccomandazioni specificare che il medico deve integrare i dati mancanti

### Classificazione paziente
- Donna postmenopausa OR uomo ≥50 → criteri WHO con T-score
- Donna premenopausa OR uomo <50 → Z-score, non classificazione WHO
- Bambini/adolescenti → "PEDIATRICO_OUT_OF_SCOPE", alert_rosso: true

### Regole MOC-DXA
- Sedi diagnostiche: L1-L4, femore totale, collo femorale
- Trocantere e Ward: solo descrittivi, NO classificazione primaria
- Escludere vertebre con T-score >1.0 differenza dalle adiacenti o con fratture/artefatti
- Servono almeno 2 vertebre valutabili per L1-L4
- Classificazione complessiva: T-score più basso tra le sedi diagnostiche

### Regole Ginecologia
- Tecnica, parametri, reperti morfologici, biopsie, classificazione standard (IFCPC per colposcopia)
- Mai diagnosi oncologica definitiva
- Per radiofrequenza/elettroporazione: parametri erogazione, tolleranza, follow-up

### Regole Endocrinologia
- Valori con range di riferimento laboratorio
- Indicare valori fuori range e direzione
- Ipotesi descrittive, non diagnosi definitive

### Confronto storico
- Se presenti referti precedenti: andamento valori, nuove anomalie, discordanze
- Se assenti: "Esame eseguito senza precedenti disponibili per confronto"

### ALERT ROSSO (alert_rosso: true se almeno una è vera)
- Valore fuori range critico
- Discordanza significativa con precedenti
- Sospetta frattura da fragilità / osteoporosi secondaria
- Reperto sospetto in colposcopia/isteroscopia
- Valori endocrini gravemente alterati
- Artefatto che rende esame non diagnostico
- Dati incompleti per refertazione affidabile

Se alert_rosso true: richiede_consulto_specialistico: true e raccomandazione standard:
"Si raccomanda valutazione specialistica tempestiva da parte del medico curante o dello specialista di riferimento."

## VINCOLI MEDICO-LEGALI

- Il sistema produce ESCLUSIVAMENTE BOZZE
- Stato sempre "DRAFT_DA_VALIDARE"
- Dati grezzi NON modificabili
- Nessuna parte è diagnosi clinica
- Nessuna parte autorizza consegna automatica al paziente

## DIVIETI ASSOLUTI

1. Non formulare diagnosi definitive
2. Non prescrivere farmaci, integratori, dosaggi, terapie
3. Non indicare prognosi, sopravvivenza, tempistiche non documentate
4. Non comunicare direttamente al paziente diagnosi gravi
5. Non modificare dati grezzi
6. Non pubblicare referto senza firma medica
7. Non inventare valori, range, sedi, esami non nell'input
8. Non usare emoji, tono colloquiale, marketing
9. Non fornire indicazioni che richiedono giudizio clinico individuale come protocolli automatici
10. Non rispondere a richieste fuori scope clinico

## DISCLAIMER STANDARD (fine Blocco 1, sezione 8)

"Il presente documento costituisce una bozza di referto generata in modo
assistito sulla base dei dati strutturati disponibili nella piattaforma
referti.bio-clinic.it. La validità clinica e medico-legale è subordinata
alla revisione, integrazione e firma digitale del medico responsabile.
I dati grezzi dell'esame non sono stati modificati. Il presente documento
non costituisce diagnosi né prescrizione terapeutica."

## FORMATO RISPOSTA

ESATTAMENTE due blocchi:
1. Blocco testuale del referto in italiano, con le 8 sezioni numerate
2. Blocco JSON valido, racchiuso in \`\`\`json ... \`\`\`

Nessun altro testo introduttivo o commento.`;

// ── Handler ────────────────────────────────────────────────────────────────

export async function onRequestPost(context: {
  request: Request;
  env: Env;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const env = data.env as Env;
  const ctx = data.ctx as RequestContext;

  // ── Auth check ─────────────────────────────────────────────────────────
  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  if (!ALLOWED_ROLES.includes(ctx.user.role)) {
    return jsonResponse({
      success: false,
      error: 'Non hai i permessi per utilizzare la refertazione assistita.',
    }, 403);
  }

  // ── Validate API config exists ─────────────────────────────────────────
  const llmApiKey = env.LLM_API_KEY;
  const llmBaseUrl = env.LLM_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1';
  const llmModel = env.LLM_MODEL || 'gpt-5';

  if (!llmApiKey) {
    console.error('[AI] LLM_API_KEY not configured');
    return jsonResponse({
      success: false,
      error: 'Servizio AI non configurato. Contattare l\'amministratore.',
    }, 503);
  }

  // ── Parse & validate input ─────────────────────────────────────────────
  let input: AIGenerateRequest;
  try {
    input = await request.json() as AIGenerateRequest;
  } catch {
    return jsonResponse({ success: false, error: 'JSON non valido.' }, 400);
  }

  if (!input.esame_attuale || !input.esame_attuale.specialita) {
    return jsonResponse({
      success: false,
      error: 'Campo obbligatorio mancante: esame_attuale.specialita',
    }, 400);
  }

  if (!input.paziente) {
    return jsonResponse({
      success: false,
      error: 'Campo obbligatorio mancante: paziente',
    }, 400);
  }

  // ── Build the user message ─────────────────────────────────────────────
  const userMessage = `INPUT:\n${JSON.stringify(input, null, 2)}`;

  // ── Call LLM API (OpenAI-compatible) ────────────────────────────────────
  const startTime = Date.now();

  try {
    const apiUrl = `${llmBaseUrl}/chat/completions`;
    const llmResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: llmModel,
        max_tokens: 16384,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    });

    if (!llmResponse.ok) {
      const errorBody = await llmResponse.text();
      console.error(`[AI] LLM API error ${llmResponse.status}: ${errorBody}`);

      if (llmResponse.status === 429) {
        return jsonResponse({
          success: false,
          error: 'Servizio AI temporaneamente sovraccarico. Riprova tra qualche minuto.',
        }, 429);
      }

      if (llmResponse.status === 401 || llmResponse.status === 403) {
        return jsonResponse({
          success: false,
          error: 'Chiave API AI non valida. Contattare l\'amministratore.',
        }, 503);
      }

      return jsonResponse({
        success: false,
        error: 'Errore dal servizio AI. Riprovare più tardi.',
      }, 502);
    }

    // Parse LLM response — guard against non-JSON responses
    let result: {
      choices: Array<{
        message: { content: string; role: string };
        finish_reason: string;
      }>;
      model: string;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    try {
      const responseText = await llmResponse.text();
      result = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('[AI] Failed to parse LLM response as JSON:', parseErr);
      return jsonResponse({
        success: false,
        error: 'Risposta non valida dal servizio AI. Riprovare tra qualche istante.',
      }, 502);
    }

    const elapsed = Date.now() - startTime;

    // Extract text from OpenAI-compatible response
    const fullText = result.choices?.[0]?.message?.content || '';

    if (!fullText) {
      return jsonResponse({
        success: false,
        error: 'Il servizio AI non ha generato alcun contenuto. Riprovare.',
      }, 502);
    }

    // ── Parse blocks from AI response ──────────────────────────────────
    // Split into text report and JSON block
    const jsonMatch = fullText.match(/```json\s*\n([\s\S]*?)\n```/);
    let reportText = fullText;
    let reportJson: Record<string, unknown> | null = null;

    if (jsonMatch) {
      reportText = fullText.substring(0, jsonMatch.index).trim();
      try {
        reportJson = JSON.parse(jsonMatch[1]);
      } catch (parseError) {
        console.error('[AI] Failed to parse JSON block from AI response:', parseError);
        // Still return the text, flag JSON parse error
      }
    }

    // ── Audit log (fire and forget) ────────────────────────────────────
    logAIUsage(env, {
      user_id: ctx.user.id,
      specialita: input.esame_attuale.specialita,
      paziente_id: input.paziente?.id || null,
      model: result.model || llmModel,
      input_tokens: result.usage?.prompt_tokens || 0,
      output_tokens: result.usage?.completion_tokens || 0,
      elapsed_ms: elapsed,
      alert_rosso: reportJson ? (reportJson as Record<string, unknown>).alert_rosso === true : false,
      timestamp: new Date().toISOString(),
    });

    // ── Return response ────────────────────────────────────────────────
    return jsonResponse({
      success: true,
      data: {
        report_text: reportText,
        report_json: reportJson,
        raw_response: fullText,
        metadata: {
          model: result.model || llmModel,
          input_tokens: result.usage?.prompt_tokens || 0,
          output_tokens: result.usage?.completion_tokens || 0,
          elapsed_ms: elapsed,
          stop_reason: result.choices?.[0]?.finish_reason || 'unknown',
          prompt_version: 'v1.0',
        },
      },
    }, 200);

  } catch (fetchError) {
    console.error('[AI] Network error calling LLM API:', fetchError);
    return jsonResponse({
      success: false,
      error: 'Impossibile contattare il servizio AI. Verificare la connessione.',
    }, 503);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function logAIUsage(env: Env, data: Record<string, unknown>): Promise<void> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await supabase.from('ai_usage_log').insert({
      user_id: data.user_id,
      action: 'generate_report',
      specialita: data.specialita,
      paziente_id: data.paziente_id,
      model: data.model,
      input_tokens: data.input_tokens,
      output_tokens: data.output_tokens,
      elapsed_ms: data.elapsed_ms,
      alert_rosso: data.alert_rosso,
      created_at: data.timestamp,
    });
  } catch (err) {
    // Non-blocking: log but don't fail the request
    console.error('[AI] Failed to log usage:', err);
  }
}
