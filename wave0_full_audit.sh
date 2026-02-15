#!/bin/bash
# WAVE 0 - FULL URL AUDIT
# Tests HTTP status, redirect destination, and canonical tag for every URL

DOMAIN="https://bio-clinic.it"
OUTPUT="wave0_audit_results.csv"

echo "url,http_status,redirect_location,canonical_tag,content_length,category" > "$OUTPUT"

audit_url() {
    local url="$1"
    local category="$2"
    
    # Get HTTP status and Location header
    local headers=$(curl -sI -o /dev/null -w "%{http_code}|%{redirect_url}|%{size_download}" -L --max-redirs 0 "$url" 2>/dev/null)
    local status=$(echo "$headers" | cut -d'|' -f1)
    local redirect=$(curl -sI "$url" 2>/dev/null | grep -i "^location:" | head -1 | sed 's/location: //i' | tr -d '\r\n')
    
    # Get canonical tag (only for 200 responses)
    local canonical=""
    local content_length="0"
    if [[ "$status" == "200" ]]; then
        local body=$(curl -sL "$url" 2>/dev/null)
        canonical=$(echo "$body" | grep -oP 'rel="canonical"\s+href="[^"]*"' | grep -oP 'href="[^"]*"' | tr -d '"' | sed 's/href=//')
        if [[ -z "$canonical" ]]; then
            canonical=$(echo "$body" | grep -oP 'href="[^"]*"\s+rel="canonical"' | grep -oP 'href="[^"]*"' | tr -d '"' | sed 's/href=//')
        fi
        content_length=$(echo -n "$body" | wc -c)
    fi
    
    # Clean redirect for CSV
    redirect=$(echo "$redirect" | tr ',' ';')
    canonical=$(echo "$canonical" | tr ',' ';')
    
    echo "\"$url\",$status,\"$redirect\",\"$canonical\",$content_length,$category" >> "$OUTPUT"
    echo "$status | $category | $url → $redirect"
}

echo "=== AUDITING SITEMAP URLs (160) ==="
while IFS= read -r url; do
    # Categorize
    if echo "$url" | grep -q "/cardiologia/"; then
        cat="hierarchical-cardio"
    elif echo "$url" | grep -q "/laboratorio/"; then
        cat="hierarchical-lab"
    elif echo "$url" | grep -q "/equipe/"; then
        cat="equipe"
    elif echo "$url" | grep -qE "^https://bio-clinic.it/visita-"; then
        cat="root-service"
    elif echo "$url" | grep -qE "^https://bio-clinic.it/(cardiologia|ginecologia|dermatologia|endocrinologia|neurologia|ortopedia|pma-fertilita|slim-care|laboratorio|urologia|oculistica|otorinolaringoiatria|gastroenterologia|pneumologia|reumatologia|ematologia|chirurgia-vascolare)/$"; then
        cat="hub"
    else
        cat="root-other"
    fi
    audit_url "$url" "$cat"
done < sitemap_urls_all.txt

echo ""
echo "=== AUDITING /pages/ URLs (known legacy) ==="
PAGES_URLS=(
    "/pages/visita-cardiologica-ecg"
    "/pages/visita-ginecologica"
    "/pages/visita-dermatologica"
    "/pages/visita-endocrinologica"
    "/pages/visita-neurologica"
    "/pages/visita-ortopedica"
    "/pages/visita-urologica"
    "/pages/visita-oculistica"
    "/pages/visita-gastroenterologica"
    "/pages/visita-pneumologica"
    "/pages/visita-reumatologica"
    "/pages/visita-ematologica"
    "/pages/visita-fisiatrica"
    "/pages/visita-pediatrica"
    "/pages/visita-nefrologica"
    "/pages/visita-chirurgia-vascolare"
    "/pages/visita-internistica"
    "/pages/visita-medicina-lavoro"
    "/pages/visita-medicina-sport"
    "/pages/visita-nutrizionale"
    "/pages/colloquio-psicologico"
    "/pages/ginecologi-sassari"
    "/pages/hpv-test"
    "/pages/hpv-dna-test"
    "/pages/pap-test"
    "/pages/duopap"
    "/pages/genetica"
    "/pages/isterosalpingografia"
    "/pages/isteroscopia"
    "/pages/mappatura-nevi"
    "/pages/dermatoscopia-digitale"
    "/pages/agoaspirato-tiroide"
    "/pages/checkup-tiroide"
    "/pages/colposcopia"
    "/pages/screening-inps-sardegna"
    "/pages/symptom-checker"
    "/pages/caressflow"
    "/pages/perifit-kegel-sassari"
    "/pages/radiofrequenza-vaginale"
    "/pages/riabilitazione-pavimento-pelvico"
    "/pages/trattamenti-pavimento-pelvico"
    "/pages/rinofibrolaringoscopia"
    "/pages/ecografia-mammaria"
    "/pages/ecografia-tiroidea"
    "/pages/ecografia-transvaginale"
    "/pages/ecografia-ginecologica"
    "/pages/ecografia-pelvica"
    "/pages/ecografia-prostatica"
    "/pages/ecografia-renale"
    "/pages/ecografia-addominale"
    "/pages/ecografia-ostetrica-3d"
    "/pages/ecografia-morfologica"
    "/pages/ecg"
    "/pages/eco-doppler-arti"
    "/pages/elettromiografia"
    "/pages/translucenza-nucale"
    "/pages/infiltrazioni-articolari"
    "/pages/scleroterapia"
    "/pages/spirometria"
    "/pages/audiometria"
    "/pages/impedenzometria"
    "/pages/campo-visivo"
    "/pages/monitoraggio-follicolare"
    "/pages/consulto-pma"
    "/pages/assistenza-ostetrica"
    "/pages/chirurgia-ginecologica"
    "/pages/corso-preparto"
    "/pages/cardiologia"
    "/pages/ginecologia"
    "/pages/ginecologia.html"
    "/pages/dermatologia"
    "/pages/dermatologia.html"
    "/pages/endocrinologia"
    "/pages/neurologia"
    "/pages/ortopedia"
    "/pages/slim-care"
    "/pages/pma-fertilita"
    "/pages/specialita"
    "/pages/specialita.html"
    "/pages/convenzioni"
    "/pages/gastroenterologia"
    "/pages/ecocardiogramma"
    "/pages/ecocardiogramma.html"
    "/pages/holter-ecg"
    "/pages/holter-pressorio"
    "/pages/checkup-cardiovascolare"
    "/pages/preparazione-esami"
    "/pages/listino-completo"
    "/pages/laboratorio"
    "/pages/medicina-del-lavoro"
    "/pages/visita-orl"
)

for path in "${PAGES_URLS[@]}"; do
    audit_url "${DOMAIN}${path}" "pages-legacy"
done

echo ""
echo "=== AUDIT COMPLETE ==="
wc -l "$OUTPUT"
