#!/bin/bash
# Comprehensive URL audit for Wave 0 planning

echo "=== PART 1: ALL /pages/ URLs known ==="
echo ""
echo "--- Hub-level /pages/ ---"
for url in cardiologia ginecologia dermatologia endocrinologia neurologia ortopedia pma-fertilita slim-care laboratorio specialita convenzioni contatti chi-siamo equipe prevenzione gastroenterologia; do
  for ext in "" ".html"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "https://bio-clinic.it/pages/${url}${ext}" 2>/dev/null || echo "ERR")
    redir=""
    if [[ "$status" == "301" || "$status" == "308" ]]; then
      redir=$(curl -s -o /dev/null -w "%{redirect_url}" "https://bio-clinic.it/pages/${url}${ext}" 2>/dev/null)
    fi
    echo "/pages/${url}${ext} -> HTTP $status ${redir:+-> $redir}"
  done
done

echo ""
echo "--- Service-level /pages/ ---"
for url in visita-cardiologica-ecg visita-ginecologica visita-dermatologica visita-endocrinologica visita-neurologica visita-ortopedica visita-urologica visita-oculistica visita-gastroenterologica visita-pneumologica visita-reumatologica visita-ematologica visita-fisiatrica visita-pediatrica visita-nefrologica visita-chirurgia-vascolare visita-internistica visita-medicina-lavoro visita-medicina-sport visita-nutrizionale colloquio-psicologico ginecologi-sassari isterosalpingografia isteroscopia hpv-test pap-test duopap genetica ecocardiogramma holter-ecg holter-pressorio checkup-cardiovascolare mappatura-nevi dermatoscopia-digitale ecografia-mammaria ecografia-tiroidea ecografia-transvaginale ecografia-ginecologica ecografia-pelvica ecografia-prostatica ecografia-renale ecografia-addominale ecografia-ostetrica-3d ecografia-morfologica ecg eco-doppler-arti elettromiografia translucenza-nucale infiltrazioni-articolari scleroterapia spirometria audiometria impedenzometria campo-visivo agoaspirato-tiroide checkup-tiroide assistenza-ostetrica chirurgia-ginecologica corso-preparto consulto-pma monitoraggio-follicolare caressflow perifit-kegel-sassari radiofrequenza-vaginale riabilitazione-pavimento-pelvico trattamenti-pavimento-pelvico rinofibrolaringoscopia colposcopia screening-inps-sardegna symptom-checker; do
  for ext in "" ".html"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "https://bio-clinic.it/pages/${url}${ext}" 2>/dev/null || echo "ERR")
    redir=""
    if [[ "$status" == "301" || "$status" == "308" ]]; then
      redir=$(curl -s -o /dev/null -w "%{redirect_url}" "https://bio-clinic.it/pages/${url}${ext}" 2>/dev/null)
    fi
    if [[ "$status" != "404" ]]; then
      echo "/pages/${url}${ext} -> HTTP $status ${redir:+-> $redir}"
    fi
  done
done
