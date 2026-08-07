#!/usr/bin/env bash
# ============================================================================
# 016: Provisioning Auth Users — Biologa Laboratorio + Tecnico Laboratorio
# Date: 2026-08-07
# ============================================================================
# USAGE:
#   export SUPABASE_URL="https://mdxqgzkxrcrotxxbhoai.supabase.co"
#   export SUPABASE_SERVICE_KEY="eyJ..."  # Service Role Key
#   bash 016_provision_auth_users.sh
#
# Questo script crea 3 utenti via Supabase Auth Admin API.
# Il trigger handle_new_user() creerà automaticamente i profili in public.users
# con il ruolo specificato in user_metadata.
#
# DOPO l'esecuzione, comunicare le credenziali agli utenti!
# ============================================================================

set -euo pipefail

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_KEY:-}" ]]; then
  echo "❌ Imposta SUPABASE_URL e SUPABASE_SERVICE_KEY prima di eseguire."
  exit 1
fi

API="${SUPABASE_URL}/auth/v1/admin/users"

create_user() {
  local email="$1"
  local password="$2"
  local first_name="$3"
  local last_name="$4"
  local role="$5"

  echo "👤 Creazione: $first_name $last_name ($email) — ruolo: $role"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${email}\",
      \"password\": \"${password}\",
      \"email_confirm\": true,
      \"user_metadata\": {
        \"first_name\": \"${first_name}\",
        \"last_name\": \"${last_name}\",
        \"role\": \"${role}\"
      }
    }")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    AUTH_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "N/A")
    echo "   ✅ Creato! auth_id=$AUTH_ID"
    echo "   📧 Email: $email"
    echo "   🔑 Password: $password"
  elif [[ "$HTTP_CODE" == "422" ]]; then
    echo "   ⚠️  Utente già esistente (email duplicata)"
    echo "   Body: $BODY"
  else
    echo "   ❌ Errore HTTP $HTTP_CODE"
    echo "   Body: $BODY"
  fi
  echo ""
}

echo "============================================"
echo "Bio-Clinic Referti — Provisioning Utenti"
echo "============================================"
echo ""

# ── 1. CINZIA GUARINO — Biologa Laboratorio ──────────────────────
create_user \
  "cinzia.guarino@bio-clinic.it" \
  "BioClinic2026!CG" \
  "Cinzia" \
  "Guarino" \
  "biologa_laboratorio"

# ── 2. SARA MELONI — Biologa Laboratorio ─────────────────────────
create_user \
  "sara.meloni@bio-clinic.it" \
  "BioClinic2026!SM" \
  "Sara" \
  "Meloni" \
  "biologa_laboratorio"

# ── 3. GABRIELE DELOGU — Tecnico di Laboratorio ─────────────────
create_user \
  "gabriele.delogu@bio-clinic.it" \
  "BioClinic2026!GD" \
  "Gabriele" \
  "Delogu" \
  "tecnico_laboratorio"

echo "============================================"
echo "Provisioning completato!"
echo "============================================"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  1. Comunicare le credenziali agli utenti"
echo "  2. Chiedere agli utenti di cambiare la password al primo accesso"
echo "  3. Verificare che i profili siano stati creati in public.users"
echo "     con il ruolo corretto (il trigger handle_new_user() lo fa automaticamente)"
echo ""
echo "Per verificare:"
echo "  SELECT id, email, first_name, last_name, role, is_active"
echo "  FROM public.users"
echo "  WHERE role IN ('biologa_laboratorio', 'tecnico_laboratorio')"
echo "  ORDER BY last_name;"
