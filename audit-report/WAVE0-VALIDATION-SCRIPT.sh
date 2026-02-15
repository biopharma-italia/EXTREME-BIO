#!/bin/bash
# ====================================================================
# WAVE 0+1 POST-DEPLOY VALIDATION SCRIPT
# Bio-Clinic infrastructure stabilization + Ginecologia cluster
# Run IMMEDIATELY after deploy to verify all redirects are correct
# ====================================================================

DOMAIN="https://bio-clinic.it"
PASS=0
FAIL=0
WARN=0

check() {
    local url="$1"
    local expected_status="$2"
    local expected_location="$3"
    local desc="$4"
    
    local actual_status=$(curl -sI -o /dev/null -w "%{http_code}" --max-redirs 0 "$url" 2>/dev/null)
    local actual_location=$(curl -sI "$url" 2>/dev/null | grep -i "^location:" | head -1 | sed 's/location: //i' | tr -d '\r\n')
    
    if [[ "$actual_status" == "$expected_status" ]]; then
        if [[ -n "$expected_location" && "$actual_location" != *"$expected_location"* ]]; then
            echo "FAIL | $url | Expected: $expected_status→$expected_location | Got: $actual_status→$actual_location | $desc"
            ((FAIL++))
        else
            echo "PASS | $url | $actual_status | $desc"
            ((PASS++))
        fi
    else
        echo "FAIL | $url | Expected: $expected_status | Got: $actual_status | $desc"
        ((FAIL++))
    fi
}

echo "============================================"
echo "WAVE 0+1 VALIDATION - $(date)"
echo "============================================"
echo ""

# TEST 1: All /pages/ URLs must return 301 (not 200!)
echo "=== TEST 1: /pages/ must be 301 ==="
PAGES_URLS=(
    "/pages/visita-cardiologica-ecg"
    "/pages/visita-ginecologica"
    "/pages/visita-dermatologica"
    "/pages/visita-endocrinologica"
    "/pages/visita-neurologica"
    "/pages/visita-ortopedica"
    "/pages/ginecologi-sassari"
    "/pages/hpv-test"
    "/pages/pap-test"
    "/pages/duopap"
    "/pages/genetica"
    "/pages/isterosalpingografia"
    "/pages/isteroscopia"
    "/pages/mappatura-nevi"
    "/pages/agoaspirato-tiroide"
    "/pages/colposcopia"
    "/pages/ecografia-mammaria"
    "/pages/ecografia-tiroidea"
    "/pages/ecografia-transvaginale"
    "/pages/elettromiografia"
    "/pages/ecg"
    "/pages/laboratorio"
    "/pages/preparazione-esami"
)
for path in "${PAGES_URLS[@]}"; do
    check "${DOMAIN}${path}" "301" "" "/pages/ should be 301"
done

echo ""
echo "=== TEST 2: Root specialist URLs must serve 200 directly ==="
ROOT_MUST_200=(
    "/visita-ortopedica/"
    "/visita-urologica/"
    "/visita-oculistica/"
    "/visita-orl/"
    "/visita-gastroenterologica/"
    "/visita-pneumologica/"
    "/visita-reumatologica/"
    "/visita-ematologica/"
    "/visita-fisiatrica/"
    "/visita-pediatrica/"
    "/mappatura-nevi/"
    "/ecografia-tiroidea/"
    "/elettromiografia/"
)
for path in "${ROOT_MUST_200[@]}"; do
    check "${DOMAIN}${path}" "200" "" "Root must serve 200 directly"
done

echo ""
echo "=== TEST 3: Wave 1 — Ginecologia root slugs must redirect 301 to /ginecologia/ ==="
WAVE1_REDIRECTS=(
    "/pap-test/|/ginecologia/pap-test/"
    "/hpv-test/|/ginecologia/pap-test-hpv/"
    "/duopap/|/ginecologia/duopap/"
    "/ecografia-mammaria/|/ginecologia/ecografia-mammaria/"
    "/ecografia-transvaginale/|/ginecologia/ecografia-transvaginale/"
    "/colposcopia/|/ginecologia/colposcopia/"
    "/visita-ginecologica/|/ginecologia/visita-ginecologica/"
)
for entry in "${WAVE1_REDIRECTS[@]}"; do
    IFS='|' read -r path expected_loc <<< "$entry"
    check "${DOMAIN}${path}" "301" "$expected_loc" "Wave 1: must 301 to /ginecologia/"
done

