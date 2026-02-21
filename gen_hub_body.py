#!/usr/bin/env python3
"""Genera le sezioni BODY del nuovo HUB - da main a /main"""

# Leggi lo schema JSON-LD
with open('/tmp/cardio_schema.json') as f:
    schema_json = f.read()

# Estrai head + header + mobile-nav dall'originale (lines 1-286)
with open('site/cardiologia/index.html') as f:
    orig = f.readlines()

# Head block: da linea 1 a fine </head> (circa linea 123)
# Troviamo i confini esatti
head_end = 0
main_start = 0
main_end = 0
footer_start = 0
for i, line in enumerate(orig):
    if '</head>' in line:
        head_end = i
    if '<main id="main-content">' in line:
        main_start = i
    if '</main>' in line:
        main_end = i
    if '<!-- INTERNAL CROSS-LINKING' in line:
        footer_start = i

print(f"head_end={head_end}, main_start={main_start}, main_end={main_end}, footer_start={footer_start}")

# Ricostruiamo head con nuovo schema e style
head_lines = orig[:head_end+1]  # include </head>

# Troviamo e sostituiamo lo schema JSON-LD
new_head = []
schema_replaced = False
for line in head_lines:
    if '<script type="application/ld+json">' in line and not schema_replaced:
        new_head.append(f'    <script type="application/ld+json">{schema_json}</script>\n')
        schema_replaced = True
    elif '/* Stats */' in line:
        # Aggiungiamo CSS aggiuntivi prima di stats
        new_head.append(line)
        new_head.append("""
        /* Lab Card */
        .lab-card { background: white; border-radius: 16px; padding: 1.5rem; border: 1px solid #e5e7eb; transition: all 0.3s ease; }
        .lab-card:hover { border-color: #00704A; box-shadow: 0 8px 25px rgba(0, 112, 74, 0.12); transform: translateY(-3px); }
        
        /* Pricing Table */
        .price-row { display: grid; grid-template-columns: 1fr auto auto; gap: 1rem; padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; align-items: center; }
        .price-row:hover { background: #fef2f2; }
        .price-row:last-child { border-bottom: none; }
        
        /* Pathology Card */
        .patho-card { background: white; border-radius: 12px; padding: 1.25rem; border-left: 4px solid #E53935; transition: all 0.3s; }
        .patho-card:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
        
        /* Sardinia Box */
        .sardinia-highlight { background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); border-radius: 16px; padding: 2rem; border-left: 4px solid #E65100; }
""")
    else:
        new_head.append(line)

# Header + mobile nav: da dopo </head> a prima di <main>
header_block = orig[head_end+1:main_start]

# Footer + scripts: da dopo </main>
footer_block = orig[footer_start:]  # Dal cross-linking in poi

# ═══════════════════════════════════════
# COSTRUIAMO IL NUOVO MAIN CONTENT
# ═══════════════════════════════════════

