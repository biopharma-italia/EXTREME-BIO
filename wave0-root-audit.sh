#!/bin/bash
# PART 2: Root-level URLs and their behavior 
echo "=== ROOT-LEVEL SERVICE URLS ==="
for url in visita-cardiologica visita-ginecologica visita-dermatologica visita-endocrinologica visita-neurologica visita-ortopedica visita-urologica visita-oculistica visita-orl visita-gastroenterologica visita-pneumologica visita-reumatologica visita-ematologica visita-fisiatrica visita-pediatrica visita-nefrologica visita-chirurgia-vascolare visita-internistica visita-medicina-lavoro visita-medicina-sport visita-nutrizionale colloquio-psicologico ginecologi-sassari isterosalpingografia isteroscopia hpv-test pap-test duopap genetica mappatura-nevi dermatoscopia-digitale ecografia-mammaria ecografia-tiroidea ecografia-transvaginale ecografia-ginecologica ecografia-pelvica ecografia-prostatica ecografia-renale ecografia-addominale ecografia-ostetrica-3d ecografia-morfologica ecg eco-doppler-arti elettromiografia translucenza-nucale infiltrazioni-articolari scleroterapia spirometria audiometria impedenzometria campo-visivo agoaspirato-tiroide checkup-tiroide assistenza-ostetrica chirurgia-ginecologica corso-preparto consulto-pma monitoraggio-follicolare caressflow perifit-kegel-sassari radiofrequenza-vaginale riabilitazione-pavimento-pelvico trattamenti-pavimento-pelvico rinofibrolaringoscopia colposcopia screening-inps-sardegna symptom-checker ecocardiogramma holter-ecg holter-pressorio checkup-cardiovascolare slim-care slim-care-donna mounjaro-tirzepatide-sassari preparazione-esami; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "https://bio-clinic.it/${url}/" 2>/dev/null || echo "ERR")
  redir=""
  if [[ "$status" == "301" || "$status" == "308" ]]; then
    redir=$(curl -s -o /dev/null -w "%{redirect_url}" "https://bio-clinic.it/${url}/" 2>/dev/null)
  fi
  echo "/${url}/ -> HTTP $status ${redir:+-> $redir}"
done

echo ""
echo "=== HIERARCHICAL URLS (Target system) ==="
echo "--- Cardiologia cluster ---"
for sub in visita-cardiologica-ecg ecocardiogramma holter-ecg holter-pressorio checkup-cardiovascolare eco-doppler-arti ecg; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "https://bio-clinic.it/cardiologia/${sub}/" 2>/dev/null || echo "ERR")
  echo "/cardiologia/${sub}/ -> HTTP $status"
done

echo "--- Laboratorio cluster ---"
for sub in stat preparazione-esami genetica; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "https://bio-clinic.it/laboratorio/${sub}/" 2>/dev/null || echo "ERR")
  echo "/laboratorio/${sub}/ -> HTTP $status"
done

echo ""
echo "=== HUB PAGES ==="
for hub in cardiologia ginecologia dermatologia endocrinologia neurologia ortopedia pma-fertilita slim-care laboratorio urologia oculistica otorinolaringoiatria gastroenterologia pneumologia reumatologia ematologia chirurgia-vascolare specialita equipe chi-siamo contatti convenzioni prevenzione blog shop; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "https://bio-clinic.it/${hub}/" 2>/dev/null || echo "ERR")
  echo "/${hub}/ -> HTTP $status"
done