echo ""
echo "=== TEST 4: Cross-canonical must redirect 301 to hub ==="
CROSS_CANONICAL=(
    "/agoaspirato-tiroide/|/endocrinologia/"
    "/chirurgia-ginecologica|/isteroscopia/"
    "/impedenzometria|/otorinolaringoiatria/"
    "/monitoraggio-follicolare|/pma-fertilita/"
    "/rinofibrolaringoscopia|/otorinolaringoiatria/"
    "/translucenza-nucale|/ginecologia/ecografia-morfologica/"
    "/ecg|/cardiologia/visita-cardiologica-ecg/"
    "/visita-cardiologica|/cardiologia/visita-cardiologica-ecg/"
    "/dermatoscopia-digitale|/dermatologia/"
    "/consulto-pma|/pma-fertilita/"
    "/ecografia-ginecologica|/ginecologia/"
)
for entry in "${CROSS_CANONICAL[@]}"; do
    IFS='|' read -r path expected_loc <<< "$entry"
    check "${DOMAIN}${path}" "301" "$expected_loc" "Cross-canonical must 301 to hub"
done

echo ""
echo "=== TEST 5: Hub pages must remain 200 ==="
HUBS=(
    "/cardiologia/"
    "/ginecologia/"
    "/dermatologia/"
    "/endocrinologia/"
    "/neurologia/"
    "/ortopedia/"
    "/pma-fertilita/"
    "/slim-care/"
    "/laboratorio/"
    "/gastroenterologia/"
    "/urologia/"
    "/oculistica/"
    "/otorinolaringoiatria/"
)
for path in "${HUBS[@]}"; do
    check "${DOMAIN}${path}" "200" "" "Hub must be 200"
done

echo ""
echo "=== TEST 6: Specialty clusters must remain intact ==="
CLUSTERS=(
    "/cardiologia/visita-cardiologica-ecg/"
    "/cardiologia/ecocardiogramma/"
    "/cardiologia/holter-ecg/"
    "/cardiologia/holter-pressorio/"
    "/cardiologia/checkup-cardiovascolare/"
    "/ginecologia/visita-ginecologica/"
    "/ginecologia/pap-test/"
    "/ginecologia/duopap/"
    "/ginecologia/colposcopia/"
    "/ginecologia/ecografia-mammaria/"
)
for path in "${CLUSTERS[@]}"; do
    check "${DOMAIN}${path}" "200" "" "Cluster page must be 200"
done

echo ""
echo "=== TEST 7: No redirect loops (max 1 hop) ==="
LOOP_CHECK=(
    "/hpv-test/"
    "/pap-test/"
    "/ginecologi-sassari/"
    "/visita-ortopedica/"
    "/mappatura-nevi/"
    "/pages/visita-ginecologica"
    "/pages/ecg"
)
for path in "${LOOP_CHECK[@]}"; do
    hops=$(curl -sL -o /dev/null -w "%{num_redirects}" "${DOMAIN}${path}" 2>/dev/null)
    if [[ "$hops" -gt 1 ]]; then
        echo "FAIL | ${DOMAIN}${path} | $hops redirect hops (max 1 allowed)"
        ((FAIL++))
    else
        echo "PASS | ${DOMAIN}${path} | $hops hops"
        ((PASS++))
    fi
done

echo ""
echo "=== TEST 8: /pages/ 404s should now be 301 ==="
PAGES_404=(
    "/pages/ginecologia.html"
    "/pages/dermatologia.html"
    "/pages/neurologia"
    "/pages/ortopedia"
    "/pages/slim-care"
    "/pages/pma-fertilita"
    "/pages/ecocardiogramma.html"
)
for path in "${PAGES_404[@]}"; do
    check "${DOMAIN}${path}" "301" "" "Former 404 should now be 301"
done

echo ""
echo "=== TEST 9: Sampled sitemap URLs must return 200 ==="
SITEMAP_SAMPLES=(
    "/"
    "/chi-siamo/"
    "/contatti/"
    "/equipe/"
    "/listino/"
)
for path in "${SITEMAP_SAMPLES[@]}"; do
    check "${DOMAIN}${path}" "200" "" "Sitemap URL must be 200"
done

echo ""
echo "=== TEST 10: Canonical tags on key pages ==="
for path in "/cardiologia/" "/ginecologia/" "/dermatologia/"; do
    canonical=$(curl -sL "${DOMAIN}${path}" 2>/dev/null | grep -o 'rel="canonical" href="[^"]*"' | head -1)
    expected="https://bio-clinic.it${path}"
    if [[ "$canonical" == *"$expected"* ]]; then
        echo "PASS | ${DOMAIN}${path} | canonical=$expected"
        ((PASS++))
    else
        echo "FAIL | ${DOMAIN}${path} | Expected canonical: $expected | Got: $canonical"
        ((FAIL++))
    fi
done

echo ""
echo "============================================"
echo "RESULTS: $PASS passed | $FAIL failed | $WARN warnings"
echo "============================================"

if [[ $FAIL -gt 0 ]]; then
    echo "⚠️  WAVE 0+1 VALIDATION FAILED — Fix issues before proceeding"
    exit 1
else
    echo "✅  WAVE 0+1 VALIDATION PASSED — Ready for Wave 2"
    exit 0
fi
