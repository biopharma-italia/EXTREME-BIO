#!/bin/bash
# ====================================================================
# WAVE 0 POST-DEPLOY VALIDATION SCRIPT
# Bio-Clinic infrastructure stabilization
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
echo "WAVE 0 VALIDATION - $(date)"
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
echo "=== TEST 2: Root URLs must serve 200 directly (no 308→/pages/) ==="
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
    "/pap-test/"
    "/hpv-test/"
    "/duopap/"
    "/mappatura-nevi/"
    "/ecografia-mammaria/"
    "/ecografia-tiroidea/"
    "/ecografia-transvaginale/"
    "/elettromiografia/"
    "/agoaspirato-tiroide/"
    "/colposcopia/"
)
for path in "${ROOT_MUST_200[@]}"; do
    check "${DOMAIN}${path}" "200" "" "Root must serve 200 directly"
done

echo ""
echo "=== TEST 3: Hub pages must remain 200 ==="
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
echo "=== TEST 4: Cardiologia cluster must remain intact ==="
CARDIO=(
    "/cardiologia/visita-cardiologica-ecg/"
    "/cardiologia/ecocardiogramma/"
    "/cardiologia/holter-ecg/"
    "/cardiologia/holter-pressorio/"
    "/cardiologia/checkup-cardiovascolare/"
)
for path in "${CARDIO[@]}"; do
    check "${DOMAIN}${path}" "200" "" "Cardio cluster must be 200"
done

echo ""
echo "=== TEST 5: No redirect loops ==="
echo "Checking for chains > 1 hop..."
LOOP_CHECK=(
    "/hpv-test/"
    "/pap-test/"
    "/ginecologi-sassari/"
    "/visita-ortopedica/"
    "/mappatura-nevi/"
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
echo "=== TEST 6: /pages/ 404s should now be 301 ==="
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
echo "============================================"
echo "RESULTS: $PASS passed | $FAIL failed | $WARN warnings"
echo "============================================"

if [[ $FAIL -gt 0 ]]; then
    echo "⚠️  WAVE 0 VALIDATION FAILED — DO NOT PROCEED TO WAVE 1"
    exit 1
else
    echo "✅  WAVE 0 VALIDATION PASSED — Ready for Wave 1 (after 14-day stability period)"
    exit 0
fi