main_content = """
    <main id="main-content">
    
    <!-- ═══ SECTION 1: HERO + AI SUMMARY ═══ -->
    <section class="hero-gradient py-16 lg:py-24">
        <div class="max-w-7xl mx-auto px-4">
            <h1 style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;">Cardiologia Sassari - Centro di Eccellenza Cardiovascolare Bio-Clinic</h1>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                    <!-- Breadcrumb -->
                    <nav aria-label="Breadcrumb" class="mb-4">
                        <ol class="flex items-center gap-2 text-sm text-gray-600">
                            <li><a href="/" class="hover:text-red-600">Home</a></li>
                            <li><span class="mx-1">/</span></li>
                            <li><a href="/specialita/" class="hover:text-red-600">Specialità</a></li>
                            <li><span class="mx-1">/</span></li>
                            <li class="font-medium" style="color: #E53935;">Cardiologia</li>
                        </ol>
                    </nav>

                    <!-- AI SUMMARY - data-speakable per AI Overview -->
                    <div class="ai-summary bg-white rounded-2xl shadow-lg p-6 mb-8 border-l-4" style="border-color: #E53935;" data-speakable="true">
                        <p class="text-gray-700 text-lg leading-relaxed">
                            <strong>Bio-Clinic Sassari</strong> offre un servizio di <strong>Cardiologia</strong> completo con <strong>5 cardiologi specialisti</strong> iscritti all'Ordine dei Medici e <strong>39 prestazioni</strong> diagnostiche: ECG, ecocardiogramma Color Doppler, Holter ECG e pressorio, Eco-Doppler TSA e vascolare, test da sforzo. Visite disponibili dal lunedì al venerdì 07:00-21:00, sabato 08:00-14:00. Prezzi da <strong>€100</strong>. Unico centro a Sassari con <strong>laboratorio analisi interno</strong> per Profilo Lipidico, Troponina, NT-proBNP e 1.100+ esami con referti in giornata.
                        </p>
                    </div>

                    <!-- Stats Grid -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="stat-box">
                            <div class="text-4xl font-extrabold mb-1" style="color: #E53935;">5</div>
                            <div class="text-gray-600 text-sm">Cardiologi specialisti</div>
                        </div>
                        <div class="stat-box">
                            <div class="text-4xl font-extrabold mb-1" style="color: #E53935;">39</div>
                            <div class="text-gray-600 text-sm">Prestazioni disponibili</div>
                        </div>
                        <div class="stat-box">
                            <div class="text-4xl font-extrabold mb-1" style="color: #00704A;">1.100+</div>
                            <div class="text-gray-600 text-sm">Esami laboratorio interno</div>
                        </div>
                        <div class="stat-box">
                            <div class="text-4xl font-extrabold mb-1" style="color: #E53935;">
                                <i class="fas fa-clock" style="font-size: 2rem;"></i>
                            </div>
                            <div class="text-gray-600 text-sm">Referti in giornata</div>
                        </div>
                    </div>
                </div>
                
                <!-- Right column: CTA -->
                <div class="flex flex-col gap-6">
                    <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div class="text-5xl mb-4">🫀</div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">Prenota la Tua Visita</h2>
                        <p class="text-gray-600 mb-6">Visita cardiologica con ECG in 3-5 giorni</p>
                        <a href="tel:+390799561332" class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg text-white font-bold text-lg w-full mb-3" style="background: #E53935;">
                            <i class="fas fa-phone"></i> 079 956 1332
                        </a>
                        <a href="https://wa.me/390799561332?text=Buongiorno,%20vorrei%20prenotare%20una%20visita%20cardiologica" class="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-white font-semibold w-full" style="background: #25D366;">
                            <i class="fab fa-whatsapp"></i> WhatsApp
                        </a>
                    </div>
                    <div class="flex items-center gap-3 bg-white rounded-xl shadow p-4">
                        <i class="fas fa-star text-2xl text-yellow-500"></i>
                        <div>
                            <div class="font-bold text-gray-800">5/5 Stelle - 3.200+ Recensioni</div>
                            <div class="text-sm text-gray-500">Lun-Ven 07:00-21:00 | Sab 08:00-14:00</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- TRUST BAR -->
    <section class="py-6 bg-white border-b">
        <div class="max-w-6xl mx-auto px-4">
            <div class="flex flex-wrap justify-center gap-8 text-center">
                <div class="flex items-center gap-3">
                    <i class="fas fa-user-md text-2xl" style="color: #E53935;"></i>
                    <div class="text-left">
                        <div class="font-bold text-gray-800">5 Cardiologi</div>
                        <div class="text-sm text-gray-500">Iscritti Ordine dei Medici</div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <i class="fas fa-flask text-2xl" style="color: #00704A;"></i>
                    <div class="text-left">
                        <div class="font-bold text-gray-800">Laboratorio Interno</div>
                        <div class="text-sm text-gray-500">1.100+ esami disponibili</div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <i class="fas fa-book-medical text-2xl" style="color: #E53935;"></i>
                    <div class="text-left">
                        <div class="font-bold text-gray-800">Linee Guida ESC</div>
                        <div class="text-sm text-gray-500">Protocolli evidence-based</div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <i class="fas fa-clock text-2xl" style="color: #00704A;"></i>
                    <div class="text-left">
                        <div class="font-bold text-gray-800">Lun-Ven 7-21</div>
                        <div class="text-sm text-gray-500">Sab 8-14</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ═══ SECTION 2: COS'È LA CARDIOLOGIA (YMYL) ═══ -->
    <section id="cardiologia-info" class="py-16 bg-white scroll-mt-28">
        <div class="max-w-4xl mx-auto px-4">
            <div class="text-center mb-10">
                <span class="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4" style="background: #FFEBEE; color: #C62828;">
                    Informazioni Mediche Verificate
                </span>
                <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Cos'è la Cardiologia e Perché è Fondamentale</h2>
            </div>
            
            <div class="prose prose-lg max-w-none text-gray-700 space-y-4">
                <p>La <strong>cardiologia</strong> è la branca della medicina interna che si occupa dello studio, della diagnosi e del trattamento delle malattie del cuore e del sistema cardiovascolare. Le <strong>malattie cardiovascolari</strong> rappresentano la <strong>prima causa di morte in Italia</strong> con oltre 230.000 decessi annui (dati ISTAT 2024), superando i tumori e tutte le altre patologie.</p>
                
                <p>Secondo le <strong>linee guida ESC 2021 sulla prevenzione cardiovascolare</strong> (<em>European Heart Journal</em>, 42, 3227-3337), la stratificazione del rischio attraverso il sistema <strong>SCORE2</strong> è raccomandata per tutti gli adulti a partire dai 40 anni. Il rischio cardiovascolare dipende dall'interazione di molteplici fattori: <a href="/salute/ipertensione-arteriosa/" class="text-red-600 underline">ipertensione arteriosa</a>, dislipidemia, diabete mellito, fumo, obesità, sedentarietà e familiarità.</p>
                
                <p>L'<strong>American Heart Association (AHA)</strong> e l'<strong>Istituto Superiore di Sanità (ISS)</strong> concordano nell'affermare che la <strong>diagnosi precoce</strong> riduce del 50% la mortalità cardiovascolare. Gli esami chiave includono: <a href="/cardiologia/visita-cardiologica-ecg/" class="text-red-600 underline">ECG</a>, <a href="/cardiologia/ecocardiogramma/" class="text-red-600 underline">ecocardiogramma</a>, <a href="/cardiologia/holter-ecg/" class="text-red-600 underline">Holter ECG</a>, <a href="/cardiologia/holter-pressorio/" class="text-red-600 underline">Holter Pressorio</a> e gli esami di laboratorio come il <strong>Profilo Lipidico</strong> e la <strong>Troponina ad alta sensibilità</strong>.</p>
                
                <p>Presso <strong>Bio-Clinic Sassari</strong>, il servizio di Cardiologia integra la diagnostica strumentale con il <a href="/laboratorio/" class="text-red-600 underline">laboratorio analisi interno</a> (1.100+ esami), offrendo un approccio diagnostico completo in un'unica sede, come raccomandato dalle <strong>linee guida ESC 2023</strong> per la gestione integrata del paziente cardiovascolare.</p>
            </div>
            
            <div class="mt-8 p-4 rounded-xl text-sm text-gray-600 border border-gray-200" style="background: #f8fafc;">
                <p><strong>Riferimenti bibliografici:</strong> ESC 2021 Guidelines on CVD Prevention (Eur Heart J, 42:3227-3337) · ESC 2023 Guidelines on Heart Failure · ESC 2024 Guidelines on Atrial Fibrillation · AHA/ACC 2019 Guidelines on Primary Prevention · ISS - Istituto Superiore di Sanità, Rapporto 2024 sulle malattie cardiovascolari in Italia.</p>
            </div>
        </div>
    </section>

    <!-- ═══ SECTION 3: TEAM CARDIOLOGI ═══ -->
    <section id="team" class="py-16 bg-gray-50 scroll-mt-28">
        <div class="max-w-7xl mx-auto px-4">
            <div class="text-center mb-12">
                <span class="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4" style="background: #FFEBEE; color: #C62828;">Il Nostro Team</span>
                <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">5 Cardiologi Specialisti Iscritti all'Ordine dei Medici</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Un'équipe di cardiologi con competenze complementari per la diagnosi, la prevenzione e il trattamento delle patologie cardiovascolari.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Dott. Tonino Bullitta -->
                <div class="team-card shadow-md">
                    <div class="p-6">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold" style="background: linear-gradient(135deg, #EF5350 0%, #E53935 100%);">TB</div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-900">Dott. Tonino Bullitta</h3>
                                <p class="text-sm" style="color: #E53935;">Cardiologo</p>
                                <p class="text-xs text-gray-400">Albo Medici Sassari n. 2054</p>
                            </div>
                        </div>
                        <p class="text-gray-600 text-sm mb-4">Specialista in Cardiologia. Esperto in ecocardiografia e diagnostica cardiologica non invasiva.</p>
                        <a href="/equipe/tonino-bullitta/" class="text-sm font-semibold hover:underline" style="color: #E53935;">Visualizza Profilo <i class="fas fa-arrow-right ml-1"></i></a>
                    </div>
                </div>
                
                <!-- Dott.ssa Sara Uras -->
                <div class="team-card shadow-md">
                    <div class="p-6">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold" style="background: linear-gradient(135deg, #EF5350 0%, #E53935 100%);">SU</div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-900">Dott.ssa Sara Uras</h3>
                                <p class="text-sm" style="color: #E53935;">Cardiologa</p>
                                <p class="text-xs text-gray-400">Albo Medici Sassari n. 5084</p>
                            </div>
                        </div>
                        <p class="text-gray-600 text-sm mb-4">Specialista in Cardiologia. Esperta in ecocardiografia e diagnostica cardiovascolare non invasiva.</p>
                        <a href="/equipe/sara-uras/" class="text-sm font-semibold hover:underline" style="color: #E53935;">Visualizza Profilo <i class="fas fa-arrow-right ml-1"></i></a>
                    </div>
                </div>
                
                <!-- Dott.ssa Giuliana Guagnozzi -->
                <div class="team-card shadow-md">
                    <div class="p-6">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold" style="background: linear-gradient(135deg, #EF5350 0%, #E53935 100%);">GG</div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-900">Dott.ssa Giuliana Guagnozzi</h3>
                                <p class="text-sm" style="color: #E53935;">Cardiologa</p>
                                <p class="text-xs text-gray-400">Albo Medici n. 42447</p>
                            </div>
                        </div>
                        <p class="text-gray-600 text-sm mb-4">Specialista in Cardiologia. Esperta in prevenzione cardiovascolare e diagnostica cardiologica avanzata.</p>
                        <a href="/equipe/giuliana-guagnozzi/" class="text-sm font-semibold hover:underline" style="color: #E53935;">Visualizza Profilo <i class="fas fa-arrow-right ml-1"></i></a>
                    </div>
                </div>
                
                <!-- Dott. Paolo Pischedda -->
                <div class="team-card shadow-md">
                    <div class="p-6">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold" style="background: linear-gradient(135deg, #EF5350 0%, #E53935 100%);">PP</div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-900">Dott. Paolo Pischedda</h3>
                                <p class="text-sm" style="color: #E53935;">Cardiologo</p>
                                <p class="text-xs text-gray-400">Albo Medici Sassari n. 5264</p>
                            </div>
                        </div>
                        <p class="text-gray-600 text-sm mb-4">Specialista in Cardiologia. Esperto in Holter ECG e pressorio, Eco-Doppler TSA, test da sforzo e diagnostica cardiovascolare.</p>
                        <div class="flex flex-wrap gap-1 mb-3">
                            <span class="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded">Holter ECG</span>
                            <span class="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded">Holter Pressorio</span>
                            <span class="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded">TSA</span>
                            <span class="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded">Test da Sforzo</span>
                        </div>
                        <a href="/equipe/paolo-pischedda/" class="text-sm font-semibold hover:underline" style="color: #E53935;">Visualizza Profilo <i class="fas fa-arrow-right ml-1"></i></a>
                    </div>
                </div>
                
                <!-- Dott. Paolo Franca -->
                <div class="team-card shadow-md">
                    <div class="p-6">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold" style="background: linear-gradient(135deg, #EF5350 0%, #E53935 100%);">PF</div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-900">Dott. Paolo Franca</h3>
                                <p class="text-sm" style="color: #E53935;">Cardiologo</p>
                                <p class="text-xs text-gray-400">Albo Medici Sassari n. 6108</p>
                            </div>
                        </div>
                        <p class="text-gray-600 text-sm mb-4">Specialista in Cardiologia. Esperto in Holter ECG e pressorio, Eco-Doppler TSA, test da sforzo e prevenzione cardiovascolare.</p>
                        <div class="flex flex-wrap gap-1 mb-3">
                            <span class="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded">Holter ECG</span>
                            <span class="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded">Holter Pressorio</span>
                            <span class="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded">TSA</span>
                            <span class="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded">Test da Sforzo</span>
                        </div>
                        <a href="/equipe/paolo-franca/" class="text-sm font-semibold hover:underline" style="color: #E53935;">Visualizza Profilo <i class="fas fa-arrow-right ml-1"></i></a>
                    </div>
                </div>
            </div>
        </div>
    </section>
"""

# Salvo prima parte
with open('/tmp/hub_part1.html', 'w') as f:
    f.write(main_content)
print(f"Part 1: {len(main_content)} chars written")
