# Sezioni 4-10 del HUB: Servizi, Diagnostica, Lab Integrato, Prezzi, Patologie, Sardegna, Percorsi, FAQ, Prenota, CTA

part2 = """
    <!-- ═══ SECTION 4: SERVIZI DI CARDIOLOGIA ═══ -->
    <section id="servizi" class="py-16 bg-white scroll-mt-28">
        <div class="max-w-7xl mx-auto px-4">
            <div class="text-center mb-12">
                <span class="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4" style="background: #FFEBEE; color: #C62828;">Le Nostre Prestazioni</span>
                <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Servizi di Cardiologia</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Un'offerta completa di 39 prestazioni per la prevenzione, la diagnosi e il trattamento delle patologie cardiovascolari.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Visite Specialistiche -->
                <div class="service-card bg-white rounded-2xl p-6">
                    <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style="background: #FFEBEE;"><i class="fas fa-user-md text-2xl" style="color: #E53935;"></i></div>
                    <h3 class="text-xl font-bold text-gray-900 mb-3">Visite Specialistiche</h3>
                    <p class="text-gray-600 mb-4">Valutazione cardiologica completa con specialisti dedicati.</p>
                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> <a href="/cardiologia/visita-cardiologica-ecg/" class="hover:text-red-600">Visita Cardiologica + ECG</a> <span class="price-badge">da &euro;100</span></li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Visita di Controllo</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Consulenza Ipertensione</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Certificato Idoneità Sportiva</li>
                    </ul>
                    <a href="/cardiologia/visita-cardiologica-ecg/" class="text-sm font-semibold hover:underline" style="color: #E53935;">Scopri di più <i class="fas fa-arrow-right ml-1"></i></a>
                </div>
                
                <!-- Diagnostica Cardiaca -->
                <div class="service-card bg-white rounded-2xl p-6">
                    <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style="background: #FFEBEE;"><i class="fas fa-heartbeat text-2xl" style="color: #E53935;"></i></div>
                    <h3 class="text-xl font-bold text-gray-900 mb-3">Diagnostica Cardiaca</h3>
                    <p class="text-gray-600 mb-4">Esami strumentali avanzati per la valutazione cardiaca.</p>
                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Elettrocardiogramma (ECG)</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> <a href="/cardiologia/ecocardiogramma/" class="hover:text-red-600">Ecocardiogramma Color Doppler</a> <span class="price-badge">&euro;150</span></li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> <a href="/cardiologia/holter-ecg/" class="hover:text-red-600">Holter ECG 24h</a></li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> <a href="/cardiologia/holter-pressorio/" class="hover:text-red-600">Holter Pressorio 24h (ABPM)</a></li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Test da Sforzo</li>
                    </ul>
                    <a href="/cardiologia/ecocardiogramma/" class="text-sm font-semibold hover:underline" style="color: #E53935;">Scopri di più <i class="fas fa-arrow-right ml-1"></i></a>
                </div>
                
                <!-- Eco-Doppler Vascolare -->
                <div class="service-card bg-white rounded-2xl p-6">
                    <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style="background: #FFEBEE;"><i class="fas fa-wave-square text-2xl" style="color: #E53935;"></i></div>
                    <h3 class="text-xl font-bold text-gray-900 mb-3">Eco-Doppler Vascolare</h3>
                    <p class="text-gray-600 mb-4">Studio dei vasi sanguigni con tecnologia di ultima generazione.</p>
                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Eco-Doppler TSA (Carotidi)</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Eco-Doppler Arti Inferiori</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Eco-Doppler Arti Superiori</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Eco-Doppler Aorta Addominale</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Eco-Doppler Venoso</li>
                    </ul>
                    <a href="#prestazioni-correlate" class="text-sm font-semibold hover:underline" style="color: #E53935;">Scopri di più <i class="fas fa-arrow-right ml-1"></i></a>
                </div>
                
                <!-- Prevenzione -->
                <div class="service-card bg-white rounded-2xl p-6">
                    <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style="background: #FFEBEE;"><i class="fas fa-shield-alt text-2xl" style="color: #E53935;"></i></div>
                    <h3 class="text-xl font-bold text-gray-900 mb-3">Prevenzione Cardiovascolare</h3>
                    <p class="text-gray-600 mb-4">Screening e check-up per la prevenzione delle malattie cardiache secondo le linee guida ESC 2021.</p>
                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> <a href="/cardiologia/checkup-cardiovascolare/" class="hover:text-red-600">Check-up Cardiovascolare</a> <span class="price-badge">&euro;150</span></li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Valutazione Rischio CV (SCORE2)</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Screening Ipertensione</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Screening Aritmie</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Profilo Lipidico + Visita</li>
                    </ul>
                    <a href="/cardiologia/checkup-cardiovascolare/" class="text-sm font-semibold hover:underline" style="color: #E53935;">Scopri di più <i class="fas fa-arrow-right ml-1"></i></a>
                </div>
                
                <!-- Patologie Trattate -->
                <div class="service-card bg-white rounded-2xl p-6">
                    <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style="background: #FFEBEE;"><i class="fas fa-notes-medical text-2xl" style="color: #E53935;"></i></div>
                    <h3 class="text-xl font-bold text-gray-900 mb-3">Patologie Trattate</h3>
                    <p class="text-gray-600 mb-4">Diagnosi e gestione delle principali patologie cardiovascolari.</p>
                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> <a href="/salute/ipertensione-arteriosa/" class="hover:text-red-600">Ipertensione Arteriosa</a></li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Aritmie (FA, Extrasistoli)</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Cardiopatia Ischemica</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Scompenso Cardiaco</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Valvulopatie</li>
                    </ul>
                    <a href="/salute/ipertensione-arteriosa/" class="text-sm font-semibold hover:underline" style="color: #E53935;">Approfondisci <i class="fas fa-arrow-right ml-1"></i></a>
                </div>
                
                <!-- Percorsi Integrati -->
                <div class="service-card bg-white rounded-2xl p-6">
                    <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style="background: #FFEBEE;"><i class="fas fa-project-diagram text-2xl" style="color: #E53935;"></i></div>
                    <h3 class="text-xl font-bold text-gray-900 mb-3">Percorsi Integrati</h3>
                    <p class="text-gray-600 mb-4">Percorsi multidisciplinari per una gestione completa del rischio cardiovascolare.</p>
                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Cardio + Laboratorio interno</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Cardio + Endocrinologia</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Cardio + Nefrologia</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Cardio + Chirurgia Vascolare</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> <a href="/slim-care/" class="hover:text-red-600">Slim Care Cardiovascolare</a></li>
                    </ul>
                    <a href="/slim-care/" class="text-sm font-semibold hover:underline" style="color: #E53935;">Scopri Slim Care <i class="fas fa-arrow-right ml-1"></i></a>
                </div>
            </div>
        </div>
    </section>

    <!-- ═══ SECTION 5: DIAGNOSTICA AVANZATA ═══ -->
    <section id="diagnostica" class="py-16 scroll-mt-28" style="background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);">
        <div class="max-w-6xl mx-auto px-4">
            <div class="text-center mb-12">
                <span class="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4" style="background: #E53935; color: white;">Diagnostica Avanzata</span>
                <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Esami Strumentali Cardiologici</h2>
                <p class="text-lg text-gray-700 max-w-2xl mx-auto">Tecnologia di ultima generazione per una diagnosi precisa e referti in giornata.</p>
            </div>
            
            <div class="grid md:grid-cols-2 gap-8">
                <div class="bg-white rounded-2xl shadow-lg p-8 border-l-4" style="border-color: #E53935;">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-14 h-14 rounded-xl flex items-center justify-center" style="background: #FFEBEE;"><span class="text-2xl">❤️</span></div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-900">Ecocardiogramma Color Doppler</h3>
                            <p class="text-sm text-gray-500">Ecografia cardiaca completa</p>
                        </div>
                    </div>
                    <p class="text-gray-600 mb-4">Esame non invasivo che consente di valutare struttura e funzione del cuore: dimensioni delle camere, funzione valvolare, contrattilità miocardica e flussi intracardiaci. Durata circa 20-30 minuti. Le linee guida ESC 2023 lo raccomandano come esame di primo livello per sospetto scompenso cardiaco e valvulopatie.</p>
                    <p class="text-sm text-gray-500 mb-3"><i class="fas fa-user-md" style="color: #E53935;"></i> Tutti i cardiologi dell'équipe</p>
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">✓ Non invasivo</span>
                        <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">✓ Referto immediato</span>
                        <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">✓ Lab: NT-proBNP</span>
                    </div>
                    <a href="/cardiologia/ecocardiogramma/" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold" style="background: #E53935;">Scopri di più <i class="fas fa-arrow-right"></i></a>
                </div>
                
                <div class="bg-white rounded-2xl shadow-lg p-8 border-l-4" style="border-color: #E53935;">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-14 h-14 rounded-xl flex items-center justify-center" style="background: #FFEBEE;"><span class="text-2xl">📊</span></div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-900">Holter ECG e Pressorio 24h</h3>
                            <p class="text-sm text-gray-500">Monitoraggio continuo del cuore</p>
                        </div>
                    </div>
                    <p class="text-gray-600 mb-4">Registrazione continua dell'attività cardiaca (Holter ECG) o della pressione arteriosa (ABPM) per 24-48 ore. Fondamentale per identificare aritmie, extrasistoli e variazioni pressorie. Le linee guida ESC 2024 sulla fibrillazione atriale raccomandano l'Holter ECG come esame di prima scelta per aritmie parossistiche.</p>
                    <p class="text-sm text-gray-500 mb-3"><i class="fas fa-user-md" style="color: #E53935;"></i> <strong>Dott. Pischedda</strong> e <strong>Dott. Franca</strong></p>
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">✓ 24-48h continuo</span>
                        <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">✓ Diagnosi aritmie</span>
                        <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">✓ Lab: TSH, K+, Mg</span>
                    </div>
                    <a href="/cardiologia/holter-ecg/" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold" style="background: #E53935;">Scopri di più <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
            
            <!-- Cross-Sell Check-Up -->
            <div class="mt-8 bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-6">
                <div class="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, #E53935, #C62828);"><span class="text-3xl">🫀</span></div>
                <div class="flex-1 text-center md:text-left">
                    <h4 class="text-xl font-bold text-gray-900 mb-2">Hai più di 40 anni o fattori di rischio?</h4>
                    <p class="text-gray-600">Il <strong>Check-up Cardiovascolare</strong> include visita cardiologica, ECG, ecocardiogramma e <a href="/laboratorio/" class="text-red-600 underline">profilo lipidico</a>. Le linee guida ESC 2021 raccomandano lo screening a partire dai 40 anni con stratificazione SCORE2.</p>
                </div>
                <a href="/cardiologia/checkup-cardiovascolare/" class="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold whitespace-nowrap" style="background: #E53935;">Check-up Cuore <i class="fas fa-arrow-right"></i></a>
            </div>
        </div>
    </section>

    <!-- ═══ SECTION 6: LABORATORIO INTEGRATO PER IL CUORE ═══ -->
    <section id="laboratorio" class="py-16 bg-white scroll-mt-28">
        <div class="max-w-6xl mx-auto px-4">
            <div class="text-center mb-12">
                <span class="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4" style="background: #E8F5E9; color: #2E7D32;">Vantaggio Esclusivo Bio-Clinic</span>
                <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Laboratorio Interno Integrato per il Cuore</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Bio-Clinic è l'<strong>unico centro a Sassari</strong> con laboratorio analisi interno: esegui gli esami del sangue e la visita cardiologica nella stessa sede, come raccomandato dalle linee guida ESC 2021.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <!-- Profilo Lipidico -->
                <div class="lab-card">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: #E8F5E9;"><i class="fas fa-vial" style="color: #2E7D32;"></i></div>
                        <h3 class="font-bold text-gray-900">Profilo Lipidico Completo</h3>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">Colesterolo totale, HDL, LDL, trigliceridi. Target LDL secondo ESC 2021: &lt;116 mg/dL (rischio basso), &lt;70 mg/dL (rischio alto), &lt;55 mg/dL (rischio molto alto).</p>
                    <p class="text-sm font-bold" style="color: #2E7D32;">&euro;18</p>
                    <a href="/laboratorio/" class="text-xs font-semibold hover:underline" style="color: #00704A;">Aggiungi al percorso →</a>
                </div>
                
                <!-- Troponina -->
                <div class="lab-card">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: #FFEBEE;"><i class="fas fa-heart-circle-exclamation" style="color: #E53935;"></i></div>
                        <h3 class="font-bold text-gray-900">Troponina ad Alta Sensibilità</h3>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">Marker di danno miocardico. Secondo le linee guida ESC 2023 sulle sindromi coronariche acute, la hs-cTnI è il gold standard per escludere o confermare l'infarto miocardico.</p>
                    <a href="/laboratorio/" class="text-xs font-semibold hover:underline" style="color: #00704A;">Scopri →</a>
                </div>
                
                <!-- NT-proBNP -->
                <div class="lab-card">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: #E3F2FD;"><i class="fas fa-lungs" style="color: #1565C0;"></i></div>
                        <h3 class="font-bold text-gray-900">NT-proBNP</h3>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">Marker di scompenso cardiaco. NT-proBNP &lt;125 pg/mL esclude insufficienza cardiaca con valore predittivo negativo >98% (ESC 2023 HF Guidelines).</p>
                    <a href="/laboratorio/" class="text-xs font-semibold hover:underline" style="color: #00704A;">Scopri →</a>
                </div>
                
                <!-- PCR -->
                <div class="lab-card">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: #FFF3E0;"><i class="fas fa-fire" style="color: #E65100;"></i></div>
                        <h3 class="font-bold text-gray-900">PCR ad Alta Sensibilità</h3>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">Marker di infiammazione cardiovascolare. hs-CRP >2 mg/L indica rischio CV residuo anche con colesterolo a target (studio CANTOS, Ridker 2017).</p>
                    <a href="/laboratorio/" class="text-xs font-semibold hover:underline" style="color: #00704A;">Scopri →</a>
                </div>
                
                <!-- Omocisteina -->
                <div class="lab-card">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: #F3E5F5;"><i class="fas fa-dna" style="color: #7B1FA2;"></i></div>
                        <h3 class="font-bold text-gray-900">Omocisteina</h3>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">Particolarmente rilevante in <strong>Sardegna</strong>: prevalenza MTHFR C677T del 25-30% nella popolazione sarda. Iperomocisteinemia (&gt;15 μmol/L) è fattore di rischio CV indipendente.</p>
                    <a href="/laboratorio/" class="text-xs font-semibold hover:underline" style="color: #00704A;">Scopri →</a>
                </div>
                
                <!-- Profilo Coagulazione -->
                <div class="lab-card">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: #FCE4EC;"><i class="fas fa-droplet" style="color: #C62828;"></i></div>
                        <h3 class="font-bold text-gray-900">Profilo Coagulazione PT/INR</h3>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">Monitoraggio terapia anticoagulante (TAO/DOAC) in pazienti con fibrillazione atriale, protesi valvolari, TVP. Essenziale secondo ESC 2024 AF Guidelines.</p>
                    <a href="/laboratorio/" class="text-xs font-semibold hover:underline" style="color: #00704A;">Scopri →</a>
                </div>
            </div>
            
            <!-- Box vantaggio Bio-Clinic -->
            <div class="rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6" style="background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);">
                <div class="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style="background: #00704A;"><i class="fas fa-flask text-2xl text-white"></i></div>
                <div class="flex-1 text-center md:text-left">
                    <h4 class="text-xl font-bold text-gray-900 mb-2">Il Vantaggio del Laboratorio Interno</h4>
                    <ul class="text-gray-700 text-sm space-y-1">
                        <li>✓ Esegui esami del sangue prima o dopo la visita cardiologica, <strong>nella stessa sede</strong></li>
                        <li>✓ <strong>Referti in 4 ore</strong> per le urgenze cardiologiche</li>
                        <li>✓ Nessuna prescrizione medica necessaria per gli esami privati</li>
                        <li>✓ Oltre <strong>1.100 esami disponibili</strong> per un quadro clinico completo</li>
                    </ul>
                </div>
                <a href="/laboratorio/" class="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold whitespace-nowrap" style="background: #00704A;">Scopri il Laboratorio <i class="fas fa-arrow-right"></i></a>
            </div>
        </div>
    </section>

    <!-- ═══ SECTION 7: TABELLA PREZZI ═══ -->
    <section id="prezzi" class="py-16 bg-gray-50 scroll-mt-28">
        <div class="max-w-4xl mx-auto px-4">
            <div class="text-center mb-10">
                <span class="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4" style="background: #FFEBEE; color: #C62828;">Trasparenza dei Costi</span>
                <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Quanto Costa la Cardiologia a Sassari</h2>
                <p class="text-gray-600">Prezzi chiari e accessibili. Accettiamo le principali <a href="/convenzioni/" class="text-red-600 underline">convenzioni e fondi sanitari</a>.</p>
            </div>
            
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div class="price-row font-bold text-gray-500 text-sm" style="background: #f9fafb;">
                    <span>Prestazione</span>
                    <span>Bio-Clinic</span>
                    <span>SSN (stima attesa)</span>
                </div>
                <div class="price-row">
                    <span class="font-medium text-gray-800"><a href="/cardiologia/visita-cardiologica-ecg/" class="hover:text-red-600">Visita Cardiologica + ECG</a></span>
                    <span class="font-bold" style="color: #E53935;">da &euro;100</span>
                    <span class="text-gray-400 text-sm">60-120 gg attesa</span>
                </div>
                <div class="price-row">
                    <span class="font-medium text-gray-800"><a href="/cardiologia/ecocardiogramma/" class="hover:text-red-600">Ecocardiogramma Color Doppler</a></span>
                    <span class="font-bold" style="color: #E53935;">&euro;150</span>
                    <span class="text-gray-400 text-sm">90-180 gg attesa</span>
                </div>
                <div class="price-row">
                    <span class="font-medium text-gray-800"><a href="/cardiologia/holter-ecg/" class="hover:text-red-600">Holter ECG 24h</a></span>
                    <span class="font-bold" style="color: #E53935;">da &euro;120</span>
                    <span class="text-gray-400 text-sm">60-120 gg attesa</span>
                </div>
                <div class="price-row">
                    <span class="font-medium text-gray-800"><a href="/cardiologia/holter-pressorio/" class="hover:text-red-600">Holter Pressorio 24h (ABPM)</a></span>
                    <span class="font-bold" style="color: #E53935;">da &euro;100</span>
                    <span class="text-gray-400 text-sm">60-120 gg attesa</span>
                </div>
                <div class="price-row">
                    <span class="font-medium text-gray-800"><a href="/cardiologia/checkup-cardiovascolare/" class="hover:text-red-600">Check-up Cardiovascolare</a></span>
                    <span class="font-bold" style="color: #E53935;">&euro;150</span>
                    <span class="text-gray-400 text-sm">N/D come pacchetto</span>
                </div>
                <div class="price-row">
                    <span class="font-medium text-gray-800">Eco-Doppler TSA (Carotidi)</span>
                    <span class="font-bold" style="color: #E53935;">da &euro;100</span>
                    <span class="text-gray-400 text-sm">90-180 gg attesa</span>
                </div>
                <div class="price-row">
                    <span class="font-medium text-gray-800">Test da Sforzo</span>
                    <span class="font-bold" style="color: #E53935;">da &euro;150</span>
                    <span class="text-gray-400 text-sm">120+ gg attesa</span>
                </div>
                <div class="price-row" style="background: #f0fdf4;">
                    <span class="font-medium text-gray-800"><a href="/laboratorio/" class="hover:text-green-700">Profilo Lipidico (Lab interno)</a></span>
                    <span class="font-bold" style="color: #00704A;">&euro;18</span>
                    <span class="text-gray-400 text-sm">Stesso giorno</span>
                </div>
            </div>
            <p class="text-center mt-4 text-sm text-gray-500">I costi possono variare in base allo specialista. <a href="/listino/" class="text-red-600 underline">Vedi listino completo</a>.</p>
        </div>
    </section>

    <!-- ═══ SECTION 8: PATOLOGIE TRATTATE ═══ -->
    <section id="patologie" class="py-16 bg-white scroll-mt-28">
        <div class="max-w-6xl mx-auto px-4">
            <div class="text-center mb-12">
                <span class="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4" style="background: #FFEBEE; color: #C62828;">Condizioni Cardiovascolari</span>
                <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Patologie Cardiache Trattate a Bio-Clinic</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Diagnosi e gestione delle principali patologie cardiovascolari con approccio evidence-based e laboratorio integrato.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="patho-card">
                    <h3 class="font-bold text-gray-900 mb-2"><a href="/salute/ipertensione-arteriosa/" class="hover:text-red-600">Ipertensione Arteriosa</a></h3>
                    <p class="text-sm text-gray-600 mb-2">Colpisce il 33% degli italiani e oltre il 35% dei sardi over 50. Diagnosi con <a href="/cardiologia/holter-pressorio/" class="text-red-600 underline">Holter Pressorio 24h</a> e monitoraggio con esami di laboratorio (creatinina, potassio, profilo lipidico).</p>
                    <p class="text-xs text-gray-400">Rif.: ESC 2023 Guidelines on Arterial Hypertension</p>
                </div>
                
                <div class="patho-card">
                    <h3 class="font-bold text-gray-900 mb-2">Fibrillazione Atriale e Aritmie</h3>
                    <p class="text-sm text-gray-600 mb-2">L'aritmia più comune (2-3% adulti europei). Diagnosi con <a href="/cardiologia/holter-ecg/" class="text-red-600 underline">Holter ECG 24h</a>. Monitoraggio con <strong>Profilo Coagulazione PT/INR</strong> per la terapia anticoagulante.</p>
                    <p class="text-xs text-gray-400">Rif.: ESC 2024 Guidelines on Atrial Fibrillation</p>
                </div>
                
                <div class="patho-card">
                    <h3 class="font-bold text-gray-900 mb-2">Cardiopatia Ischemica</h3>
                    <p class="text-sm text-gray-600 mb-2">Prima causa di morte CV in Italia (75.000 decessi/anno). Diagnosi con ECG, <a href="/cardiologia/ecocardiogramma/" class="text-red-600 underline">ecocardiogramma</a>, test da sforzo e <strong>Troponina ad alta sensibilità</strong>.</p>
                    <p class="text-xs text-gray-400">Rif.: ESC 2023 Guidelines on ACS</p>
                </div>
                
                <div class="patho-card">
                    <h3 class="font-bold text-gray-900 mb-2">Scompenso Cardiaco</h3>
                    <p class="text-sm text-gray-600 mb-2">Interessa 1-2% della popolazione adulta. Diagnosi con <a href="/cardiologia/ecocardiogramma/" class="text-red-600 underline">ecocardiogramma</a> e <strong>NT-proBNP</strong> (&lt;125 pg/mL esclude scompenso con VPN &gt;98%).</p>
                    <p class="text-xs text-gray-400">Rif.: ESC 2023 Guidelines on Heart Failure</p>
                </div>
                
                <div class="patho-card">
                    <h3 class="font-bold text-gray-900 mb-2">Valvulopatie Cardiache</h3>
                    <p class="text-sm text-gray-600 mb-2">Patologie delle valvole cardiache (stenosi aortica, insufficienza mitralica). L'<a href="/cardiologia/ecocardiogramma/" class="text-red-600 underline">ecocardiogramma Color Doppler</a> è il gold standard diagnostico.</p>
                    <p class="text-xs text-gray-400">Rif.: ESC 2021 Guidelines on VHD</p>
                </div>
                
                <div class="patho-card">
                    <h3 class="font-bold text-gray-900 mb-2">Dislipidemia e Aterosclerosi</h3>
                    <p class="text-sm text-gray-600 mb-2">Il colesterolo LDL è il target terapeutico primario. Diagnosi con <strong>Profilo Lipidico</strong> (&euro;18 presso il nostro <a href="/laboratorio/" class="text-red-600 underline">laboratorio</a>) ed Eco-Doppler TSA per le placche carotidee.</p>
                    <p class="text-xs text-gray-400">Rif.: ESC 2021 Guidelines on CVD Prevention</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ═══ SECTION 9: ANGOLO SARDEGNA ═══ -->
    <section id="sardegna" class="py-16 bg-gray-50 scroll-mt-28">
        <div class="max-w-4xl mx-auto px-4">
            <div class="text-center mb-10">
                <span class="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4" style="background: #FFF3E0; color: #E65100;">Focus Regionale</span>
                <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Rischio Cardiovascolare in Sardegna: Dati e Prevenzione</h2>
            </div>
            
            <div class="sardinia-highlight mb-8">
                <h3 class="text-xl font-bold text-gray-900 mb-4"><i class="fas fa-map-marked-alt" style="color: #E65100;"></i> Perché la Sardegna ha un Rischio CV Particolare</h3>
                <div class="grid md:grid-cols-2 gap-6 text-gray-700">
                    <div>
                        <p class="mb-3"><strong>Diabete tipo 2:</strong> prevalenza del <strong>7,2%</strong> nella popolazione sarda, contro il 5,4% della media italiana (dati ISS). Il diabete raddoppia il rischio di eventi cardiovascolari.</p>
                        <p class="mb-3"><strong>Polimorfismo MTHFR:</strong> il 25-30% dei sardi è omozigote per la variante C677T, che causa <strong>iperomocisteinemia</strong>, fattore di rischio CV indipendente. Il dosaggio dell'<strong>omocisteina</strong> è particolarmente raccomandato nella popolazione sarda.</p>
                    </div>
                    <div>
                        <p class="mb-3"><strong>Beta-talassemia:</strong> prevalenza eterozigote del 12-15% in Sardegna, che può influenzare l'emocromo e la capacità di trasporto dell'ossigeno, con implicazioni sulla funzione cardiaca.</p>
                        <p class="mb-3"><strong>Popolazione rurale anziana:</strong> le aree interne della Sardegna hanno accesso limitato a screening cardiologici specialistici, con diagnosi tardive e maggior rischio di complicanze.</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-2xl shadow p-6 text-center">
                <p class="text-gray-700 mb-4">Per queste ragioni, Bio-Clinic ha integrato nel percorso cardiologico il dosaggio di <strong>omocisteina</strong>, <strong>emoglobina glicata (HbA1c)</strong> e <strong>profilo lipidico</strong> come esami di routine, eseguibili nello stesso giorno della visita cardiologica grazie al laboratorio interno.</p>
                <a href="/laboratorio/" class="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold" style="background: #00704A;">Esami per il Cuore <i class="fas fa-arrow-right"></i></a>
            </div>
        </div>
    </section>
"""

with open('/tmp/hub_part2.html', 'w') as f:
    f.write(part2)
print(f"Part 2: {len(part2)} chars written")
