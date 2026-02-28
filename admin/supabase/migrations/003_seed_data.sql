-- ============================================================================
-- 003: Seed Data — Bio-Clinic Admin Panel
-- ============================================================================
-- Generated: 2026-02-28
-- Source: site/data/ JSON files
-- Records: 1282 total
-- ============================================================================

BEGIN;

-- Disable triggers during bulk insert for performance
ALTER TABLE specialties DISABLE TRIGGER tr_specialties_audit;
ALTER TABLE physicians DISABLE TRIGGER tr_physicians_audit;
ALTER TABLE procedures DISABLE TRIGGER tr_procedures_audit;
ALTER TABLE lab_tests DISABLE TRIGGER tr_lab_tests_audit;
ALTER TABLE packs DISABLE TRIGGER tr_packs_audit;
ALTER TABLE pathways DISABLE TRIGGER tr_pathways_audit;



-- ============================================
-- Specialties (from specialties.json)
-- ============================================

INSERT INTO specialties (id, name, slug, icon, description_short, page_config, menu_order, status)
VALUES (
  'ginecologia',
  'Ginecologia e Ostetricia',
  'ginecologia',
  'female',
  'Visite ginecologiche, ecografie, PMA, diagnostica prenatale, trattamenti rigenerativi',
  '{"main_procedures": ["visita-ginecologica", "ecografia-ginecologica", "ecografia-ostetrica-3d-4d", "monitoraggio-follicolare", "colposcopia", "pap-test"], "main_tests": ["pap-test", "hpv-test", "tampone-vaginale", "beta-hcg"], "physicians": ["salvatore-dessole", "francesco-dessole", "margherita-dessole", "maddalena-pola", "marco-petrillo", "antonella-pruneddu"], "related_pathways": ["pma-fertilita", "slim-care-donna"], "keywords": ["ginecologo", "ginecologia", "ostetrica", "gravidanza", "pap test", "ecografia", "utero", "ovaie", "menopausa", "ciclo"]}'::JSONB,
  1,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  page_config = EXCLUDED.page_config,
  updated_at = NOW();

INSERT INTO specialties (id, name, slug, icon, description_short, page_config, menu_order, status)
VALUES (
  'cardiologia',
  'Cardiologia',
  'cardiologia',
  'heart',
  'ECG, ecocardiogramma, Holter, ecocolordoppler, test da sforzo, check-up cardiovascolare',
  '{"main_procedures": ["visita-cardiologica", "ecg", "ecocardiogramma", "holter-ecg", "holter-pressorio", "eco-doppler-tsa"], "main_tests": ["profilo-lipidico", "troponina", "bnp", "d-dimero"], "physicians": ["tonino-bullitta", "sara-uras", "giuliana-guagnozzi", "paolo-pischedda", "paolo-franca"], "related_pathways": ["checkup-cardiovascolare"], "keywords": ["cardiologo", "cardiologia", "cuore", "ecg", "elettrocardiogramma", "holter", "pressione", "aritmia", "tachicardia", "infarto"]}'::JSONB,
  2,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  page_config = EXCLUDED.page_config,
  updated_at = NOW();

INSERT INTO specialties (id, name, slug, icon, description_short, page_config, menu_order, status)
VALUES (
  'endocrinologia',
  'Endocrinologia',
  'endocrinologia',
  'thyroid',
  'Tiroide, diabete, obesità, metabolismo, Slim Care con Wegovy e Mounjaro',
  '{"main_procedures": ["visita-endocrinologica", "ecografia-tiroidea", "visita-diabetologica", "visita-obesita"], "main_tests": ["tsh", "ft3", "ft4", "anti-tpo", "anti-tg", "glicemia", "emoglobina-glicata", "insulina"], "physicians": ["francesco-tolu", "irene-aini"], "related_pathways": ["slim-care", "slim-care-donna", "checkup-tiroide"], "keywords": ["endocrinologo", "endocrinologia", "tiroide", "diabete", "obesità", "dimagrire", "peso", "metabolismo", "ormoni", "tsh"]}'::JSONB,
  3,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  page_config = EXCLUDED.page_config,
  updated_at = NOW();

INSERT INTO specialties (id, name, slug, icon, description_short, page_config, menu_order, status)
VALUES (
  'dermatologia',
  'Dermatologia e Venereologia',
  'dermatologia',
  'skin',
  'Visite dermatologiche, mappatura nevi, dermatoscopia digitale, patologie cutanee',
  '{"main_procedures": ["visita-dermatologica", "mappatura-nevi", "dermatoscopia-digitale", "asportazione-neoformazioni"], "main_tests": ["patch-test", "prick-test"], "physicians": ["giovanna-costa"], "keywords": ["dermatologo", "dermatologia", "pelle", "nevi", "nei", "melanoma", "acne", "psoriasi", "eczema", "allergia"]}'::JSONB,
  4,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  page_config = EXCLUDED.page_config,
  updated_at = NOW();

INSERT INTO specialties (id, name, slug, icon, description_short, page_config, menu_order, status)
VALUES (
  'laboratorio',
  'Laboratorio Analisi',
  'laboratorio',
  'lab',
  'Oltre 1.162 esami, analisi del sangue, esami allergologici, test genetici, marcatori tumorali',
  '{"main_tests": ["emocromo", "glicemia", "profilo-lipidico", "tsh", "psa", "ige-specifiche", "spermiogramma"], "physicians": ["cinzia-guarino", "gloria-reggiani", "sara-meloni", "gabriele-delogu"], "related_pathways": ["checkup-base", "checkup-donna", "checkup-uomo", "checkup-tiroide"], "keywords": ["analisi", "esami", "sangue", "laboratorio", "prelievo", "emocromo", "glicemia", "colesterolo"]}'::JSONB,
  5,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  page_config = EXCLUDED.page_config,
  updated_at = NOW();

INSERT INTO specialties (id, name, slug, icon, description_short, page_config, menu_order, status)
VALUES (
  'neurologia',
  'Neurologia',
  'neurologia',
  'brain',
  'Visite neurologiche, elettromiografia, elettroencefalogramma, cefalee, neuropatie',
  '{"main_procedures": ["visita-neurologica", "elettromiografia", "elettroencefalogramma", "potenziali-evocati"], "keywords": ["neurologo", "neurologia", "cervello", "nervi", "mal di testa", "cefalea", "emicrania", "vertigini", "formicolio"]}'::JSONB,
  6,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  page_config = EXCLUDED.page_config,
  updated_at = NOW();

INSERT INTO specialties (id, name, slug, icon, description_short, page_config, menu_order, status)
VALUES (
  'oculistica',
  'Oculistica',
  'oculistica',
  'eye',
  'Visite oculistiche, OCT, campo visivo, tonometria, fondo oculare',
  '{"main_procedures": ["visita-oculistica", "oct", "campo-visivo", "tonometria", "fondo-oculare", "pachimetria"], "keywords": ["oculista", "oculistica", "occhi", "vista", "visione", "miopia", "cataratta", "glaucoma", "retina"]}'::JSONB,
  7,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  page_config = EXCLUDED.page_config,
  updated_at = NOW();

INSERT INTO specialties (id, name, slug, icon, description_short, page_config, menu_order, status)
VALUES (
  'ortopedia',
  'Ortopedia e Traumatologia',
  'ortopedia',
  'bone',
  'Visite ortopediche, ecografia muscolo-tendinea, infiltrazioni, medicina dello sport',
  '{"main_procedures": ["visita-ortopedica", "ecografia-muscolo-tendinea", "infiltrazioni-articolari", "valutazione-posturale"], "physicians": ["giorgio-chiarelli"], "keywords": ["ortopedico", "ortopedia", "ossa", "articolazioni", "ginocchio", "spalla", "schiena", "colonna", "ernia", "trauma"]}'::JSONB,
  8,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  page_config = EXCLUDED.page_config,
  updated_at = NOW();

INSERT INTO specialties (id, name, slug, icon, description_short, page_config, menu_order, status)
VALUES (
  'nutrizione',
  'Nutrizione Clinica',
  'nutrizione',
  'nutrition',
  'Visite nutrizionali, piani alimentari personalizzati, composizione corporea',
  '{"main_procedures": ["visita-nutrizionale", "piano-alimentare", "visbody-scan"], "main_tests": ["profilo-metabolico", "intolleranze-alimentari"], "physicians": ["antonella-galatino", "alessandro-pandolfi"], "related_pathways": ["slim-care", "slim-care-donna"], "keywords": ["nutrizionista", "nutrizione", "dieta", "alimentazione", "peso", "dimagrire", "intolleranze"]}'::JSONB,
  9,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  page_config = EXCLUDED.page_config,
  updated_at = NOW();

INSERT INTO specialties (id, name, slug, icon, description_short, page_config, menu_order, status)
VALUES (
  'medicina-sport',
  'Medicina dello Sport',
  'medicina-sport',
  'sport',
  'Certificati medico-sportivi, test da sforzo, valutazione atletica',
  '{"main_procedures": ["visita-medicina-sport", "certificato-sportivo-agonistico", "certificato-sportivo-non-agonistico", "test-sforzo"], "physicians": ["giorgio-chiarelli"], "related_pathways": ["slim-care"], "keywords": ["medicina sportiva", "certificato", "sport", "agonistico", "palestra", "fitness"]}'::JSONB,
  10,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  page_config = EXCLUDED.page_config,
  updated_at = NOW();

INSERT INTO specialties (id, name, slug, icon, description_short, page_config, menu_order, status)
VALUES (
  'ostetricia',
  'Ostetricia',
  'ostetricia',
  'baby',
  'Assistenza gravidanza, ecografie ostetriche, corsi preparto, monitoraggio fetale',
  '{"main_procedures": ["ecografia-ostetrica-3d-4d", "monitoraggio-fetale", "amniocentesi", "villocentesi"], "main_tests": ["bi-test", "prenatal-advance", "toxoplasmosi", "rosolia", "citomegalovirus"], "physicians": ["angelica-fois", "camilla-ruzzoli"], "related_pathways": ["pma-fertilita"], "keywords": ["ostetrica", "gravidanza", "parto", "feto", "ecografia morfologica", "amniocentesi", "preparto"]}'::JSONB,
  11,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  page_config = EXCLUDED.page_config,
  updated_at = NOW();


-- ============================================
-- Physicians (from physicians-complete.json)
-- ============================================

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'francesco-dessole',
  'Dott.'::physician_title,
  'Francesco',
  'Dessole',
  'ginecologia',
  '{}'::TEXT[],
  'Ginecologo',
  '{"Medico Rif. Slim Care Donna"}'::TEXT[],
  'Ginecologo specializzato in PCOS, menopausa e gestione del peso femminile. Medico di riferimento per il percorso Slim Care Donna.',
  NULL,
  true,
  'https://www.miodottore.it/francesco-dessole/ginecologo/sassari',
  'francesco-dessole',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/francesco-dessole/ginecologo/sassari" rel="nofollow" data-zlw-doctor="francesco-dessole" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Francesco Dessole - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'salvatore-dessole',
  'Prof.'::physician_title,
  'Salvatore',
  'Dessole',
  'ginecologia',
  '{}'::TEXT[],
  'Direttore Sanitario - Ginecologo Senior',
  '{"Direttore Sanitario"}'::TEXT[],
  'Professore Emerito, fondatore di Bio-Clinic, oltre 40 anni di esperienza in ginecologia e ostetricia. Punto di riferimento per la medicina della riproduzione in Sardegna.',
  NULL,
  true,
  'https://www.miodottore.it/salvatore-dessole/ginecologo/sassari',
  'salvatore-dessole',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/salvatore-dessole/ginecologo/sassari" rel="nofollow" data-zlw-doctor="salvatore-dessole" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Prof. Salvatore Dessole - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'maddalena-pola',
  'Dott.ssa'::physician_title,
  'Maddalena',
  'Pola',
  'ginecologia',
  '{}'::TEXT[],
  'Ginecologa',
  '{}'::TEXT[],
  'Ginecologa specializzata in ginecologia generale e prevenzione femminile.',
  NULL,
  true,
  'https://www.miodottore.it/maddalena-pola/ginecologo/sassari',
  'maddalena-pola',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/maddalena-pola/ginecologo/sassari" rel="nofollow" data-zlw-doctor="maddalena-pola" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Maddalena Pola - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'marco-petrillo',
  'Prof.'::physician_title,
  'Marco',
  'Petrillo',
  'ginecologia',
  '{}'::TEXT[],
  'Ginecologo',
  '{}'::TEXT[],
  'Ginecologo specializzato in medicina della riproduzione e PMA.',
  NULL,
  true,
  'https://www.miodottore.it/marco-petrillo-3/ginecologo/sassari',
  'marco-petrillo-3',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/marco-petrillo-3/ginecologo/sassari" rel="nofollow" data-zlw-doctor="marco-petrillo-3" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Prof. Marco Petrillo - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'antonella-pruneddu',
  'Dott.ssa'::physician_title,
  'Antonella',
  'Pruneddu',
  'ginecologia',
  '{}'::TEXT[],
  'Ginecologa',
  '{}'::TEXT[],
  'Ginecologa specializzata in ginecologia generale.',
  NULL,
  true,
  'https://www.miodottore.it/antonella-pruneddu/ginecologo/sassari',
  'antonella-pruneddu',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/antonella-pruneddu/ginecologo/sassari" rel="nofollow" data-zlw-doctor="antonella-pruneddu" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Antonella Pruneddu - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'sonia-bove',
  'Dott.ssa'::physician_title,
  'Sonia',
  'Bove',
  'ginecologia',
  '{}'::TEXT[],
  'Ginecologa - Senologa',
  '{}'::TEXT[],
  'Ginecologa e Senologa specializzata nella prevenzione e diagnosi delle patologie mammarie.',
  NULL,
  true,
  'https://www.miodottore.it/sonia-bove/ginecologo-senologo/sassari',
  'sonia-bove',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/sonia-bove/ginecologo-senologo/sassari" rel="nofollow" data-zlw-doctor="sonia-bove" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Sonia Bove - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'margherita-dessole',
  'Dott.ssa'::physician_title,
  'Margherita',
  'Dessole',
  'ginecologia',
  '{}'::TEXT[],
  'Ginecologa',
  '{}'::TEXT[],
  'Ginecologa con esperienza in ostetricia e ginecologia generale.',
  NULL,
  true,
  'https://www.miodottore.it/margherita-dessole/ginecologo/sassari',
  'margherita-dessole',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/margherita-dessole/ginecologo/sassari" rel="nofollow" data-zlw-doctor="margherita-dessole" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Margherita Dessole - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'angelica-fois',
  'Dott.ssa'::physician_title,
  'Angelica',
  'Fois',
  'ostetricia',
  '{}'::TEXT[],
  'Ostetrica',
  '{}'::TEXT[],
  'Ostetrica specializzata in assistenza alla gravidanza, parto e percorsi PMA.',
  NULL,
  true,
  'https://www.miodottore.it/angelica-fois/ostetrica/sassari',
  'angelica-fois',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/angelica-fois/ostetrica/sassari" rel="nofollow" data-zlw-doctor="angelica-fois" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Angelica Fois - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'tonino-bullitta',
  'Dr.'::physician_title,
  'Tonino',
  'Bullitta',
  'cardiologia',
  '{}'::TEXT[],
  'Cardiologo',
  '{}'::TEXT[],
  'Cardiologo specializzato in ecocolordoppler cardiaco, ECG Holter 24h, screening cardiologico pediatrico.',
  NULL,
  true,
  'https://www.miodottore.it/tonino-bullitta/cardiologo/sassari',
  'tonino-bullitta',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/tonino-bullitta/cardiologo/sassari" rel="nofollow" data-zlw-doctor="tonino-bullitta" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dr. Tonino Bullitta - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'sara-uras',
  'Dott.ssa'::physician_title,
  'Sara',
  'Uras',
  'cardiologia',
  '{}'::TEXT[],
  'Cardiologa',
  '{}'::TEXT[],
  'Cardiologa specializzata in diagnostica cardiologica non invasiva.',
  NULL,
  true,
  'https://www.miodottore.it/sara-uras/cardiologo/sassari',
  'sara-uras',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/sara-uras/cardiologo/sassari" rel="nofollow" data-zlw-doctor="sara-uras" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Sara Uras - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'paolo-pischedda',
  'Dott.'::physician_title,
  'Paolo',
  'Pischedda',
  'cardiologia',
  '{}'::TEXT[],
  'Cardiologo',
  '{}'::TEXT[],
  'Cardiologo specializzato in diagnostica cardiologica.',
  NULL,
  true,
  'https://www.miodottore.it/paolo-pischedda/cardiologo/sassari',
  'paolo-pischedda',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/paolo-pischedda/cardiologo/sassari" rel="nofollow" data-zlw-doctor="paolo-pischedda" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Paolo Pischedda - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'paolo-franca',
  'Dott.'::physician_title,
  'Paolo',
  'Franca',
  'cardiologia',
  '{}'::TEXT[],
  'Cardiologo',
  '{}'::TEXT[],
  'Cardiologo specializzato in diagnostica cardiologica.',
  NULL,
  true,
  'https://www.miodottore.it/paolo-franca/cardiologo/sassari',
  'paolo-franca',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/paolo-franca/cardiologo/sassari" rel="nofollow" data-zlw-doctor="paolo-franca" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Paolo Franca - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'giovanna-costa',
  'Dott.ssa'::physician_title,
  'Giovanna',
  'Costa',
  'dermatologia',
  '{}'::TEXT[],
  'Dermatologa',
  '{}'::TEXT[],
  'Dermatologa specializzata in dermatoscopia, mappatura nevi e patologie cutanee.',
  NULL,
  true,
  'https://www.miodottore.it/giovanna-costa-2/dermatologo/sassari',
  'giovanna-costa-2',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/giovanna-costa-2/dermatologo/sassari" rel="nofollow" data-zlw-doctor="giovanna-costa-2" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Giovanna Costa - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'alessandra-musinu',
  'Dott.ssa'::physician_title,
  'Alessandra',
  'Musinu',
  'dermatologia',
  '{}'::TEXT[],
  'Dermatologa',
  '{}'::TEXT[],
  'Dermatologa specializzata in patologie cutanee e dermatologia estetica.',
  NULL,
  true,
  'https://www.miodottore.it/alessandra-musinu/dermatologo/sassari',
  'alessandra-musinu',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/alessandra-musinu/dermatologo/sassari" rel="nofollow" data-zlw-doctor="alessandra-musinu" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Alessandra Musinu - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'speranza-anedda',
  'Dott.ssa'::physician_title,
  'Speranza',
  'Anedda',
  'dermatologia',
  '{}'::TEXT[],
  'Dermatologa',
  '{}'::TEXT[],
  'Dermatologa specializzata in patologie cutanee.',
  NULL,
  true,
  'https://www.miodottore.it/speranza-anedda/dermatologo/ossi',
  'speranza-anedda',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/speranza-anedda/dermatologo/ossi" rel="nofollow" data-zlw-doctor="speranza-anedda" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Speranza Anedda - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'carlo-burrai',
  'Dr.'::physician_title,
  'Carlo',
  'Burrai',
  'endocrinologia',
  '{}'::TEXT[],
  'Endocrinologo - Pediatra',
  '{}'::TEXT[],
  'Endocrinologo e Pediatra specializzato in patologie tiroidee e metaboliche pediatriche.',
  NULL,
  true,
  'https://www.miodottore.it/carlo-burrai/endocrinologo-pediatra/sassari',
  'carlo-burrai',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/carlo-burrai/endocrinologo-pediatra/sassari" rel="nofollow" data-zlw-doctor="carlo-burrai" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dr. Carlo Burrai - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'fabrizia-caucci',
  'Dott.ssa'::physician_title,
  'Fabrizia',
  'Caucci',
  'endocrinologia',
  '{}'::TEXT[],
  'Diabetologa - Endocrinologa',
  '{}'::TEXT[],
  'Diabetologa ed Endocrinologa specializzata in diabete e patologie metaboliche.',
  NULL,
  true,
  'https://www.miodottore.it/fabrizia-caucci/diabetologo-endocrinologo/sassari',
  'fabrizia-caucci',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/fabrizia-caucci/diabetologo-endocrinologo/sassari" rel="nofollow" data-zlw-doctor="fabrizia-caucci" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Fabrizia Caucci - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'francesco-tolu',
  'Dr.'::physician_title,
  'Francesco',
  'Tolu',
  'endocrinologia',
  '{}'::TEXT[],
  'Endocrinologo',
  '{"Responsabile Slim Care"}'::TEXT[],
  'Endocrinologo specializzato in tiroide, diabete, obesità e responsabile del percorso Slim Care con Wegovy e Mounjaro.',
  NULL,
  true,
  'https://www.miodottore.it/francesco-tolu/endocrinologo/sassari',
  'francesco-tolu',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/francesco-tolu/endocrinologo/sassari" rel="nofollow" data-zlw-doctor="francesco-tolu" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dr. Francesco Tolu - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'irene-aini',
  'Dott.ssa'::physician_title,
  'Irene',
  'Aini',
  'endocrinologia',
  '{}'::TEXT[],
  'Endocrinologa',
  '{}'::TEXT[],
  'Endocrinologa specializzata in patologie tiroidee e metaboliche.',
  NULL,
  true,
  'https://www.miodottore.it/irene-aini/endocrinologo/sassari',
  'irene-aini',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/irene-aini/endocrinologo/sassari" rel="nofollow" data-zlw-doctor="irene-aini" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Irene Aini - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'guido-marongiu',
  'Dott.'::physician_title,
  'Guido',
  'Marongiu',
  'neurologia',
  '{}'::TEXT[],
  'Neurologo',
  '{}'::TEXT[],
  'Neurologo specializzato in patologie neurologiche e cefalee.',
  NULL,
  true,
  'https://www.miodottore.it/guido-marongiu/neurologo/sassari',
  'guido-marongiu',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/guido-marongiu/neurologo/sassari" rel="nofollow" data-zlw-doctor="guido-marongiu" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Guido Marongiu - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'sebastiano-traccis',
  'Dott.'::physician_title,
  'Sebastiano',
  'Traccis',
  'neurologia',
  '{}'::TEXT[],
  'Neurologo',
  '{}'::TEXT[],
  'Neurologo con esperienza in patologie neurologiche.',
  NULL,
  true,
  'https://www.miodottore.it/sebastiano-traccis/neurologo/sassari',
  'sebastiano-traccis',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/sebastiano-traccis/neurologo/sassari" rel="nofollow" data-zlw-doctor="sebastiano-traccis" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Sebastiano Traccis - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'maria-pina-pintus',
  'Dott.ssa'::physician_title,
  'Maria',
  'Pina Pintus',
  'oculistica',
  '{}'::TEXT[],
  'Oculista',
  '{}'::TEXT[],
  'Oculista con esperienza in patologie oculari e medicina generale.',
  NULL,
  true,
  'https://www.miodottore.it/maria-pina-pintus/medico-di-base-oculista/sassari',
  'maria-pina-pintus',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/maria-pina-pintus/medico-di-base-oculista/sassari" rel="nofollow" data-zlw-doctor="maria-pina-pintus" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Maria Pina Pintus - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'francesco-santoru',
  'Dott.'::physician_title,
  'Francesco',
  'Santoru',
  'oculistica',
  '{}'::TEXT[],
  'Oculista',
  '{}'::TEXT[],
  'Oculista specializzato.',
  NULL,
  true,
  'https://www.miodottore.it/francesco-santoru/oculista/sassari',
  'francesco-santoru',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/francesco-santoru/oculista/sassari" rel="nofollow" data-zlw-doctor="francesco-santoru" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Francesco Santoru - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'matteo-zucca',
  'Dott.'::physician_title,
  'Matteo',
  'Zucca',
  'oculistica',
  '{}'::TEXT[],
  'Oculista',
  '{}'::TEXT[],
  'Oculista specializzato.',
  NULL,
  true,
  'https://www.miodottore.it/matteo-zucca/oculista/sassari',
  'matteo-zucca',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/matteo-zucca/oculista/sassari" rel="nofollow" data-zlw-doctor="matteo-zucca" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Matteo Zucca - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'francesco-bussu',
  'Prof.'::physician_title,
  'Francesco',
  'Bussu',
  'otorinolaringoiatria',
  '{}'::TEXT[],
  'Otorinolaringoiatra',
  '{}'::TEXT[],
  'Otorinolaringoiatra specializzato in patologie ORL e chirurgia.',
  NULL,
  true,
  'https://www.miodottore.it/francesco-bussu/otorino/sassari',
  'francesco-bussu',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/francesco-bussu/otorino/sassari" rel="nofollow" data-zlw-doctor="francesco-bussu" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Prof. Francesco Bussu - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'maria-laura-de-luca',
  'Dott.ssa'::physician_title,
  'Maria',
  'Laura De Luca',
  'otorinolaringoiatria',
  '{}'::TEXT[],
  'Otorinolaringoiatra',
  '{}'::TEXT[],
  'Otorinolaringoiatra specializzata in patologie ORL.',
  NULL,
  true,
  'https://www.miodottore.it/maria-laura-de-luca/otorino/sassari',
  'maria-laura-de-luca',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/maria-laura-de-luca/otorino/sassari" rel="nofollow" data-zlw-doctor="maria-laura-de-luca" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Maria Laura De Luca - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'andrea-donato',
  'Dott.'::physician_title,
  'Andrea',
  'Donato',
  'ortopedia',
  '{}'::TEXT[],
  'Ortopedico',
  '{}'::TEXT[],
  'Ortopedico specializzato in patologie muscolo-scheletriche.',
  NULL,
  true,
  'https://www.miodottore.it/andrea-donato-2/ortopedico/arzachena',
  'andrea-donato-2',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/andrea-donato-2/ortopedico/arzachena" rel="nofollow" data-zlw-doctor="andrea-donato-2" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Andrea Donato - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'pietro-lisai',
  'Dott.'::physician_title,
  'Pietro',
  'Lisai',
  'ortopedia',
  '{}'::TEXT[],
  'Ortopedico',
  '{}'::TEXT[],
  'Ortopedico specializzato in patologie muscolo-scheletriche e traumatologia.',
  NULL,
  true,
  'https://www.miodottore.it/pietro-lisai/ortopedico/sassari',
  'pietro-lisai',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/pietro-lisai/ortopedico/sassari" rel="nofollow" data-zlw-doctor="pietro-lisai" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Pietro Lisai - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'angelo-deplano',
  'Dott.'::physician_title,
  'Angelo',
  'Deplano',
  'gastroenterologia',
  '{}'::TEXT[],
  'Gastroenterologo - Epatologo',
  '{}'::TEXT[],
  'Gastroenterologo ed Epatologo specializzato in patologie dell''apparato digerente e del fegato.',
  NULL,
  true,
  'https://www.miodottore.it/angelo-deplano/gastroenterologo-epatologo/sassari',
  'angelo-deplano',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/angelo-deplano/gastroenterologo-epatologo/sassari" rel="nofollow" data-zlw-doctor="angelo-deplano" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Angelo Deplano - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'antonio-solinas',
  'Prof.'::physician_title,
  'Antonio',
  'Solinas',
  'medicina-interna',
  '{}'::TEXT[],
  'Internista - Epatologo',
  '{}'::TEXT[],
  'Internista ed Epatologo specializzato in medicina interna e patologie epatiche.',
  NULL,
  true,
  'https://www.miodottore.it/antonio-solinas-3/epatologo-internista/sassari',
  'antonio-solinas-3',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/antonio-solinas-3/epatologo-internista/sassari" rel="nofollow" data-zlw-doctor="antonio-solinas-3" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Prof. Antonio Solinas - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'paolo-dessole',
  'Dott.'::physician_title,
  'Paolo',
  'Dessole',
  'nefrologia',
  '{}'::TEXT[],
  'Nefrologo',
  '{}'::TEXT[],
  'Nefrologo specializzato in patologie renali.',
  NULL,
  true,
  'https://www.miodottore.it/paolo-dessole/nefrologo/sassari',
  'paolo-dessole',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/paolo-dessole/nefrologo/sassari" rel="nofollow" data-zlw-doctor="paolo-dessole" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Paolo Dessole - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'sergio-paolo-sotgia',
  'Dott.'::physician_title,
  'Sergio',
  'Paolo Sotgia',
  'nefrologia',
  '{}'::TEXT[],
  'Nefrologo',
  '{}'::TEXT[],
  'Nefrologo con esperienza in patologie renali.',
  NULL,
  true,
  'https://www.miodottore.it/sergio-paolo-sotgia/nefrologo/sassari',
  'sergio-paolo-sotgia',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/sergio-paolo-sotgia/nefrologo/sassari" rel="nofollow" data-zlw-doctor="sergio-paolo-sotgia" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Sergio Paolo Sotgia - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'pietro-pirina',
  'Prof.'::physician_title,
  'Pietro',
  'Pirina',
  'pneumologia',
  '{}'::TEXT[],
  'Pneumologo',
  '{}'::TEXT[],
  'Pneumologo specializzato in patologie respiratorie.',
  NULL,
  true,
  'https://www.miodottore.it/pietro-pirina/pneumologo/sassari',
  'pietro-pirina',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/pietro-pirina/pneumologo/sassari" rel="nofollow" data-zlw-doctor="pietro-pirina" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Prof. Pietro Pirina - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'luigi-podda',
  'Dott.'::physician_title,
  'Luigi',
  'Podda',
  'ematologia',
  '{}'::TEXT[],
  'Ematologo',
  '{}'::TEXT[],
  'Ematologo specializzato in patologie del sangue.',
  NULL,
  true,
  'https://www.miodottore.it/luigi-podda/ematologo/sassari',
  'luigi-podda',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/luigi-podda/ematologo/sassari" rel="nofollow" data-zlw-doctor="luigi-podda" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Luigi Podda - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'daniele-sabiu',
  'Dr.'::physician_title,
  'Daniele',
  'Sabiu',
  'ematologia',
  '{}'::TEXT[],
  'Ematologo',
  '{}'::TEXT[],
  'Ematologo con esperienza in patologie ematologiche.',
  NULL,
  true,
  'https://www.miodottore.it/daniele-sabiu/ematologo/sassari',
  'daniele-sabiu',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/daniele-sabiu/ematologo/sassari" rel="nofollow" data-zlw-doctor="daniele-sabiu" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dr. Daniele Sabiu - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'niccolo-melis',
  'Dott.'::physician_title,
  'Niccolò',
  'Melis',
  'reumatologia',
  '{}'::TEXT[],
  'Reumatologo',
  '{}'::TEXT[],
  'Reumatologo specializzato in malattie reumatiche e autoimmuni.',
  NULL,
  true,
  'https://www.miodottore.it/niccolo-melis/reumatologo/cagliari',
  'niccolo-melis',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/niccolo-melis/reumatologo/cagliari" rel="nofollow" data-zlw-doctor="niccolo-melis" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Niccolò Melis - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'carlos-manuel-cambara-zuniga',
  'Dott.'::physician_title,
  'Carlos',
  'Manuel Cambara Zuniga',
  'urologia',
  '{}'::TEXT[],
  'Urologo - Andrologo',
  '{}'::TEXT[],
  'Urologo e Andrologo specializzato in patologie urologiche e andrologiche.',
  NULL,
  true,
  'https://www.miodottore.it/carlos-manuel-cambara-zuniga/urologo-andrologo/oristano',
  'carlos-manuel-cambara-zuniga',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/carlos-manuel-cambara-zuniga/urologo-andrologo/oristano" rel="nofollow" data-zlw-doctor="carlos-manuel-cambara-zuniga" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Carlos Manuel Cambara Zuniga - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'paola-dettori',
  'Dott.ssa'::physician_title,
  'Paola',
  'Dettori',
  'chirurgia-vascolare',
  '{}'::TEXT[],
  'Chirurgo Vascolare',
  '{}'::TEXT[],
  'Chirurgo Vascolare specializzata in patologie vascolari e venose.',
  NULL,
  true,
  'https://www.miodottore.it/paola-dettori/chirurgo-vascolare-chirurgo-generale/sassari',
  'paola-dettori',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/paola-dettori/chirurgo-vascolare-chirurgo-generale/sassari" rel="nofollow" data-zlw-doctor="paola-dettori" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Paola Dettori - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'roberto-mancino',
  'Dott.'::physician_title,
  'Roberto',
  'Mancino',
  'chirurgia-vascolare',
  '{}'::TEXT[],
  'Chirurgo Vascolare',
  '{}'::TEXT[],
  'Chirurgo Vascolare specializzato in patologie vascolari.',
  NULL,
  true,
  'https://www.miodottore.it/roberto-mancino/chirurgo-vascolare/sassari',
  'roberto-mancino',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/roberto-mancino/chirurgo-vascolare/sassari" rel="nofollow" data-zlw-doctor="roberto-mancino" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Roberto Mancino - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'antonio-michele-cavazzuti',
  'Dott.'::physician_title,
  'Antonio',
  'Michele Cavazzuti',
  'ecografia',
  '{}'::TEXT[],
  'Ecografista',
  '{}'::TEXT[],
  'Ecografista specializzato in diagnostica per immagini ecografiche.',
  NULL,
  true,
  'https://www.miodottore.it/antonio-michele-cavazzuti/ecografista/sassari',
  'antonio-michele-cavazzuti',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/antonio-michele-cavazzuti/ecografista/sassari" rel="nofollow" data-zlw-doctor="antonio-michele-cavazzuti" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Antonio Michele Cavazzuti - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'giorgio-chiarelli',
  'Dr.'::physician_title,
  'Giorgio',
  'Chiarelli',
  'medicina-sport',
  '{}'::TEXT[],
  'Medico dello Sport',
  '{}'::TEXT[],
  'Medico dello Sport specializzato in certificazioni sportive, test da sforzo e valutazioni atletiche.',
  NULL,
  true,
  'https://www.miodottore.it/giorgio-chiarelli-2/medico-dello-sport/sassari',
  'giorgio-chiarelli-2',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/giorgio-chiarelli-2/medico-dello-sport/sassari" rel="nofollow" data-zlw-doctor="giorgio-chiarelli-2" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dr. Giorgio Chiarelli - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'gianfranco-manchia',
  'Dott.'::physician_title,
  'Gianfranco',
  'Manchia',
  'medicina-lavoro',
  '{}'::TEXT[],
  'Medico Competente',
  '{}'::TEXT[],
  'Medico Competente specializzato in medicina del lavoro e sorveglianza sanitaria.',
  NULL,
  true,
  'https://www.miodottore.it/gianfranco-manchia/medico-competente/sassari',
  'gianfranco-manchia',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/gianfranco-manchia/medico-competente/sassari" rel="nofollow" data-zlw-doctor="gianfranco-manchia" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Gianfranco Manchia - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'nicola-frau',
  'Dott.'::physician_title,
  'Nicola',
  'Frau',
  'fisiatria',
  '{}'::TEXT[],
  'Fisiatra',
  '{}'::TEXT[],
  'Fisiatra specializzato in riabilitazione e medicina fisica.',
  NULL,
  true,
  'https://www.miodottore.it/nicola-frau/fisiatra/oristano',
  'nicola-frau',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/nicola-frau/fisiatra/oristano" rel="nofollow" data-zlw-doctor="nicola-frau" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott. Nicola Frau - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'mariolina-azara',
  'Dott.ssa'::physician_title,
  'Mariolina',
  'Azara',
  'pediatria',
  '{}'::TEXT[],
  'Pediatra',
  '{}'::TEXT[],
  'Pediatra specializzata nella cura dei bambini e degli adolescenti.',
  NULL,
  true,
  'https://www.miodottore.it/mariolina-azara/pediatra/sassari',
  'mariolina-azara',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/mariolina-azara/pediatra/sassari" rel="nofollow" data-zlw-doctor="mariolina-azara" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Mariolina Azara - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'alessia-piras',
  'Dott.ssa'::physician_title,
  'Alessia',
  'Piras',
  'psicologia',
  '{}'::TEXT[],
  'Psicoterapeuta',
  '{}'::TEXT[],
  'Psicoterapeuta e Psicologa Clinica specializzata in psicoterapia individuale e di coppia.',
  NULL,
  true,
  'https://www.miodottore.it/alessia-piras/psicoterapeuta-psicologo-psicologo-clinico/sassari',
  'alessia-piras',
  '<a id="zl-url" class="zl-url" href="https://www.miodottore.it/alessia-piras/psicoterapeuta-psicologo-psicologo-clinico/sassari" rel="nofollow" data-zlw-doctor="alessia-piras" data-zlw-type="button_calendar_medium" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="true" data-zlw-a11y-title="Widget di prenotazione visite mediche">Dott.ssa Alessia Piras - MioDottore.it</a>',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'giuliana-guagnozzi',
  'Dott.ssa'::physician_title,
  'Giuliana',
  'Guagnozzi',
  'cardiologia',
  '{}'::TEXT[],
  'Cardiologa',
  '{}'::TEXT[],
  'Cardiologa specializzata in diagnosi e cura delle patologie cardiovascolari.',
  NULL,
  false,
  NULL,
  NULL,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'alessandro-pandolfi',
  'Dott.'::physician_title,
  'Alessandro',
  'Pandolfi',
  'medicina-interna',
  '{}'::TEXT[],
  'Medico Internista',
  '{"Team Slim Care"}'::TEXT[],
  'Medico internista del team Slim Care.',
  NULL,
  false,
  NULL,
  NULL,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'antonella-galatino',
  'Dott.ssa'::physician_title,
  'Antonella',
  'Galatino',
  'nutrizione',
  '{}'::TEXT[],
  'Nutrizionista',
  '{"Team Slim Care"}'::TEXT[],
  'Nutrizionista clinica del team Slim Care.',
  NULL,
  false,
  NULL,
  NULL,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'cinzia-guarino',
  'Dott.ssa'::physician_title,
  'Cinzia',
  'Guarino',
  'laboratorio',
  '{}'::TEXT[],
  'Biologa - Laboratorio Analisi',
  '{}'::TEXT[],
  'Biologa del Laboratorio Analisi Bio-Clinic.',
  NULL,
  false,
  NULL,
  NULL,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();

INSERT INTO physicians (
  id, title, first_name, last_name, specialty_id, specialties_secondary,
  job_title, role_badges, bio_short, photo_url,
  booking_enabled, miodottore_url, miodottore_id, miodottore_widget_html,
  status
) VALUES (
  'gloria-reggiani',
  'Dott.ssa'::physician_title,
  'Gloria',
  'Reggiani',
  'laboratorio',
  '{}'::TEXT[],
  'Biologa - Laboratorio Analisi',
  '{}'::TEXT[],
  'Biologa del Laboratorio Analisi Bio-Clinic.',
  NULL,
  false,
  NULL,
  NULL,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialty_id = EXCLUDED.specialty_id,
  job_title = EXCLUDED.job_title,
  bio_short = EXCLUDED.bio_short,
  booking_enabled = EXCLUDED.booking_enabled,
  miodottore_url = EXCLUDED.miodottore_url,
  updated_at = NOW();


-- ============================================
-- Procedures (from procedures.json)
-- ============================================

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'visita-ginecologica',
  'Visita Ginecologica',
  'Visita Ginecologica Specialistica',
  'visita-ginecologica',
  'ginecologia',
  'visita'::procedure_category,
  'A'::page_type,
  'Valutazione completa della salute ginecologica femminile',
  'La visita ginecologica comprende anamnesi, esame obiettivo, eventuale ecografia transvaginale e pap-test. Consigliata annualmente per la prevenzione.',
  30,
  '{"controllo periodico", "disturbi mestruali", "dolore pelvico", "screening oncologico"}'::TEXT[],
  '{"ecografia-transvaginale", "pap-test", "colposcopia"}'::TEXT[],
  '{"ginecologo", "visita donna", "controllo femminile", "pap test", "utero"}'::TEXT[],
  'high',
  '/visita-ginecologica/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'ecografia-transvaginale',
  'Ecografia Transvaginale',
  'Ecografia Pelvica Transvaginale',
  'ecografia-transvaginale',
  'ginecologia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Esame ecografico per visualizzare utero, ovaie e strutture pelviche',
  'L''ecografia transvaginale permette una visualizzazione dettagliata degli organi pelvici femminili. Utilizzata per diagnosi, monitoraggio gravidanza e follow-up.',
  20,
  '{"monitoraggio ovarico", "studio endometrio", "cisti ovariche", "fibromi", "gravidanza iniziale"}'::TEXT[],
  '{"visita-ginecologica", "ecografia-mammaria"}'::TEXT[],
  '{"eco transvaginale", "ecografia utero", "eco ovaie", "ecografia pelvica"}'::TEXT[],
  'high',
  '/ecografia-transvaginale/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'ecografia-mammaria',
  'Ecografia Mammaria',
  'Ecografia Mammaria Bilaterale',
  'ecografia-mammaria',
  'ginecologia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Esame ecografico del seno per screening e diagnosi',
  'L''ecografia mammaria è un esame non invasivo per valutare noduli, cisti e alterazioni del tessuto mammario. Complementare alla mammografia.',
  20,
  '{"screening seno", "noduli mammari", "dolore mammario", "controllo periodico"}'::TEXT[],
  '{"visita-senologica", "ecografia-transvaginale"}'::TEXT[],
  '{"eco seno", "ecografia seno", "mammella", "nodulo seno"}'::TEXT[],
  'high',
  '/ecografia-mammaria/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'pap-test',
  'Pap Test',
  'Pap Test (Esame Citologico Cervicale)',
  'pap-test',
  'ginecologia',
  'esame'::procedure_category,
  'A'::page_type,
  'Screening per la prevenzione del tumore della cervice uterina',
  'Il Pap test è un esame di screening fondamentale per la prevenzione del carcinoma cervicale. Consigliato ogni 3 anni dopo i 25 anni.',
  10,
  '{"screening oncologico", "prevenzione HPV", "controllo cervicale"}'::TEXT[],
  '{"hpv-dna-test", "duopap", "colposcopia", "visita-ginecologica"}'::TEXT[],
  '{"pap test", "paptest", "pap-test", "test papanicolaou", "striscio cervicale", "screening cervice", "prevenzione tumore utero", "citologico"}'::TEXT[],
  'medium',
  '/pap-test/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'colposcopia',
  'Colposcopia',
  'Colposcopia Diagnostica',
  'colposcopia',
  'ginecologia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Esame visivo approfondito della cervice uterina',
  'La colposcopia permette di visualizzare in dettaglio la cervice uterina per identificare lesioni sospette dopo un Pap test anomalo.',
  20,
  '{"pap test anomalo", "lesioni cervicali", "follow-up HPV"}'::TEXT[],
  '{"pap-test", "biopsia-cervicale"}'::TEXT[],
  '{"colposcopio", "esame cervice", "biopsia collo utero"}'::TEXT[],
  'medium',
  '/colposcopia/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'visita-ostetrica',
  'Visita Ostetrica',
  'Visita Ostetrica in Gravidanza',
  'visita-ostetrica',
  'ostetricia',
  'visita'::procedure_category,
  'A'::page_type,
  'Controllo periodico della gravidanza e del benessere materno-fetale',
  'La visita ostetrica comprende valutazione della gestante, monitoraggio della crescita fetale, controllo pressione e peso. Fondamentale per una gravidanza sicura.',
  30,
  '{"gravidanza", "monitoraggio fetale", "controllo gestazionale"}'::TEXT[],
  '{"ecografia-ostetrica", "morfologica", "translucenza-nucale"}'::TEXT[],
  '{"gravidanza", "controllo gravidanza", "visita incinta", "ostetrica"}'::TEXT[],
  'high',
  '/ginecologia/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'ecografia-ostetrica',
  'Ecografia Ostetrica',
  'Ecografia Ostetrica di Controllo',
  'ecografia-ostetrica',
  'ostetricia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Monitoraggio ecografico della gravidanza',
  'L''ecografia ostetrica permette di visualizzare il feto, valutare la crescita, la quantità di liquido amniotico e la posizione placentare.',
  20,
  '{"monitoraggio gravidanza", "crescita fetale", "controllo trimestrale"}'::TEXT[],
  '{"visita-ostetrica", "morfologica"}'::TEXT[],
  '{"eco gravidanza", "ecografia feto", "ecografia gestazionale"}'::TEXT[],
  'high',
  '/ginecologia/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'ecografia-morfologica',
  'Ecografia Morfologica',
  'Ecografia Morfologica (II Livello)',
  'ecografia-morfologica',
  'ostetricia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Studio dettagliato dell''anatomia fetale tra la 19ª e 22ª settimana',
  'L''ecografia morfologica è l''esame più importante per valutare l''anatomia fetale, identificare eventuali malformazioni e confermare la normale crescita.',
  45,
  '{"screening malformazioni", "studio anatomia fetale", "20 settimane"}'::TEXT[],
  '{"translucenza-nucale", "ecografia-ostetrica"}'::TEXT[],
  '{"morfologica", "eco morfologica", "ecografia secondo trimestre", "anatomia feto"}'::TEXT[],
  'high',
  '/ecografia-morfologica/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'translucenza-nucale',
  'Translucenza Nucale',
  'Ecografia per Translucenza Nucale (NT)',
  'translucenza-nucale',
  'ostetricia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Screening del primo trimestre per anomalie cromosomiche',
  'La translucenza nucale misura lo spessore della plica nucale fetale tra l''11ª e la 14ª settimana. Combinata con il bitest, valuta il rischio di anomalie cromosomiche.',
  30,
  '{"screening sindrome di Down", "primo trimestre", "rischio cromosomico"}'::TEXT[],
  '{"bitest", "ecografia-ostetrica"}'::TEXT[],
  '{"NT", "plica nucale", "screening Down", "bitest"}'::TEXT[],
  'high',
  '/ginecologia/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'visita-cardiologica',
  'Visita Cardiologica',
  'Visita Cardiologica Specialistica con ECG',
  'visita-cardiologica',
  'cardiologia',
  'visita'::procedure_category,
  'A'::page_type,
  'Valutazione completa della salute cardiovascolare con ECG',
  'La visita cardiologica comprende anamnesi, esame obiettivo, misurazione pressione e valutazione del rischio cardiovascolare. Include sempre ECG a 12 derivazioni.',
  40,
  '{"ipertensione", "dolore toracico", "affanno", "palpitazioni", "prevenzione cardiovascolare"}'::TEXT[],
  '{"ecg", "ecocardiogramma", "holter-ecg"}'::TEXT[],
  '{"cuore", "cardiologo", "pressione alta", "tachicardia", "aritmia", "visita cuore", "controllo cuore"}'::TEXT[],
  'high',
  '/cardiologia/visita-cardiologica-ecg/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'ecg',
  'Elettrocardiogramma',
  'Elettrocardiogramma (ECG) a Riposo',
  'ecg',
  'cardiologia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Registrazione dell''attività elettrica del cuore',
  'L''ECG a riposo è un esame non invasivo che registra l''attività elettrica cardiaca. Utile per diagnosticare aritmie, ischemie e altre patologie cardiache.',
  10,
  '{"aritmie", "dolore toracico", "screening cardiaco", "pre-operatorio"}'::TEXT[],
  '{"visita-cardiologica", "holter-ecg"}'::TEXT[],
  '{"elettrocardiogramma", "ecg", "cuore elettrico", "tracciato cardiaco"}'::TEXT[],
  'medium',
  '/cardiologia/visita-cardiologica-ecg/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'ecocardiogramma',
  'Ecocardiogramma',
  'Ecocardiogramma Color-Doppler',
  'ecocardiogramma',
  'cardiologia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Ecografia del cuore per valutare struttura e funzione cardiaca',
  'L''ecocardiogramma è un esame ecografico che visualizza le camere cardiache, le valvole e la funzione contrattile. Fondamentale per diagnosi di cardiomiopatie e valvulopatie.',
  30,
  '{"soffio cardiaco", "insufficienza cardiaca", "valvulopatie", "cardiomiopatie"}'::TEXT[],
  '{"visita-cardiologica", "ecg"}'::TEXT[],
  '{"eco cuore", "ecografia cardiaca", "ecocardio", "valvole cuore"}'::TEXT[],
  'high',
  '/cardiologia/ecocardiogramma/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'holter-ecg',
  'Holter ECG 24h',
  'Monitoraggio Holter ECG 24 Ore',
  'holter-ecg',
  'cardiologia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Registrazione continua dell''ECG per 24 ore',
  'L''Holter ECG registra l''attività cardiaca per 24-48 ore, permettendo di identificare aritmie intermittenti non rilevabili con l''ECG standard.',
  15,
  '{"aritmie intermittenti", "palpitazioni", "sincope", "controllo terapia"}'::TEXT[],
  '{"ecg", "visita-cardiologica"}'::TEXT[],
  '{"holter", "monitoraggio cardiaco", "ECG 24 ore", "aritmie"}'::TEXT[],
  'medium',
  '/cardiologia/holter-ecg/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'holter-pressorio',
  'Holter Pressorio 24h',
  'Monitoraggio Pressorio Ambulatoriale 24 Ore (ABPM)',
  'holter-pressorio',
  'cardiologia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Misurazione automatica della pressione arteriosa per 24 ore',
  'L''Holter pressorio misura automaticamente la pressione arteriosa ogni 15-30 minuti per 24 ore, fornendo un profilo pressorio completo.',
  15,
  '{"ipertensione", "ipertensione da camice bianco", "controllo terapia antipertensiva"}'::TEXT[],
  '{"visita-cardiologica"}'::TEXT[],
  '{"pressione 24 ore", "ABPM", "monitoraggio pressione", "ipertensione"}'::TEXT[],
  'medium',
  '/cardiologia/holter-pressorio/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'visita-endocrinologica',
  'Visita Endocrinologica',
  'Visita Endocrinologica Specialistica',
  'visita-endocrinologica',
  'endocrinologia',
  'visita'::procedure_category,
  'A'::page_type,
  'Valutazione delle ghiandole endocrine e del metabolismo',
  'La visita endocrinologica valuta il funzionamento di tiroide, ipofisi, surreni, pancreas e gonadi. Fondamentale per disturbi metabolici e ormonali.',
  30,
  '{"tiroide", "diabete", "obesità", "disturbi ormonali", "osteoporosi"}'::TEXT[],
  '{"ecografia-tiroidea", "visita-diabetologica"}'::TEXT[],
  '{"endocrinologo", "tiroide", "ormoni", "metabolismo", "diabete"}'::TEXT[],
  'high',
  '/visita-endocrinologica/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'ecografia-tiroidea',
  'Ecografia Tiroidea',
  'Ecografia della Ghiandola Tiroidea',
  'ecografia-tiroidea',
  'endocrinologia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Esame ecografico per valutare morfologia, dimensioni e noduli tiroidei',
  'L''ecografia tiroidea visualizza la ghiandola tiroidea, identificando noduli, cisti e alterazioni strutturali. Valuta dimensioni, ecogenicità, vascolarizzazione. Esame fondamentale per patologie tiroidee.',
  20,
  '{"noduli tiroidei", "gozzo", "tiroidite", "ipertiroidismo", "ipotiroidismo", "familiarità patologie tiroidee", "screening tiroideo"}'::TEXT[],
  '{"visita-endocrinologica", "agoaspirato-tiroide"}'::TEXT[],
  '{"eco tiroide", "ecografia collo", "nodulo tiroide", "ecografia tiroidea", "tiroide ecografia"}'::TEXT[],
  'high',
  '/ecografia-tiroidea/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'visita-diabetologica',
  'Visita Diabetologica',
  'Visita Diabetologica Specialistica',
  'visita-diabetologica',
  'endocrinologia',
  'visita'::procedure_category,
  'A'::page_type,
  'Gestione e monitoraggio del diabete mellito',
  'La visita diabetologica comprende valutazione del compenso glicemico, gestione della terapia, educazione alimentare e prevenzione delle complicanze.',
  30,
  '{"diabete tipo 1", "diabete tipo 2", "prediabete", "glicemia alta"}'::TEXT[],
  '{"visita-endocrinologica"}'::TEXT[],
  '{"diabete", "glicemia", "insulina", "zuccheri", "diabetologo"}'::TEXT[],
  'high',
  '/endocrinologia/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'visita-dermatologica',
  'Visita Dermatologica',
  'Visita Dermatologica Specialistica',
  'visita-dermatologica',
  'dermatologia',
  'visita'::procedure_category,
  'A'::page_type,
  'Valutazione delle patologie cutanee e degli annessi',
  'La visita dermatologica comprende l''esame della cute, dei nei, delle unghie e dei capelli. Fondamentale per screening oncologico cutaneo.',
  20,
  '{"nei sospetti", "acne", "psoriasi", "dermatiti", "alopecia"}'::TEXT[],
  '{"mappatura-nei", "dermatoscopia"}'::TEXT[],
  '{"dermatologo", "pelle", "nei", "macchie", "prurito", "eczema"}'::TEXT[],
  'high',
  '/visita-dermatologica/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'mappatura-nei',
  'Mappatura dei Nei',
  'Mappatura Computerizzata dei Nei',
  'mappatura-nei',
  'dermatologia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Controllo digitale dei nei per prevenzione melanoma',
  'La mappatura dei nei utilizza un dermatoscopio digitale per fotografare e archiviare i nei, permettendo il confronto nel tempo per identificare cambiamenti sospetti.',
  30,
  '{"prevenzione melanoma", "nei atipici", "familiarità tumori cutanei"}'::TEXT[],
  '{"visita-dermatologica", "dermatoscopia"}'::TEXT[],
  '{"controllo nei", "melanoma", "screening pelle", "dermatoscopia"}'::TEXT[],
  'high',
  '/visita-dermatologica/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'visita-neurologica',
  'Visita Neurologica',
  'Visita Neurologica Specialistica',
  'visita-neurologica',
  'neurologia',
  'visita'::procedure_category,
  'A'::page_type,
  'Valutazione del sistema nervoso centrale e periferico',
  'La visita neurologica comprende anamnesi, esame obiettivo neurologico e valutazione di riflessi, sensibilità, coordinazione e funzioni cognitive.',
  30,
  '{"cefalea", "vertigini", "formicolii", "tremori", "disturbi memoria"}'::TEXT[],
  '{"elettromiografia", "elettroencefalogramma"}'::TEXT[],
  '{"neurologo", "mal di testa", "emicrania", "nervi", "cervello"}'::TEXT[],
  'high',
  '/visita-neurologica/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'elettromiografia',
  'Elettromiografia',
  'Elettromiografia (EMG) ed Elettroneurografia',
  'elettromiografia',
  'neurologia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Studio della conduzione nervosa e dell''attività muscolare',
  'L''elettromiografia valuta la funzionalità dei nervi periferici e dei muscoli. Utile per diagnosticare neuropatie, radicolopatie e miopatie.',
  45,
  '{"tunnel carpale", "formicolii", "debolezza muscolare", "ernia discale"}'::TEXT[],
  '{"visita-neurologica"}'::TEXT[],
  '{"EMG", "nervi", "tunnel carpale", "conduzione nervosa"}'::TEXT[],
  'medium',
  '/elettromiografia/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'visita-oculistica',
  'Visita Oculistica',
  'Visita Oculistica Completa',
  'visita-oculistica',
  'oculistica',
  'visita'::procedure_category,
  'A'::page_type,
  'Valutazione completa della salute degli occhi e della vista',
  'La visita oculistica comprende esame della vista, misurazione pressione oculare, esame del fondo oculare e valutazione della superficie oculare.',
  30,
  '{"calo visivo", "occhi stanchi", "glaucoma", "cataratta", "controllo periodico"}'::TEXT[],
  '{"tonometria", "campo-visivo", "oct"}'::TEXT[],
  '{"oculista", "occhi", "vista", "miopia", "presbiopia", "glaucoma"}'::TEXT[],
  'high',
  '/visita-oculistica/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'tonometria',
  'Tonometria',
  'Misurazione Pressione Intraoculare',
  'tonometria',
  'oculistica',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Misurazione della pressione all''interno dell''occhio',
  'La tonometria misura la pressione intraoculare, parametro fondamentale per la diagnosi e il monitoraggio del glaucoma.',
  10,
  '{"screening glaucoma", "ipertensione oculare", "familiarità glaucoma"}'::TEXT[],
  '{"visita-oculistica", "campo-visivo"}'::TEXT[],
  '{"pressione occhio", "glaucoma", "IOP"}'::TEXT[],
  'medium',
  '/visita-oculistica/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'visita-ortopedica',
  'Visita Ortopedica',
  'Visita Ortopedica Specialistica',
  'visita-ortopedica',
  'ortopedia',
  'visita'::procedure_category,
  'A'::page_type,
  'Valutazione delle patologie muscolo-scheletriche',
  'La visita ortopedica comprende anamnesi, esame obiettivo dell''apparato locomotore e valutazione di articolazioni, ossa, muscoli e tendini.',
  30,
  '{"dolore articolare", "mal di schiena", "traumi", "artrosi", "tendiniti"}'::TEXT[],
  '{"infiltrazioni", "ecografia-muscolo-tendinea"}'::TEXT[],
  '{"ortopedico", "ossa", "articolazioni", "ginocchio", "spalla", "schiena"}'::TEXT[],
  'high',
  '/visita-ortopedica/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'ecografia-muscolo-tendinea',
  'Ecografia Muscolo-Tendinea',
  'Ecografia dell''Apparato Muscolo-Scheletrico',
  'ecografia-muscolo-tendinea',
  'ortopedia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Esame ecografico di muscoli, tendini e articolazioni',
  'L''ecografia muscolo-tendinea visualizza tendini, muscoli, borse e articolazioni per diagnosticare tendiniti, lesioni muscolari e versamenti articolari.',
  20,
  '{"tendinite", "strappo muscolare", "borsite", "cisti"}'::TEXT[],
  '{"visita-ortopedica"}'::TEXT[],
  '{"eco tendini", "ecografia muscoli", "eco spalla", "eco ginocchio"}'::TEXT[],
  'medium',
  '/visita-ortopedica/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'visita-nutrizionale',
  'Visita Nutrizionale',
  'Visita Nutrizionale con Piano Alimentare Personalizzato',
  'visita-nutrizionale',
  'nutrizione',
  'visita'::procedure_category,
  'A'::page_type,
  'Valutazione nutrizionale e piano alimentare su misura',
  'La visita nutrizionale comprende anamnesi alimentare, valutazione antropometrica, analisi composizione corporea e definizione di un piano alimentare personalizzato.',
  45,
  '{"sovrappeso", "obesità", "disturbi alimentari", "sport", "patologie metaboliche"}'::TEXT[],
  '{"bioimpedenziometria"}'::TEXT[],
  '{"nutrizionista", "dieta", "alimentazione", "dimagrire", "peso"}'::TEXT[],
  'high',
  '/visita-nutrizionale/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'bioimpedenziometria',
  'Bioimpedenziometria',
  'Analisi Composizione Corporea (BIA)',
  'bioimpedenziometria',
  'nutrizione',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Misurazione della composizione corporea (massa grassa, magra, acqua)',
  'La bioimpedenziometria è un esame non invasivo che misura la percentuale di massa grassa, massa magra e acqua corporea. Fondamentale per monitorare i risultati di diete e allenamento.',
  15,
  '{"controllo peso", "sport", "dieta", "ritenzione idrica"}'::TEXT[],
  '{"visita-nutrizionale"}'::TEXT[],
  '{"BIA", "massa grassa", "composizione corporea", "grasso corporeo"}'::TEXT[],
  'medium',
  '/visita-nutrizionale/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'visita-medicina-sportiva',
  'Visita Medicina dello Sport',
  'Visita per Idoneità Sportiva Agonistica e Non Agonistica',
  'visita-medicina-sportiva',
  'medicina-sport',
  'visita'::procedure_category,
  'A'::page_type,
  'Certificazione idoneità sportiva con ECG e spirometria',
  'La visita di medicina dello sport comprende anamnesi, esame obiettivo, ECG a riposo, spirometria e, per agonisti, test da sforzo. Rilascia certificato di idoneità.',
  45,
  '{"idoneità sportiva", "certificato sport", "attività agonistica"}'::TEXT[],
  '{"ecg", "spirometria", "test-sforzo"}'::TEXT[],
  '{"certificato sport", "idoneità", "visita sportiva", "agonistica"}'::TEXT[],
  'high',
  '/visita-medicina-sport/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'spirometria',
  'Spirometria',
  'Spirometria Semplice',
  'spirometria',
  'medicina-sport',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Misurazione della funzionalità respiratoria',
  'La spirometria misura i volumi e i flussi respiratori. Fondamentale per diagnosi di asma, BPCO e per la valutazione sportiva.',
  15,
  '{"asma", "affanno", "tosse cronica", "idoneità sportiva"}'::TEXT[],
  '{"visita-medicina-sportiva", "visita-pneumologica"}'::TEXT[],
  '{"respiro", "polmoni", "capacità respiratoria", "fiato"}'::TEXT[],
  'medium',
  '/spirometria/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'prelievo-sangue',
  'Prelievo Ematico',
  'Prelievo di Sangue Venoso',
  'prelievo-sangue',
  'laboratorio',
  'visita'::procedure_category,
  'A'::page_type,
  'Prelievo di sangue per esami di laboratorio',
  'Il prelievo ematico viene effettuato da personale specializzato. Necessario per tutti gli esami del sangue. Disponibile anche a domicilio.',
  10,
  '{"esami sangue", "analisi", "check-up"}'::TEXT[],
  '{}'::TEXT[],
  '{"prelievo", "sangue", "analisi sangue", "esami sangue"}'::TEXT[],
  'high',
  '/laboratorio/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'consulto-pma',
  'Consulto PMA',
  'Consulto per Procreazione Medicalmente Assistita',
  'consulto-pma',
  'ginecologia',
  'visita'::procedure_category,
  'A'::page_type,
  'Prima valutazione per percorsi di fertilità assistita',
  'Il consulto PMA è il primo passo per le coppie con difficoltà di concepimento. Comprende anamnesi, valutazione esami e definizione del percorso terapeutico.',
  45,
  '{"infertilità", "difficoltà concepimento", "PMA", "fecondazione"}'::TEXT[],
  '{"spermiogramma", "ecografia-transvaginale"}'::TEXT[],
  '{"fertilità", "infertilità", "concepimento", "fecondazione assistita", "ICSI", "FIVET"}'::TEXT[],
  'high',
  '/pma-fertilita/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'spermiogramma',
  'Spermiogramma',
  'Esame del Liquido Seminale',
  'spermiogramma',
  'laboratorio',
  'esame'::procedure_category,
  'A'::page_type,
  'Analisi della qualità e quantità degli spermatozoi',
  'Lo spermiogramma valuta concentrazione, motilità e morfologia degli spermatozoi. Esame fondamentale per la valutazione della fertilità maschile.',
  5,
  '{"infertilità maschile", "PMA", "varicocele"}'::TEXT[],
  '{"consulto-pma"}'::TEXT[],
  '{"sperma", "fertilità maschile", "spermatozoi", "seminale"}'::TEXT[],
  'high',
  '/pma-fertilita/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'hpv-dna-test',
  'HPV DNA Test',
  'Test Molecolare per Papillomavirus Umano',
  'hpv-dna-test',
  'ginecologia',
  'esame'::procedure_category,
  'A'::page_type,
  NULL,
  NULL,
  10,
  '{}'::TEXT[],
  '{"pap-test", "duopap", "colposcopia", "visita-ginecologica"}'::TEXT[],
  '{"hpv", "papillomavirus", "virus hpv", "test hpv", "hpv dna", "hpv positivo", "ceppi hpv", "alto rischio", "test molecolare"}'::TEXT[],
  'high',
  '/hpv-dna-test/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'duopap',
  'DuoPap',
  'Co-Testing Cervicale (Pap Test + HPV DNA Test)',
  'duopap',
  'ginecologia',
  'esame'::procedure_category,
  'A'::page_type,
  NULL,
  NULL,
  10,
  '{}'::TEXT[],
  '{"pap-test", "hpv-dna-test", "colposcopia", "visita-ginecologica"}'::TEXT[],
  '{"duopap", "duo pap", "co-testing", "cotesting", "pap hpv insieme", "doppio test", "screening completo", "prevenzione cervice"}'::TEXT[],
  'high',
  '/duopap/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'caressflow',
  'Caressflow',
  'Trattamento Caressflow per Benessere Intimo',
  'caressflow',
  'ginecologia',
  'trattamento'::procedure_category,
  'A'::page_type,
  'Trattamento innovativo per il benessere intimo femminile',
  'Il Caressflow è un trattamento non invasivo che utilizza tecnologie avanzate per stimolare la rigenerazione tissutale, migliorare la tonicità e l''idratazione intima. Indicato per secchezza vaginale, atrofia e lassità.',
  30,
  '{"secchezza vaginale", "atrofia vaginale", "menopausa", "lassità vaginale", "benessere intimo"}'::TEXT[],
  '{"radiofrequenza-vaginale", "visita-ginecologica"}'::TEXT[],
  '{"caressflow", "caress flow", "benessere intimo", "secchezza vaginale", "atrofia", "ringiovanimento vaginale", "trattamento intimo"}'::TEXT[],
  'high',
  '/caressflow/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'radiofrequenza-vaginale',
  'Radiofrequenza Vaginale',
  'Trattamento Radiofrequenza per Rigenerazione Vaginale',
  'radiofrequenza-vaginale',
  'ginecologia',
  'trattamento'::procedure_category,
  'A'::page_type,
  'Trattamento rigenerativo per atrofia e lassità vaginale',
  'La radiofrequenza vaginale è un trattamento non chirurgico che utilizza onde radio per stimolare la produzione di collagene, migliorando tono, elasticità e lubrificazione. Efficace per sintomi della menopausa.',
  25,
  '{"atrofia vaginale", "lassità vaginale post-parto", "menopausa", "incontinenza lieve", "dispareunia"}'::TEXT[],
  '{"caressflow", "visita-ginecologica"}'::TEXT[],
  '{"radiofrequenza vaginale", "rf vaginale", "rigenerazione vaginale", "atrofia vaginale", "menopausa trattamento", "lassità post parto"}'::TEXT[],
  'high',
  '/radiofrequenza-vaginale/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'isteroscopia',
  'Isteroscopia Diagnostica',
  'Isteroscopia Diagnostica Ambulatoriale',
  'isteroscopia',
  'ginecologia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Visualizzazione diretta della cavità uterina per diagnosi di patologie',
  'L''isteroscopia diagnostica permette la visualizzazione diretta dell''interno dell''utero mediante un sottile strumento ottico. Usata per diagnosi di polipi, miomi, malformazioni e aderenze.',
  20,
  '{"sanguinamento anomalo", "infertilità", "polipi endometriali", "miomi sottomucosi", "aderenze uterine"}'::TEXT[],
  '{"isterosalpingografia", "visita-ginecologica"}'::TEXT[],
  '{"isteroscopia", "cavità uterina", "polipi", "miomi", "infertilità diagnosi"}'::TEXT[],
  'high',
  '/isteroscopia/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();

INSERT INTO procedures (
  id, name, name_extended, slug, specialty_id, category, page_type,
  description_short, description_long, duration_minutes,
  indications, related_procedure_ids, search_terms,
  booking_priority, page_url, schema_org_type, status
) VALUES (
  'isterosalpingografia',
  'Isterosalpingografia',
  'Isterosalpingografia (HSG) - Pervietà Tubarica',
  'isterosalpingografia',
  'ginecologia',
  'diagnostica'::procedure_category,
  'A'::page_type,
  'Esame radiologico per valutare pervietà delle tube e morfologia uterina',
  'L''isterosalpingografia (HSG) è un esame radiologico con mezzo di contrasto che permette di valutare la pervietà delle tube di Falloppio e la morfologia della cavità uterina. Fondamentale nello studio dell''infertilità.',
  30,
  '{"infertilità", "sterilità tubarica", "malformazioni uterine", "aborti ricorrenti"}'::TEXT[],
  '{"isteroscopia", "consulto-pma"}'::TEXT[],
  '{"isterosalpingografia", "hsg", "tube pervietà", "tubarica", "infertilità diagnosi", "sterilità"}'::TEXT[],
  'high',
  '/isterosalpingografia/',
  'MedicalProcedure',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  description_long = EXCLUDED.description_long,
  duration_minutes = EXCLUDED.duration_minutes,
  indications = EXCLUDED.indications,
  updated_at = NOW();


-- ============================================
-- Lab Tests: structured tests + listino pricing
-- ============================================

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'emocromo-completo',
  'Emocromo Completo',
  NULL,
  '90.62.2',
  'ematologia',
  'esami ematologici di base',
  'sangue',
  'sangue_venoso',
  '{"emocromo", "esame emocromocitometrico", "CBC", "complete blood count"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Valutazione completa delle cellule del sangue',
  'L''emocromo completo misura globuli rossi, globuli bianchi, emoglobina, ematocrito e piastrine. Esame di screening fondamentale per anemia, infezioni e malattie ematologiche.',
  '{"anemia", "stanchezza", "infezioni", "screening"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"ferritina", "sideremia", "transferrina", "reticolociti"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'tsh-ultrasensibile',
  'TSH Ultrasensibile',
  NULL,
  '90.42.1',
  'endocrinologia',
  'tiroide',
  'sistema_endocrino',
  'sangue_venoso',
  '{"TSH", "tireotropina", "ormone tireostimolante", "TSH reflex"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Dosaggio dell''ormone che regola la funzione tiroidea',
  'Il TSH (Thyroid Stimulating Hormone) è l''esame di prima linea per valutare la funzione tiroidea. Valori alterati indicano ipo o ipertiroidismo.',
  '{"tiroide", "stanchezza", "aumento peso", "tachicardia", "screening tiroideo"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"ft3", "ft4", "anti-tpo", "anti-tg", "tireoglobulina"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'ft3',
  'FT3 - Triiodotironina Libera',
  NULL,
  '90.43.2',
  'endocrinologia',
  'tiroide',
  'sistema_endocrino',
  'sangue_venoso',
  '{"FT3", "T3 libero", "triiodotironina free"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Dosaggio dell''ormone tiroideo attivo',
  'L''FT3 è la forma attiva dell''ormone tiroideo. Insieme a TSH e FT4 permette una valutazione completa della funzione tiroidea.',
  '{"ipertiroidismo", "valutazione funzione tiroidea", "monitoraggio terapia"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"tsh-ultrasensibile", "ft4", "anti-tpo"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'ft4',
  'FT4 - Tiroxina Libera',
  NULL,
  '90.44.1',
  'endocrinologia',
  'tiroide',
  'sistema_endocrino',
  'sangue_venoso',
  '{"FT4", "T4 libero", "tiroxina free"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Dosaggio dell''ormone tiroideo principale',
  'L''FT4 è l''ormone tiroideo principale prodotto dalla tiroide. Insieme al TSH è fondamentale per la diagnosi di ipo/ipertiroidismo.',
  '{"tiroide", "ipotiroidismo", "ipertiroidismo", "monitoraggio"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"tsh-ultrasensibile", "ft3", "anti-tpo"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'anti-tpo',
  'Anticorpi Anti-TPO',
  NULL,
  '90.48.3',
  'endocrinologia',
  'tiroide',
  'sistema_endocrino',
  'sangue_venoso',
  '{"anti-TPO", "anticorpi anti-perossidasi", "Ab anti-tireoperossidasi"}'::TEXT[],
  false,
  0,
  NULL,
  '48h',
  'Marcatore di autoimmunità tiroidea',
  'Gli anticorpi anti-TPO sono presenti nelle tiroiditi autoimmuni (Hashimoto, Graves). Utili per diagnosi e prognosi.',
  '{"tiroidite", "Hashimoto", "ipotiroidismo autoimmune"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"tsh-ultrasensibile", "ft4", "anti-tg"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'glicemia',
  'Glicemia',
  NULL,
  '90.27.1',
  'metabolismo',
  'diabete',
  'metabolismo',
  'sangue_venoso',
  '{"glicemia a digiuno", "glucosio", "zucchero nel sangue", "blood glucose"}'::TEXT[],
  true,
  8,
  NULL,
  '24h',
  'Misurazione del livello di zucchero nel sangue',
  'La glicemia misura la concentrazione di glucosio nel sangue. Esame fondamentale per diagnosi e monitoraggio del diabete.',
  '{"diabete", "prediabete", "screening", "controllo metabolico"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"emoglobina-glicata", "curva-glicemica", "insulina"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'emoglobina-glicata',
  'Emoglobina Glicata',
  NULL,
  '90.28.1',
  'metabolismo',
  'diabete',
  'metabolismo',
  'sangue_venoso',
  '{"HbA1c", "glicata", "A1C", "glycated hemoglobin"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Media della glicemia degli ultimi 2-3 mesi',
  'L''emoglobina glicata riflette la media glicemica degli ultimi 2-3 mesi. Gold standard per il monitoraggio del diabete.',
  '{"diabete", "controllo glicemico", "prediabete"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"glicemia", "curva-glicemica", "insulina"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'colesterolo-totale',
  'Colesterolo Totale',
  NULL,
  '90.14.1',
  'metabolismo',
  'profilo lipidico',
  'metabolismo',
  'sangue_venoso',
  '{"colesterolo", "cholesterol"}'::TEXT[],
  true,
  12,
  NULL,
  '24h',
  'Misurazione del colesterolo nel sangue',
  'Il colesterolo totale è un indicatore del rischio cardiovascolare. Va interpretato insieme a HDL, LDL e trigliceridi.',
  '{"rischio cardiovascolare", "dislipidemia", "prevenzione", "screening"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"colesterolo-hdl", "colesterolo-ldl", "trigliceridi"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'colesterolo-hdl',
  'Colesterolo HDL',
  NULL,
  '90.14.2',
  'metabolismo',
  'profilo lipidico',
  'metabolismo',
  'sangue_venoso',
  '{"HDL", "colesterolo buono", "high density lipoprotein"}'::TEXT[],
  true,
  12,
  NULL,
  '24h',
  'Colesterolo ''buono'' - protettivo cardiovascolare',
  'L''HDL rimuove il colesterolo in eccesso dalle arterie. Valori elevati sono protettivi contro malattie cardiovascolari.',
  '{"rischio cardiovascolare", "dislipidemia", "screening"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"colesterolo-totale", "colesterolo-ldl", "trigliceridi"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'colesterolo-ldl',
  'Colesterolo LDL',
  NULL,
  '90.14.3',
  'metabolismo',
  'profilo lipidico',
  'metabolismo',
  'sangue_venoso',
  '{"LDL", "colesterolo cattivo", "low density lipoprotein"}'::TEXT[],
  true,
  12,
  NULL,
  '24h',
  'Colesterolo ''cattivo'' - rischio cardiovascolare',
  'L''LDL deposita colesterolo nelle arterie. Valori elevati aumentano il rischio di aterosclerosi e infarto.',
  '{"rischio cardiovascolare", "dislipidemia", "prevenzione infarto"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"colesterolo-totale", "colesterolo-hdl", "trigliceridi"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'trigliceridi',
  'Trigliceridi',
  NULL,
  '90.43.1',
  'metabolismo',
  'profilo lipidico',
  'metabolismo',
  'sangue_venoso',
  '{"triglycerides", "TG"}'::TEXT[],
  true,
  12,
  NULL,
  '24h',
  'Grassi nel sangue - rischio cardiovascolare e metabolico',
  'I trigliceridi sono grassi nel sangue. Valori elevati aumentano il rischio cardiovascolare e di pancreatite.',
  '{"dislipidemia", "obesità", "diabete", "rischio cardiovascolare"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"colesterolo-totale", "colesterolo-hdl", "colesterolo-ldl"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'creatinina',
  'Creatinina',
  NULL,
  '90.16.3',
  'nefrologia',
  'funzione renale',
  'reni',
  'sangue_venoso',
  '{"creatininemia", "creatinine"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Indicatore della funzione renale',
  'La creatinina è un prodotto del metabolismo muscolare eliminato dai reni. Valori elevati indicano ridotta funzione renale.',
  '{"funzione renale", "insufficienza renale", "controllo farmaci", "diabete"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"azotemia", "egfr", "esame-urine"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'azotemia',
  'Azotemia',
  NULL,
  '90.07.3',
  'nefrologia',
  'funzione renale',
  'reni',
  'sangue_venoso',
  '{"urea", "BUN", "blood urea nitrogen"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Prodotto finale del metabolismo proteico',
  'L''azotemia misura l''urea nel sangue, prodotto del metabolismo proteico. Utile per valutare funzione renale e stato di idratazione.',
  '{"funzione renale", "disidratazione", "dieta iperproteica"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"creatinina", "egfr", "esame-urine"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'ast-got',
  'AST (GOT)',
  NULL,
  '90.09.2',
  'epatologia',
  'funzione epatica',
  'fegato',
  'sangue_venoso',
  '{"transaminasi AST", "GOT", "aspartato aminotransferasi", "SGOT"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Enzima epatico e cardiaco',
  'L''AST è un enzima presente in fegato, cuore e muscoli. Valori elevati indicano danno cellulare in questi organi.',
  '{"epatite", "danno epatico", "infarto", "miopatie"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"alt-gpt", "gamma-gt", "bilirubina"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'alt-gpt',
  'ALT (GPT)',
  NULL,
  '90.04.5',
  'epatologia',
  'funzione epatica',
  'fegato',
  'sangue_venoso',
  '{"transaminasi ALT", "GPT", "alanina aminotransferasi", "SGPT"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Enzima specifico del fegato',
  'L''ALT è un enzima prevalentemente epatico. Valori elevati sono più specifici per danno epatico rispetto all''AST.',
  '{"epatite", "steatosi", "danno epatico", "farmaci epatotossici"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"ast-got", "gamma-gt", "bilirubina"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'gamma-gt',
  'Gamma GT',
  NULL,
  '90.25.5',
  'epatologia',
  'funzione epatica',
  'fegato',
  'sangue_venoso',
  '{"GGT", "gamma-glutamiltransferasi", "gamma glutamil transpeptidasi"}'::TEXT[],
  true,
  8,
  NULL,
  '24h',
  'Enzima sensibile a danno epatico e biliare',
  'La Gamma GT è elevata in patologie epatiche, biliari e con l''uso di alcol. Marker sensibile di danno epatico.',
  '{"epatopatia", "alcolismo", "colestasi", "farmaci"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"ast-got", "alt-gpt", "fosfatasi-alcalina"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'psa-totale',
  'PSA Totale',
  NULL,
  '90.38.4',
  'oncologia',
  'marcatori tumorali',
  'prostata',
  'sangue_venoso',
  '{"PSA", "antigene prostatico specifico", "prostate specific antigen"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Marcatore per patologie prostatiche',
  'Il PSA è prodotto dalla prostata. Valori elevati possono indicare ipertrofia, prostatite o carcinoma prostatico.',
  '{"screening prostata", "ipertrofia prostatica", "tumore prostata"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"psa-libero", "psa-ratio"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'vitamina-d',
  'Vitamina D (25-OH)',
  NULL,
  '90.41.4',
  'metabolismo',
  'vitamine',
  'metabolismo',
  'sangue_venoso',
  '{"vitamina D", "25-idrossivitamina D", "calcifediolo", "vitamin D"}'::TEXT[],
  false,
  0,
  NULL,
  '48h',
  'Valutazione dello stato vitaminico D',
  'La vitamina D è essenziale per ossa, sistema immunitario e molte funzioni cellulari. La carenza è molto comune.',
  '{"osteoporosi", "stanchezza", "dolori ossei", "cadute frequenti"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"calcio", "fosforo", "paratormone"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'ferritina',
  'Ferritina',
  NULL,
  '90.23.5',
  'ematologia',
  'metabolismo ferro',
  'sangue',
  'sangue_venoso',
  '{"ferritina sierica", "depositi ferro", "ferritin"}'::TEXT[],
  true,
  8,
  NULL,
  '24h',
  'Riserve di ferro nell''organismo',
  'La ferritina indica le riserve di ferro. Valori bassi confermano carenza marziale, valori elevati possono indicare infiammazione o sovraccarico.',
  '{"anemia", "stanchezza", "caduta capelli", "screening ferro"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"emocromo-completo", "sideremia", "transferrina", "tibc"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'esame-urine-completo',
  'Esame Urine Completo',
  NULL,
  '90.44.3',
  'nefrologia',
  'esame urine',
  'reni',
  'urine',
  '{"esame urine", "urine", "analisi urine", "urinalysis"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Analisi chimico-fisica e microscopica delle urine',
  'L''esame urine valuta colore, pH, peso specifico, proteine, glucosio, sangue e sedimento. Utile per screening renale e urinario.',
  '{"infezione urinaria", "cistite", "calcoli", "diabete", "screening"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"urinocoltura", "creatinina", "azotemia"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'ves',
  'VES',
  NULL,
  '90.53.2',
  'infiammazione',
  'indici flogosi',
  'sangue',
  'sangue_venoso',
  '{"velocità di eritrosedimentazione", "ESR", "erythrocyte sedimentation rate"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Indice aspecifico di infiammazione',
  'La VES misura la velocità di sedimentazione dei globuli rossi. Aumenta in infezioni, infiammazioni e alcune neoplasie.',
  '{"infiammazione", "infezione", "malattie reumatiche", "febbre"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"pcr", "emocromo-completo"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'pcr',
  'Proteina C Reattiva (PCR)',
  NULL,
  '90.17.3',
  'infiammazione',
  'indici flogosi',
  'sangue',
  'sangue_venoso',
  '{"PCR", "CRP", "C-reactive protein", "proteina C reattiva"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Marker sensibile di infiammazione acuta',
  'La PCR è un marker rapido e sensibile di infiammazione. Aumenta in infezioni batteriche, traumi e malattie infiammatorie.',
  '{"infezione", "infiammazione acuta", "appendicite", "polmonite"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{"ves", "emocromo-completo", "procalcitonina"}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO lab_tests (
  id, name, name_extended, code, category, subcategory, body_system,
  sample_type, aliases, fasting_required, fasting_hours, preparation_notes,
  turnaround_time, description_short, description_long,
  indications, symptoms, price, related_test_ids, status
) VALUES (
  'beta-hcg',
  'Beta HCG',
  NULL,
  '90.54.1',
  'ginecologia',
  'gravidanza',
  'apparato_riproduttivo',
  'sangue_venoso',
  '{"test gravidanza", "HCG", "gonadotropina corionica", "pregnancy test"}'::TEXT[],
  false,
  0,
  NULL,
  '24h',
  'Ormone della gravidanza',
  'La beta HCG è prodotta dalla placenta. Conferma la gravidanza già pochi giorni dopo il concepimento e permette la datazione.',
  '{"conferma gravidanza", "monitoraggio gravidanza", "sospetto aborto"}'::TEXT[],
  '{}'::TEXT[],
  NULL,
  '{}'::TEXT[],
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  updated_at = NOW();


-- Listino-only lab tests (1,136 price-list items)

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('11-desossicorticosterone-doc', '11-DESOSSICORTICOSTERONE (DOC)', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('1-2-cicloesandiolo-urine-f-t', '1-2 CICLOESANDIOLO URINE F.T.', 'Renale', 10.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('17-beta-estradiolo-leggere-popup', '17 beta Estradiolo  - LEGGERE POPUP', 'Ormoni', 22.0, '48-72h', '{"menopausa", "infertilita"}'::TEXT[], false, NULL, 'donna-over40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('17-chetosteroidi-urine-24h', '17 CHETOSTEROIDI URINE 24H', 'Renale', 10.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('17-oh-progesterone', '17-OH-PROGESTERONE', 'Ormoni', 13.2, '48-72h', '{"infertilita"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('2-5-esandione-urine-f-t', '2-5 ESANDIONE URINE F.T.', 'Renale', 15.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('a-a-helicobacter-pylori-iga', 'A.A. HELICOBACTER PYLORI IgA', 'Autoimmunità', 12.7, '48-72h', '{"problemi_digestivi", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('a-a-helicobacter-pylori-igg', 'A.A. HELICOBACTER PYLORI IgG', 'Autoimmunità', 12.7, '48-72h', '{"problemi_digestivi", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ab-anticorpi-sars-cov-2-igg-ii-proteina-spike-quan', 'AB ANTICORPI SARS COV-2 IgG II PROTEINA SPIKE (QUANTITATIVA)', 'Autoimmunità', 70.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acacia-acacia-longifolia-ige-specifiche', 'ACACIA (ACACIA LONGIFOLIA) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acarus-siro-ige-specifiche', 'ACARUS SIRO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acciuga-ige-specifiche', 'ACCIUGA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acero-acer-negundo-ige-specifiche', 'ACERO (ACER NEGUNDO) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acetonemia-acetone-urine-fine-turno', 'ACETONEMIA (ACETONE URINE FINE TURNO)', 'Renale', 45.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acidi-biliari', 'ACIDI BILIARI', 'Altro', 11.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acidi-grassi-a-catena-lunga-e-rapporto-omega', 'ACIDI GRASSI A CATENA LUNGA E RAPPORTO OMEGA', 'Autoimmunità', 100.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acidi-organici-urinari', 'ACIDI ORGANICI URINARI', 'Altro', 415.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-5-oh-indolacetico-urine-24h', 'ACIDO 5-OH-INDOLACETICO URINE 24H', 'Renale', 22.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-butossiacetico-urine-f-t', 'ACIDO BUTOSSIACETICO URINE F.T.', 'Renale', 39.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-delta-aminolevulinico-ala', 'Acido Delta Aminolevulinico (ALA)', 'Altro', 39.8, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-fenilmercapturico', 'Acido fenilmercapturico', 'Coagulazione', 30.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-folico-folati', 'ACIDO FOLICO (FOLATI)', 'Vitamina/Minerali', 9.9, '48-72h', '{"stanchezza", "anemia"}'::TEXT[], false, NULL, 'donna-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-formico-formiati-urine-f-t', 'ACIDO FORMICO (FORMIATI) URINE F.T.', 'Renale', 18.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-ippurico-urine-f-t', 'ACIDO IPPURICO URINE F.T.', 'Renale', 15.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-ippurico-urine-i-t', 'ACIDO IPPURICO URINE I.T', 'Renale', 15.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-lattico', 'ACIDO LATTICO', 'Altro', 9.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-mandelico-acido-fenilgliossilico-urine-f-t', 'ACIDO MANDELICO + ACIDO FENILGLIOSSILICO URINE F.T.', 'Renale', 28.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-mandelico-acido-fenilgliossilico-urine-i-t', 'ACIDO MANDELICO + ACIDO FENILGLIOSSILICO URINE I.T.', 'Renale', 28.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-mandelico-urine-f-t', 'ACIDO MANDELICO URINE F.T.', 'Renale', 14.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-mandelico-urine-i-t', 'ACIDO MANDELICO URINE I.T.', 'Renale', 14.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-metilippurico-urine-f-t', 'ACIDO METILIPPURICO URINE F.T.', 'Renale', 14.9, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-metilippurico-urine-i-t', 'ACIDO METILIPPURICO URINE I.T.', 'Renale', 14.9, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-metilmalonico', 'ACIDO METILMALONICO', 'Altro', 235.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-micofenolico-micofenolato-mofetile', 'ACIDO MICOFENOLICO (MICOFENOLATO MOFETILE)', 'Altro', 162.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-ossalico-urine-24h', 'ACIDO OSSALICO URINE 24H', 'Renale', 27.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-ossalico-urine-f-t', 'ACIDO OSSALICO URINE F.T.', 'Renale', 32.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-piruvico', 'ACIDO PIRUVICO', 'Altro', 100.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-s-fenilmercapturico-urine-f-t', 'ACIDO S-FENILMERCAPTURICO URINE F.T.', 'Renale', 32.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-transmuconico-urine-f-t', 'ACIDO TRANSMUCONICO URINE F.T.', 'Renale', 36.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-transmuconico-urine-i-t', 'ACIDO TRANSMUCONICO URINE I.T.', 'Renale', 36.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-tricloroacetico-tca-urine-f-t', 'ACIDO TRICLOROACETICO (TCA) URINE F.T.', 'Renale', 11.9, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-urico', 'ACIDO URICO', 'Renale', 3.5, '48-72h', '{"dolori_articolari", "controllo_reni"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-valproico-depakin-dipropilacetico', 'ACIDO VALPROICO (DEPAKIN) (DIPROPILACETICO)', 'Altro', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acido-vanilmandelico-urine-24h', 'ACIDO VANILMANDELICO URINE 24H', 'Renale', 31.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acr-rapporto-mg-di-microalbuminuria-g-di-creatinin', 'ACR: Rapporto mg di Microalbuminuria  / g di creatinina urinaria', 'Epatico', 15.0, '24h', '{"controllo_fegato", "controllo_reni"}'::TEXT[], false, NULL, 'renale', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('acth-ormone-adrenocorticotropo', 'ACTH (ORMONE ADRENOCORTICOTROPO)', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('adenovirus-ricerca-antigene-nelle-feci', 'ADENOVIRUS RICERCA ANTIGENE NELLE FECI', 'Autoimmunità', 25.0, '48-72h', '{"allergie"}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('adiponectina', 'ADIPONECTINA', 'Altro', 85.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('adrenalina-noradrenalina-plasmatica', 'ADRENALINA-NORADRENALINA PLASMATICA', 'Autoimmunità', 34.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('adrenalina-noradrenalina-urine-24h', 'ADRENALINA-NORADRENALINA URINE 24H', 'Renale', 65.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('agglutine-a-freddo', 'AGGLUTINE A FREDDO', 'Altro', 40.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('aglio-ige-specifiche', 'AGLIO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('albicocca-ige-specifiche', 'ALBICOCCA (IgE SPECIFICHE)', 'Autoimmunità', 14.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('albume-ige-specifiche', 'ALBUME (IgE SPECIFICHE)', 'Autoimmunità', 14.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('albumina', 'ALBUMINA', 'Epatico', 3.5, '48-72h', '{"controllo_fegato"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('albuminuria-24h', 'ALBUMINURIA 24H', 'Epatico', 4.0, '48-72h', '{"controllo_fegato"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alcolemia', 'ALCOLEMIA', 'Tossicologia', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('aldolasi', 'ALDOLASI', 'Altro', 3.3, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('aldosterone-in-ortostatismo', 'ALDOSTERONE IN ORTOSTATISMO', 'Altro', 16.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('aldosterone-urine-24h', 'ALDOSTERONE URINE 24H', 'Renale', 21.9, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alex-test', 'ALEX TEST', 'Altro', 310.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alfa-1-microglobulina', 'ALFA 1 MICROGLOBULINA', 'Altro', 28.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alfa-2-macroglobulina', 'ALFA 2 MACROGLOBULINA', 'Altro', 40.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alfa-latto-albumina-ige-specifiche', 'ALFA LATTO-ALBUMINA (IgE SPECIFICHE)', 'Epatico', 12.5, '48-72h', '{"controllo_fegato", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alfa-1-antitripsina', 'ALFA-1-ANTITRIPSINA', 'Altro', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alfa-1-antitripsina-fecale', 'ALFA-1-ANTITRIPSINA FECALE', 'Fecale', 55.0, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alfa-1-glicoproteina-mucoproteina', 'ALFA-1-GLICOPROTEINA (MUCOPROTEINA)', 'Altro', 12.3, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alfafetoproteina-afp', 'ALFAFETOPROTEINA (AFP)', 'Tumore/Markers', 16.9, '48-72h', '{"dimagrimento"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alluminio-sierico', 'ALLUMINIO SIERICO', 'Altro', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alluminio-urine-f-t', 'ALLUMINIO URINE F.T.', 'Renale', 30.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alluminio-urine-i-t', 'ALLUMINIO URINE I.T.', 'Renale', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alpha-gal-galactose-alpha-1-3-galactose', 'ALPHA-GAL GALACTOSE-ALPHA-1,3-GALACTOSE', 'Altro', 78.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alt-a1-alternaria-alternata', 'ALT A1 ALTERNARIA ALTERNATA', 'Epatico', 82.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('alternaria-alternata-ige-specifiche', 'ALTERNARIA ALTERNATA (IgE SPECIFICHE)', 'Epatico', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('amaranto-comune-amaranthus-retroflexus-ige-specifi', 'AMARANTO COMUNE (AMARANTHUS RETROFLEXUS) (IgE SPECIFICHE)', 'Autoimmunità', 14.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ambrosia-elatior-ambrosia-artemisifolia-ige-specif', 'AMBROSIA ELATIOR (AMBROSIA ARTEMISIFOLIA) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ambrosia-gigante-ambrosia-trifida-ige-specifiche', 'AMBROSIA GIGANTE (AMBROSIA TRIFIDA) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ambrosia-occidentale-ambrosia-psilostachya-ige-spe', 'AMBROSIA OCCIDENTALE (AMBROSIA PSILOSTACHYA) (IgE SPECIFICHE)', 'Autoimmunità', 25.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('amilasi', 'AMILASI', 'Altro', 3.5, '48-72h', '{"problemi_digestivi"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('amilasi-isoenzimi', 'AMILASI ISOENZIMI', 'Altro', 65.0, '48-72h', '{"problemi_digestivi"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('amilasi-pancreatica', 'AMILASI PANCREATICA', 'Altro', 12.0, '48-72h', '{"problemi_digestivi"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('amilasuria-urine-spot', 'AMILASURIA URINE  spot', 'Renale', 2.99, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('aminoacidi-plasmatici', 'AMINOACIDI PLASMATICI', 'Altro', 350.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('amiodarone-e-metaboliti', 'AMIODARONE E METABOLITI', 'Altro', 229.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ammonio', 'AMMONIO', 'Altro', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('amoxicillina-ige-specifiche', 'AMOXICILLINA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ampicillina-ige-specifiche', 'AMPICILLINA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anacardio-ige-specifiche', 'ANACARDIO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('analisi-genetica-di-ii-livello', 'ANALISI GENETICA DI II LIVELLO', 'Autoimmunità', 170.0, '7-15gg', '{"dolori_articolari"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ananas-ige-specifiche', 'ANANAS (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('androstenediolo-glucuronide', 'ANDROSTENEDIOLO GLUCURONIDE', 'Altro', 12.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anexina-v-igg', 'ANEXINA V IGG', 'Autoimmunità', 62.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('angiotensina-ii', 'ANGIOTENSINA II', 'Altro', 124.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anguria-ige-specifiche', 'ANGURIA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anisakis-ige-specifiche', 'ANISAKIS (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('annexina-v-igg', 'Annexina V IgG', 'Autoimmunità', 65.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antibiogramma', 'ANTIBIOGRAMMA', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antibiogramma-mic-batteri-gram-negativi', 'ANTIBIOGRAMMA (MIC) batteri gram negativi', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antibiogramma-mic-batteri-gram-positivi', 'ANTIBIOGRAMMA (MIC) batteri gram positivi', 'Altro', 45.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antibiogramma-per-micoplasma-ureaplasma', 'ANTIBIOGRAMMA PER MICOPLASMA/UREAPLASMA', 'Renale', 70.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antibiogramma-vitek-ast-n379', 'ANTIBIOGRAMMA VITEK AST N379', 'Epatico', 45.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antibiotici-aminoglicosidi-vancomicina', 'ANTIBIOTICI AMINOGLICOSIDI: VANCOMICINA', 'Altro', 44.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-core-virus-b-hbcab-totali', 'ANTICORPI ANTI - CORE VIRUS B (HBCAB TOTALI)', 'Autoimmunità', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-bp180', 'ANTICORPI ANTI BP180', 'Autoimmunità', 33.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-gangliosidi-profilo-completo-igg', 'ANTICORPI ANTI GANGLIOSIDI - Profilo completo IgG', 'Autoimmunità', 70.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-hdv-virus-epatite-delta', 'ANTICORPI ANTI HDV (VIRUS EPATITE DELTA)', 'Epatico', 63.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-insulina', 'ANTICORPI ANTI INSULINA', 'Glicemia/Diabete', 45.9, '48-72h', '{"aumento_peso"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-mag', 'Anticorpi Anti Mag', 'Autoimmunità', 63.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-musk', 'ANTICORPI ANTI MUSK', 'Autoimmunità', 81.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-pemfigoide-bolloso-bp230', 'Anticorpi anti Pemfigoide bolloso BP230', 'Autoimmunità', 33.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-sars-cov-2-igm-igg', 'ANTICORPI ANTI SARS-CoV-2 (IgM, IgG)', 'Autoimmunità', 55.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-sars-cov-2-igg-quantitativo', 'ANTICORPI ANTI SARS-COV-2 IGG (QUANTITATIVO)', 'Autoimmunità', 40.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-ssa', 'ANTICORPI ANTI SSA', 'Autoimmunità', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-ssb', 'ANTICORPI ANTI SSB', 'Autoimmunità', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-21-idrossilasi', 'anticorpi anti-21 Idrossilasi', 'Autoimmunità', 97.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-adenovirus-igg', 'ANTICORPI ANTI-ADENOVIRUS IgG', 'Autoimmunità', 14.2, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-adenovirus-igm', 'ANTICORPI ANTI-ADENOVIRUS IgM', 'Autoimmunità', 14.2, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-ameba-entamoeba-histolytica', 'ANTICORPI ANTI-AMEBA (ENTAMOEBA HISTOLYTICA)', 'Autoimmunità', 74.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-bartonella-henselae-igg', 'ANTICORPI ANTI-BARTONELLA HENSELAE IgG', 'Autoimmunità', 45.9, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-bartonella-henselae-igm', 'ANTICORPI ANTI-BARTONELLA HENSELAE IgM', 'Autoimmunità', 68.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-bartonella-quintana-igg', 'ANTICORPI ANTI-BARTONELLA QUINTANA IgG', 'Autoimmunità', 24.9, '48-72h', '{"dolori_articolari", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-bartonella-quintana-igm', 'ANTICORPI ANTI-BARTONELLA QUINTANA IgM', 'Autoimmunità', 24.9, '48-72h', '{"dolori_articolari", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-beta-2-glicoproteina-igg', 'ANTICORPI ANTI-BETA 2 GLICOPROTEINA IgG', 'Autoimmunità', 25.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-beta-2-glicoproteina-igm', 'ANTICORPI ANTI-BETA 2 GLICOPROTEINA IgM', 'Autoimmunità', 25.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-borrelia-burgdorferi-igg', 'ANTICORPI ANTI-BORRELIA BURGDORFERI IgG', 'Autoimmunità', 14.2, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-borrelia-burgdorferi-igm', 'ANTICORPI ANTI-BORRELIA BURGDORFERI IgM', 'Autoimmunità', 14.2, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-candida-albicans-igg', 'ANTICORPI ANTI-CANDIDA ALBICANS IgG', 'Autoimmunità', 24.9, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-candida-albicans-igm', 'ANTICORPI ANTI-CANDIDA ALBICANS IgM', 'Autoimmunità', 24.9, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-cardiolipina-iga', 'ANTICORPI ANTI-CARDIOLIPINA IgA', 'Autoimmunità', 35.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-cardiolipina-igg', 'ANTICORPI ANTI-CARDIOLIPINA IgG', 'Autoimmunità', 25.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-cardiolipina-igm', 'ANTICORPI ANTI-CARDIOLIPINA IgM', 'Autoimmunità', 25.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-cellule-parietali-apca', 'ANTICORPI ANTI-CELLULE PARIETALI (APCA)', 'Autoimmunità', 14.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-centromero-cenp-b', 'ANTICORPI ANTI-CENTROMERO (CENP-B)', 'Autoimmunità', 21.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-chlamydia-pneumoniae-iga', 'ANTICORPI ANTI-CHLAMYDIA PNEUMONIAE IgA', 'Autoimmunità', 50.0, '7-15gg', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-chlamydia-pneumoniae-igg', 'ANTICORPI ANTI-CHLAMYDIA PNEUMONIAE IgG', 'Autoimmunità', 50.0, '7-15gg', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-chlamydia-pneumoniae-igm', 'ANTICORPI ANTI-CHLAMYDIA PNEUMONIAE IgM', 'Autoimmunità', 50.0, '7-15gg', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-chlamydia-trachomatis-iga', 'ANTICORPI ANTI-CHLAMYDIA TRACHOMATIS IgA', 'Autoimmunità', 25.0, '7-15gg', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-chlamydia-trachomatis-igg', 'ANTICORPI ANTI-CHLAMYDIA TRACHOMATIS IgG', 'Autoimmunità', 25.0, '7-15gg', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-chlamydia-trachomatis-igm', 'ANTICORPI ANTI-CHLAMYDIA TRACHOMATIS IgM', 'Autoimmunità', 25.0, '7-15gg', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-citomegalovirus-igg', 'ANTICORPI ANTI-CITOMEGALOVIRUS IgG', 'Autoimmunità', 12.7, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-citomegalovirus-igm', 'ANTICORPI ANTI-CITOMEGALOVIRUS IgM', 'Autoimmunità', 13.5, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-citoplasma-granulociti-neutrofili-a', 'ANTICORPI ANTI-CITOPLASMA GRANULOCITI NEUTROFILI (ANCA)', 'Autoimmunità', 15.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-citrullina', 'ANTICORPI ANTI-CITRULLINA', 'Autoimmunità', 31.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-cromatina-nucleosoma', 'Anticorpi anti-cromatina (nucleosoma)', 'Autoimmunità', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-desmogleina-1-dsg1', 'ANTICORPI ANTI-DESMOGLEINA 1 (DSG1)', 'Autoimmunità', 40.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-desmogleina-3-dsg3', 'ANTICORPI ANTI-DESMOGLEINA 3 (DSG3)', 'Autoimmunità', 40.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-difterite', 'ANTICORPI ANTI-DIFTERITE', 'Autoimmunità', 80.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-dna-nativo', 'ANTICORPI ANTI-DNA NATIVO', 'Autoimmunità', 16.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-dnasi-b', 'ANTICORPI ANTI-DNASI B', 'Autoimmunità', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-echo-virus-neurotropi-ig-totali', 'ANTICORPI ANTI-ECHO VIRUS NEUROTROPI Ig TOTALI', 'Autoimmunità', 38.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-echo-virus-pneumotropi-ig-totali', 'ANTICORPI ANTI-ECHO VIRUS PNEUMOTROPI Ig TOTALI', 'Autoimmunità', 38.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-ena-screening', 'ANTICORPI ANTI-ENA (SCREENING)', 'Autoimmunità', 28.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-ena-jo-1', 'ANTICORPI ANTI-ENA JO-1', 'Autoimmunità', 11.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-ena-rnp', 'ANTICORPI ANTI-ENA RNP', 'Autoimmunità', 11.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-ena-scl-70', 'ANTICORPI ANTI-ENA SCL-70', 'Autoimmunità', 11.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-ena-sm', 'ANTICORPI ANTI-ENA SM', 'Autoimmunità', 11.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-ena-ssa-ro-52kd', 'ANTICORPI ANTI-ENA SSA (RO) 52KD', 'Autoimmunità', 11.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-ena-ssa-ro-60kd', 'ANTICORPI ANTI-ENA SSA (RO) 60KD', 'Autoimmunità', 11.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-ena-ssa-ro', 'ANTICORPI ANTI-ENA SSA/RO', 'Autoimmunità', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-ena-ssb-la', 'ANTICORPI ANTI-ENA SSB (LA)', 'Autoimmunità', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-endomisio-ema-iga', 'ANTICORPI ANTI-ENDOMISIO (EMA) IgA', 'Autoimmunità', 18.5, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-endomisio-ema-igg', 'ANTICORPI ANTI-ENDOMISIO (EMA) IgG', 'Autoimmunità', 18.5, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-epstein-barr-virus-ea-igg', 'ANTICORPI ANTI-EPSTEIN BARR VIRUS EA IgG', 'Autoimmunità', 16.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-epstein-barr-virus-ebna-igg', 'ANTICORPI ANTI-EPSTEIN BARR VIRUS EBNA IgG', 'Autoimmunità', 12.4, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-epstein-barr-virus-vca-igg', 'ANTICORPI ANTI-EPSTEIN BARR VIRUS VCA IgG', 'Autoimmunità', 13.5, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-epstein-barr-virus-vca-igm', 'ANTICORPI ANTI-EPSTEIN BARR VIRUS VCA IgM', 'Autoimmunità', 15.2, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-fattore-intrinseco', 'ANTICORPI ANTI-FATTORE INTRINSECO', 'Autoimmunità', 50.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-fosfolipidi', 'ANTICORPI ANTI-FOSFOLIPIDI', 'Autoimmunità', 20.8, '48-72h', '{}'::TEXT[], true, 'A digiuno da 12 ore', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-gad-65-decarbossilasi-dell-acido-gl', 'ANTICORPI ANTI-GAD 65 (DECARBOSSILASI DELL''ACIDO GLUTAMMICO)', 'Autoimmunità', 65.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-gangliosidi-profilo-completo-igm', 'ANTICORPI ANTI-GANGLIOSIDI (PROFILO COMPLETO IGM)', 'Autoimmunità', 70.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-gliadina-deamidata-iga', 'ANTICORPI ANTI-GLIADINA DEAMIDATA IgA', 'Autoimmunità', 13.5, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-gliadina-deamidata-igg', 'ANTICORPI ANTI-GLIADINA DEAMIDATA IgG', 'Autoimmunità', 13.5, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-hav-igg', 'ANTICORPI ANTI-HAV IgG', 'Autoimmunità', 13.9, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-hav-igm', 'ANTICORPI ANTI-HAV IgM', 'Autoimmunità', 13.9, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-hbc-igg', 'ANTICORPI ANTI-HBc IgG', 'Autoimmunità', 13.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-hbc-igm', 'ANTICORPI ANTI-HBc IgM', 'Autoimmunità', 13.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-hbeag', 'ANTICORPI ANTI-HBeAg', 'Autoimmunità', 18.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-hbs-totali', 'ANTICORPI ANTI-HBs TOTALI', 'Autoimmunità', 12.7, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-hcv', 'ANTICORPI ANTI-HCV', 'Autoimmunità', 10.0, '48-72h', '{"controllo_fegato"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-hdv-epatite-delta', 'ANTICORPI ANTI-HDV - EPATITE DELTA', 'Epatico', 125.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-helicobacter-pylori-igg', 'ANTICORPI ANTI-HELICOBACTER PYLORI IgG', 'Autoimmunità', 13.5, '48-72h', '{"problemi_digestivi", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-herpes-simplex-tipo-1-igg', 'ANTICORPI ANTI-HERPES SIMPLEX TIPO 1 IgG', 'Autoimmunità', 13.5, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-herpes-simplex-tipo-1-2-igm', 'ANTICORPI ANTI-HERPES SIMPLEX TIPO 1-2 IgM', 'Autoimmunità', 15.2, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-herpes-simplex-tipo-2-igg', 'ANTICORPI ANTI-HERPES SIMPLEX TIPO 2 IgG', 'Autoimmunità', 13.5, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-hiv-1-2', 'ANTICORPI ANTI-HIV 1-2', 'Autoimmunità', 13.0, '48-72h', '{"gravidanza"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-htlv-1-2', 'ANTICORPI ANTI-HTLV 1/2', 'Autoimmunità', 48.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-insula-pancreatica-ica', 'ANTICORPI ANTI-INSULA PANCREATICA (ICA)', 'Autoimmunità', 7.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-legionella', 'ANTICORPI ANTI-LEGIONELLA', 'Autoimmunità', 60.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-leptospira-ig-m', 'ANTICORPI ANTI-LEPTOSPIRA (Ig M)', 'Coagulazione', 75.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-listeria', 'ANTICORPI ANTI-LISTERIA', 'Autoimmunità', 28.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-microsoma-lkm', 'ANTICORPI ANTI-MICROSOMA LKM', 'Autoimmunità', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-mitocondri-ama', 'ANTICORPI ANTI-MITOCONDRI (AMA)', 'Autoimmunità', 14.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-morbillo-igg', 'ANTICORPI ANTI-MORBILLO IgG', 'Autoimmunità', 12.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-morbillo-igm', 'ANTICORPI ANTI-MORBILLO IgM', 'Autoimmunità', 14.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-muscolo-liscio-asma', 'ANTICORPI ANTI-MUSCOLO LISCIO (ASMA)', 'Autoimmunità', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-muscolo-striato', 'ANTICORPI ANTI-MUSCOLO STRIATO', 'Autoimmunità', 44.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-mycoplasma-pneumoniae-igg', 'ANTICORPI ANTI-MYCOPLASMA PNEUMONIAE IgG', 'Autoimmunità', 18.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-mycoplasma-pneumoniae-igm', 'ANTICORPI ANTI-MYCOPLASMA PNEUMONIAE IgM', 'Autoimmunità', 18.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-nucleo-ana', 'ANTICORPI ANTI-NUCLEO (ANA)', 'Autoimmunità', 13.0, '48-72h', '{"dolori_articolari"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-parotite-igg', 'ANTICORPI ANTI-PAROTITE IgG', 'Autoimmunità', 12.9, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-parotite-igm', 'ANTICORPI ANTI-PAROTITE IgM', 'Autoimmunità', 12.9, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-parvovirus-b19-igg', 'ANTICORPI ANTI-PARVOVIRUS B19 IgG', 'Autoimmunità', 15.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-parvovirus-b19-igm', 'ANTICORPI ANTI-PARVOVIRUS B19 IgM', 'Autoimmunità', 15.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-pertosse-igg', 'ANTICORPI ANTI-PERTOSSE IgG', 'Autoimmunità', 12.5, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-pertosse-igm', 'ANTICORPI ANTI-PERTOSSE IgM', 'Autoimmunità', 12.5, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-piastrine', 'ANTICORPI ANTI-PIASTRINE', 'Ematologia', 235.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-proteinasi-3-pr3', 'ANTICORPI ANTI-PROTEINASI 3 (PR3)', 'Autoimmunità', 10.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-recettore-acetilcolina-achr', 'Anticorpi Anti-recettore Acetilcolina (AChR)', 'Autoimmunità', 62.22, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-recettore-acetilcolina-nicotinico-m', 'ANTICORPI ANTI-RECETTORE ACETILCOLINA (NICOTINICO MUSCOLARE)', 'Autoimmunità', 110.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-recettori-tsh', 'ANTICORPI ANTI-RECETTORI TSH', 'Tiroide', 35.0, '48h', '{"aumento_peso", "stanchezza", "perdita_capelli", "dimagrimento", "menopausa", "gravidanza", "palpitazioni", "insonnia", "infertilita", "ansia_stress"}'::TEXT[], false, NULL, 'donna-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-reticolina', 'ANTICORPI ANTI-RETICOLINA', 'Autoimmunità', 28.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-antiribosoma', 'ANTICORPI ANTIRIBOSOMA', 'Autoimmunità', 28.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-rosolia-igg', 'ANTICORPI ANTI-ROSOLIA IgG', 'Autoimmunità', 11.7, '48-72h', '{"gravidanza", "infezioni_frequenti"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-rosolia-igm', 'ANTICORPI ANTI-ROSOLIA IgM', 'Autoimmunità', 11.7, '48-72h', '{"gravidanza", "infezioni_frequenti"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-schistosoma-mansoni', 'ANTICORPI ANTI-SCHISTOSOMA MANSONI', 'Autoimmunità', 28.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-spermatozoi', 'ANTICORPI ANTI-SPERMATOZOI', 'Autoimmunità', 35.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-surrene', 'ANTICORPI ANTI-SURRENE', 'Autoimmunità', 30.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-tetano', 'ANTICORPI ANTI-TETANO', 'Autoimmunità', 28.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-tireoglobulina', 'ANTICORPI ANTI-TIREOGLOBULINA', 'Tiroide', 19.9, '48-72h', '{}'::TEXT[], false, NULL, 'tiroide-plus', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-tireoperossidasi', 'ANTICORPI ANTI-TIREOPEROSSIDASI', 'Autoimmunità', 19.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-toxoplasma-igg', 'ANTICORPI ANTI-TOXOPLASMA IgG', 'Autoimmunità', 10.5, '48-72h', '{"gravidanza", "infezioni_frequenti"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-toxoplasma-igm', 'ANTICORPI ANTI-TOXOPLASMA IgM', 'Autoimmunità', 10.5, '48-72h', '{"gravidanza", "infezioni_frequenti"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-transglutaminasi-iga', 'ANTICORPI ANTI-TRANSGLUTAMINASI IgA', 'Autoimmunità', 20.3, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-transglutaminasi-igg', 'ANTICORPI ANTI-TRANSGLUTAMINASI IgG', 'Autoimmunità', 21.9, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-treponema-pallidum-igg', 'ANTICORPI ANTI-TREPONEMA PALLIDUM IgG', 'Autoimmunità', 10.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-treponema-pallidum-igm', 'ANTICORPI ANTI-TREPONEMA PALLIDUM IgM', 'Autoimmunità', 10.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-varicella-herpes-zoster-igg', 'ANTICORPI ANTI-VARICELLA (HERPES ZOSTER) IgG', 'Autoimmunità', 13.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('anticorpi-anti-varicella-herpes-zoster-igm', 'ANTICORPI ANTI-VARICELLA (HERPES ZOSTER) IgM', 'Autoimmunità', 13.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antigene-carboidratico-ca-125', 'ANTIGENE CARBOIDRATICO CA 125', 'Tumore/Markers', 13.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antigene-carboidratico-ca-15-3', 'ANTIGENE CARBOIDRATICO CA 15-3', 'Tumore/Markers', 13.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antigene-carboidratico-ca-19-9', 'ANTIGENE CARBOIDRATICO CA 19-9', 'Tumore/Markers', 13.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antigene-carboidratico-ca-50', 'ANTIGENE CARBOIDRATICO CA 50', 'Tumore/Markers', 45.9, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antigene-carboidratico-ca-72-4', 'ANTIGENE CARBOIDRATICO CA 72-4', 'Tumore/Markers', 22.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antigene-carcinoembrionale-cea', 'ANTIGENE CARCINOEMBRIONALE (CEA)', 'Tumore/Markers', 10.0, '48-72h', '{"dimagrimento", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antigene-hbeag', 'ANTIGENE HBeAg', 'Autoimmunità', 15.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antigene-polipeptidico-tissutale-tpa', 'ANTIGENE POLIPEPTIDICO TISSUTALE (TPA)', 'Coagulazione', 21.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antigene-prostatico-specifico-psa-totale', 'ANTIGENE PROSTATICO SPECIFICO (PSA) TOTALE', 'Tumore/Markers', 10.0, '48-72h', '{"allergie", "controllo_prostata"}'::TEXT[], false, NULL, 'uomo-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antimicogramma', 'ANTIMICOGRAMMA', 'Altro', 30.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antimieloperossidasi-mpo', 'ANTIMIELOPEROSSIDASI (MPO)', 'Altro', 28.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antimonio-urine-f-t', 'ANTIMONIO URINE F.T.', 'Renale', 22.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antiproteinasi-3-pr3', 'ANTIPROTEINASI 3 (PR3)', 'Altro', 10.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('antitrombina', 'ANTITROMBINA', 'Coagulazione', 4.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ape-apis-mellifera-ige-specifiche', 'APE (APIS MELLIFERA) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('apolipoproteina-a1', 'APOLIPOPROTEINA A1', 'Lipidico', 13.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('apolipoproteina-b', 'APOLIPOPROTEINA B', 'Lipidico', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('aptoglobina', 'APTOGLOBINA', 'Coagulazione', 9.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('arachide-ige-specifiche', 'ARACHIDE (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('aragosta-ige-specifiche', 'ARAGOSTA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('arancia-ige-specifiche', 'ARANCIA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('argento-ematico', 'ARGENTO EMATICO', 'Altro', 56.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('argento-urine-f-t', 'ARGENTO URINE F.T.', 'Renale', 318.3, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('aringa-ige-specifiche', 'ARINGA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('arsenico-urine-f-t', 'ARSENICO URINE F.T.', 'Renale', 34.2, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('asca-anticorpi-anti-saccharomyces-cerevisiae-iga', 'ASCA - ANTICORPI ANTI-SACCHAROMYCES CEREVISIAE IgA', 'Autoimmunità', 31.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('asca-anticorpi-anti-saccharomyces-cerevisiae-igg', 'ASCA - ANTICORPI ANTI-SACCHAROMYCES CEREVISIAE IgG', 'Autoimmunità', 33.4, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('asparago-ige-specifiche', 'ASPARAGO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('aspergillus-fumigatus-ige-specifiche', 'ASPERGILLUS FUMIGATUS (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('aspergillus-niger-ige-specifiche', 'ASPERGILLUS NIGER (IgE SPECIFICHE)', 'Autoimmunità', 14.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('assenzio-artemisia-absinthium-ige-specifiche', 'ASSENZIO (ARTEMISIA ABSINTHIUM) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('assenzio-selvatico-artemisia-vulgaris-ige-specific', 'ASSENZIO SELVATICO (ARTEMISIA VULGARIS) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('atrofia-muscolare-spinale', 'ATROFIA MUSCOLARE SPINALE', 'Altro', 130.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('avena-avena-sativa-ige-specifiche', 'AVENA (AVENA SATIVA) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('avena-ige-specifiche', 'AVENA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('azoturia-urine-24h', 'AZOTURIA URINE 24H', 'Renale', 3.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('bambagiona-holcus-lanatus-ige-specifiche', 'BAMBAGIONA (HOLCUS LANATUS) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('banana-ige-specifiche', 'BANANA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('barbiturici-sierici', 'BARBITURICI SIERICI', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('bario-urine-f-t', 'BARIO URINE F.T.', 'Renale', 322.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('bartonella-ricerca-anticorpi-igg-e-igm', 'BARTONELLA RICERCA ANTICORPI IgG e IgM', 'Autoimmunità', 33.5, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('basilico-ige-specifiche', 'BASILICO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('benzene-ematico', 'BENZENE EMATICO', 'Altro', 23.1, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('benzene-urine-f-t', 'BENZENE URINE F.T.', 'Renale', 23.1, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('benzene-urine-i-t', 'BENZENE URINE I.T.', 'Renale', 23.1, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('benzodiazepine-sieriche', 'BENZODIAZEPINE SIERICHE', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('benzodiazepine-urinarie', 'BENZODIAZEPINE URINARIE', 'Altro', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('beta-2-microglobulina-sierica', 'BETA 2 MICROGLOBULINA SIERICA', 'Altro', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('beta-2-microglobulina-urine-24h', 'BETA 2 MICROGLOBULINA URINE 24H', 'Renale', 13.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('beta-2-microglobulina-urine-f-t', 'BETA 2 MICROGLOBULINA URINE F.T.', 'Renale', 13.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('beta-hcg-plasmatico', 'BETA HCG PLASMATICO', 'Ormoni', 15.5, '48-72h', '{"gravidanza"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('beta-lattoglobulina-ige-specifiche', 'BETA LATTOGLOBULINA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('betulla-betula-verrucosa-ige-specifiche', 'BETULLA (BETULA VERRUCOSA) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('bicarbonati', 'BICARBONATI', 'Altro', 4.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('bilirubina-diretta', 'BILIRUBINA DIRETTA', 'Epatico', 2.5, '48-72h', '{"controllo_fegato", "problemi_digestivi"}'::TEXT[], false, NULL, 'epatico', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('bilirubina-totale', 'BILIRUBINA TOTALE', 'Epatico', 3.5, '48-72h', '{"controllo_fegato", "problemi_digestivi"}'::TEXT[], false, NULL, 'epatico', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('bnp', 'BNP', 'Cardiologico', 70.0, '48-72h', '{"controllo_cuore", "palpitazioni"}'::TEXT[], false, NULL, 'cardio', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('botrytis-cinerea-ige-specifiche', 'BOTRYTIS CINEREA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('brca-plus', 'BRCA PLUS', 'Altro', 350.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('breath-test-al-lattosio', 'BREATH TEST AL LATTOSIO', 'Altro', 59.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('breath-test-glucosio', 'BREATH TEST GLUCOSIO', 'Glicemia/Diabete', 61.0, '24h', '{"aumento_peso", "stanchezza", "dimagrimento", "gravidanza"}'::TEXT[], true, 'A digiuno da 8-12 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('breath-test-helicobacter', 'Breath Test Helicobacter', 'Infettivologia', 65.0, '48-72h', '{"problemi_digestivi"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('broccoli-ige-specifiche', 'BROCCOLI (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('c-peptide', 'C PEPTIDE', 'Coagulazione', 13.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('c-peptide-profilo', 'C PEPTIDE PROFILO', 'Coagulazione', 12.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('c1-esterasi-inibitore', 'C1 ESTERASI INIBITORE', 'Altro', 51.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('c1-inattivatore', 'C1 INATTIVATORE', 'Altro', 22.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cacao-ige-specifiche', 'CACAO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cadmio-ematico', 'CADMIO EMATICO', 'Tossicologia', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cadmio-urine-f-t', 'CADMIO URINE F.T.', 'Renale', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('caffe-ige-specifiche', 'CAFFE'' (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('calabrone-bianco-dolichovespula-maculata-ige-speci', 'CALABRONE BIANCO (DOLICHOVESPULA MACULATA) (IgE SPECIFICHE)', 'Infiammazione', 12.5, '48-72h', '{"dimagrimento", "dolori_articolari", "allergie", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('calabrone-europeo-vespa-cabro-ige-specifiche', 'CALABRONE EUROPEO (VESPA CABRO) (IgE SPECIFICHE)', 'Infiammazione', 12.5, '48-72h', '{"dimagrimento", "dolori_articolari", "allergie", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('calabrone-giallo-dolichovespula-arenaria-ige-speci', 'CALABRONE GIALLO (DOLICHOVESPULA ARENARIA) (IgE SPECIFICHE)', 'Infiammazione', 12.5, '48-72h', '{"dimagrimento", "dolori_articolari", "allergie", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('calamaro-ige-specifiche', 'CALAMARO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('calcio', 'CALCIO', 'Elettroliti', 3.5, '48-72h', '{"menopausa", "palpitazioni"}'::TEXT[], false, NULL, 'donna-over40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('calcio-ionizzato', 'CALCIO IONIZZATO', 'Elettroliti', 10.0, '48-72h', '{"menopausa", "palpitazioni"}'::TEXT[], false, NULL, 'donna-over40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('calcitonina', 'CALCITONINA', 'Tiroide', 18.0, '48-72h', '{}'::TEXT[], false, NULL, 'tiroide-plus', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('calciuria-urine-24h', 'CALCIURIA URINE 24H', 'Renale', 3.8, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('calciuria-urine-spot', 'CALCIURIA URINE SPOT', 'Renale', 3.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('calprotectina-fecale-quantitativa', 'CALPROTECTINA FECALE QUANTITATIVA', 'Fecale', 28.0, '48-72h', '{"problemi_digestivi"}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('candida-albicans-ige-specifiche', 'CANDIDA ALBICANS (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('canna-di-palude-phragmites-communis-ige-specifiche', 'CANNA DI PALUDE (PHRAGMITES COMMUNIS) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cannabinoidi-test-di-conferma', 'CANNABINOIDI - TEST DI CONFERMA', 'Altro', 168.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cannabinoidi-matrice-pilifera-valenza-clinica', 'CANNABINOIDI MATRICE PILIFERA (VALENZA CLINICA)', 'Altro', 250.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cannarecchia-sorghum-halepense-ige-specifiche', 'CANNARECCHIA (SORGHUM HALEPENSE) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('capesanta-ige-specifiche', 'CAPESANTA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('carbamazepina', 'CARBAMAZEPINA', 'Altro', 15.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('carbossiemoglobina', 'CARBOSSIEMOGLOBINA', 'Ematologia', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('carcinoma-cellule-squamose-scc-ta4', 'CARCINOMA CELLULE SQUAMOSE (SCC) (TA4)', 'Altro', 85.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cariotipo-metafase-linfocitario', 'CARIOTIPO METAFASE LINFOCITARIO', 'Altro', 180.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cariotipo-su-sangue-periferico-citogenetica-classi', 'Cariotipo su sangue periferico (citogenetica classica)', 'Altro', 99.0, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('carne-bovina-ige-specifiche', 'CARNE BOVINA (IgE SPECIFICHE)', 'Autoimmunità', 14.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('carne-di-bue-ige-specifiche', 'CARNE DI BUE (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('carne-di-coniglio-ige-specifiche', 'CARNE DI CONIGLIO (IgE SPECIFICHE)', 'Autoimmunità', 14.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('carne-di-montone-ige-specifiche', 'CARNE DI MONTONE (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('carne-di-pollo-ige-specifiche', 'CARNE DI POLLO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('carne-di-tacchino-ige-specifiche', 'CARNE DI TACCHINO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('carota-ige-specifiche', 'CAROTA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('carpino-bianco-carpinus-betulus-ige-specifiche', 'CARPINO BIANCO (CARPINUS BETULUS) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('carrieradvance-plus-pannello-di-coppia', 'CARRIERADVANCE PLUS (Pannello di coppia)', 'Altro', 490.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('caseina-ige-specifiche', 'CASEINA (IgE SPECIFICHE)', 'Autoimmunità', 15.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('castagna-ige-specifiche', 'CASTAGNA (IgE SPECIFICHE)', 'Epatico', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('catecolamine-urinarie-24h', 'CATECOLAMINE URINARIE 24H', 'Altro', 35.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('catene-leggere-kappa-e-lambda-siero', 'CATENE LEGGERE KAPPA E LAMBDA SIERO', 'Altro', 46.8, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cavolini-di-bruxelles-ige-specifiche', 'CAVOLINI DI BRUXELLES (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cavolo-ige-specifiche', 'CAVOLO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cdt-transferrina-carboidrato-carente-desialata', 'CDT - TRANSFERRINA CARBOIDRATO CARENTE DESIALATA', 'Ematologia', 45.0, '48-72h', '{"anemia"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ceruloplasmina', 'CERULOPLASMINA', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cetriolo-ige-specifiche', 'CETRIOLO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-uomo-analisi', 'CHECK UOMO ANALISI', 'Autoimmunità', 98.0, '48-72h', '{"dolori_articolari"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-bambino', 'Check up  BAMBINO', 'Altro', 59.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-uomo-under-40', 'Check up  uomo under 40', 'Altro', 75.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-base', 'Check Up base', 'Altro', 55.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-donna', 'CHECK UP DONNA', 'Altro', 113.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-donna-over-40', 'Check up donna over 40', 'Altro', 125.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-pre-gravidanza', 'CHECK UP PRE GRAVIDANZA', 'Altro', 185.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-profilo-epatico', 'CHECK UP PROFILO EPATICO', 'Altro', 75.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-renale', 'CHECK UP RENALE', 'Autoimmunità', 29.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-sport', 'CHECK UP SPORT', 'Altro', 81.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-tiroide-base', 'Check up Tiroide base', 'Tiroide', 37.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-tiroide-plus', 'Check up Tiroide Plus', 'Tiroide', 87.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-uomo-dirigenti-bds', 'check up uomo dirigenti bds', 'Autoimmunità', 57.34, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-uomo-over-40', 'Check up uomo over 40', 'Altro', 124.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-uomo-platamona', 'CHECK UP UOMO PLATAMONA', 'Altro', 114.04, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-cardio-pre-visita', 'Check-Up Cardio (pre visita)', 'Altro', 112.73, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('check-up-donna-under-40', 'Check-up donna under 40', 'Altro', 97.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('chimotripsina-feci', 'CHIMOTRIPSINA (FECI)', 'Fecale', 29.0, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cicloesano-urine-f-t', 'CICLOESANO URINE F.T.', 'Renale', 28.4, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cicloesanolo-urine-f-t', 'CICLOESANOLO URINE F.T.', 'Renale', 28.4, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ciclosporina', 'CICLOSPORINA', 'Altro', 30.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ciliegia-ige-specifiche', 'CILIEGIA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cioccolato-ige-specifiche', 'CIOCCOLATO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cipolla-ige-specifiche', 'CIPOLLA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cipresso-cupressus-sempervirens-ige-specifiche', 'CIPRESSO (CUPRESSUS SEMPERVIRENS) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cistatina-c', 'CISTATINA C', 'Renale', 21.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cisticercosi-tenia-solium-anticorpi', 'CISTICERCOSI (TENIA SOLIUM) ANTICORPI', 'Autoimmunità', 148.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cistina-urinaria', 'CISTINA URINARIA', 'Altro', 121.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('citomegalovirus-avidita-igg', 'CITOMEGALOVIRUS AVIDITA'' IgG', 'Autoimmunità', 35.5, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('citomegalovirus-dna-quantitativo', 'CITOMEGALOVIRUS DNA QUANTITATIVO', 'Infettivologia', 70.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('citrato-urine-24h', 'CITRATO URINE 24H', 'Renale', 19.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ckmb', 'ckmb', 'Cardiologico', 18.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ck-mb', 'CK-MB', 'Cardiologico', 18.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ck-mb-massa', 'CK-MB MASSA', 'Cardiologico', 55.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cladosporium-herbarum-ige-specifiche', 'CLADOSPORIUM HERBARUM (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('clearance-della-creatinina', 'CLEARANCE DELLA CREATININA', 'Renale', 5.0, '24h', '{"controllo_reni"}'::TEXT[], false, NULL, 'renale', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cloro', 'CLORO', 'Elettroliti', 5.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cloro-urine-24h', 'CLORO URINE 24H', 'Renale', 3.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cloroformio-urine-f-t', 'CLOROFORMIO URINE F.T.', 'Renale', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('clostridium-difficile-ricerca-tossina-a-e-b', 'CLOSTRIDIUM DIFFICILE RICERCA TOSSINA A e B', 'Altro', 43.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('clostridium-difficile-ricerca-tossina-b', 'CLOSTRIDIUM DIFFICILE RICERCA TOSSINA B', 'Altro', 43.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('clozapina-sierica', 'CLOZAPINA SIERICA', 'Altro', 79.8, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cobalto-plasmatico', 'COBALTO PLASMATICO', 'Epatico', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cobalto-urine-f-t', 'COBALTO URINE F.T.', 'Epatico', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cobalto-urine-i-t', 'COBALTO URINE I.T.', 'Epatico', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cocaina-test-di-conferma', 'COCAINA - TEST DI CONFERMA', 'Altro', 168.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cocaina-matrice-pilifera-valenza-clinica', 'COCAINA MATRICE PILIFERA (VALENZA CLINICA)', 'Altro', 200.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('coda-di-topo-phleum-pratense-ige-specifiche', 'CODA DI TOPO (PHLEUM PRATENSE) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('codina-dei-prati-alopecurus-pratensis-ige-specific', 'CODINA DEI PRATI (ALOPECURUS PRATENSIS) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('coenzima-q10', 'COENZIMA Q10', 'Altro', 123.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('colesterolo-non-hdl', 'COLESTEROLO NON HDL', 'Lipidico', 1.85, '48h', '{"aumento_peso", "controllo_cuore", "menopausa"}'::TEXT[], true, 'A digiuno da 12 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('colesterolo-vldl', 'COLESTEROLO VLDL', 'Lipidico', 40.0, '48h', '{"aumento_peso", "controllo_cuore", "menopausa"}'::TEXT[], true, 'A digiuno da 12 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('colinesterasi-che', 'COLINESTERASI (CHE)', 'Altro', 3.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('colinesterasi-pseudocolinesterasi', 'COLINESTERASI (PSEUDOCOLINESTERASI)', 'Altro', 3.8, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('colinesterasi-eritrocitaria', 'COLINESTERASI ERITROCITARIA', 'Ematologia', 23.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('complemento-c1q', 'COMPLEMENTO C1q', 'Infiammazione', 31.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('complemento-c3', 'COMPLEMENTO C3', 'Infiammazione', 8.3, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('complemento-c3-proattivatore', 'COMPLEMENTO C3 PROATTIVATORE', 'Infiammazione', 10.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('complemento-c4', 'COMPLEMENTO C4', 'Infiammazione', 8.3, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('conta-eosinofili', 'CONTA EOSINOFILI', 'Altro', 4.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('copeptina-pro-avp', 'COPEPTINA PRO AVP', 'Coagulazione', 84.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cortisolo-plasmatico', 'CORTISOLO PLASMATICO', 'Ormoni', 16.0, '48-72h', '{"aumento_peso", "stanchezza", "perdita_capelli", "insonnia", "ansia_stress"}'::TEXT[], false, 'Prelievo mattutino ore 8-9', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cortisolo-salivare', 'Cortisolo Salivare', 'Ormoni', 36.0, '48-72h', '{"aumento_peso", "stanchezza", "perdita_capelli", "insonnia", "ansia_stress"}'::TEXT[], false, 'Prelievo mattutino ore 8-9', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cortisolo-urine-24h', 'CORTISOLO URINE 24H', 'Renale', 12.0, '24h', '{"aumento_peso", "stanchezza", "perdita_capelli", "gravidanza", "insonnia", "controllo_reni", "ansia_stress"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('coxackie-virus-b1-b2-b3-b4-b5-b6-anticorpi-igg', 'COXACKIE VIRUS (B1 B2 B3 B4 B5 B6) ANTICORPI IgG', 'Autoimmunità', 130.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('coxackie-virus-b1-b2-b3-b4-b5-b6-anticorpi-igm', 'COXACKIE VIRUS (B1 B2 B3 B4 B5 B6) ANTICORPI IgM', 'Autoimmunità', 120.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('creatinchinasi-ck', 'CREATINCHINASI (CK)', 'Renale', 2.5, '24h', '{"controllo_reni"}'::TEXT[], false, NULL, 'renale', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('creatinina-urinaria', 'CREATININA URINARIA', 'Renale', 2.8, '24h', '{"controllo_reni"}'::TEXT[], false, NULL, 'renale', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('creatinuria-urine-24h', 'CREATINURIA URINE 24H', 'Renale', 3.2, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('crioglobuline', 'CRIOGLOBULINE', 'Altro', 8.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('criptomeria-cryptomeria-japonica-ige-specifiche', 'CRIPTOMERIA (CRYPTOMERIA JAPONICA) (IgE SPECIFICHE)', 'Coagulazione', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cromo-ematico', 'CROMO EMATICO', 'Altro', 15.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cromo-urine-f-t', 'CROMO URINE F.T.', 'Renale', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cromo-urine-i-t', 'CROMO URINE I.T.', 'Renale', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cromogranina-a', 'CROMOGRANINA A', 'Altro', 79.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('crostacei-ige', 'CROSTACEI (IGE)', 'Autoimmunità', 18.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cumino-ige-specifiche', 'CUMINO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cupremia-rame', 'CUPREMIA (RAME)', 'Vitamina/Minerali', 9.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cupruria-urine-24h', 'CUPRURIA (URINE 24H)', 'Renale', 10.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('curry-ige-specifiche', 'CURRY (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('curva-da-carico-di-glucosio', 'Curva da carico di GLUCOSIO', 'Glicemia/Diabete', 50.0, '24h', '{"aumento_peso", "stanchezza", "dimagrimento", "gravidanza"}'::TEXT[], true, 'A digiuno da 8-12 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('curva-da-carico-di-glucosio-arancia', 'Curva da carico di GLUCOSIO (ARANCIA)', 'Glicemia/Diabete', 75.0, '24h', '{"aumento_peso", "stanchezza", "dimagrimento", "gravidanza"}'::TEXT[], true, 'A digiuno da 8-12 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('curva-insulinemica', 'CURVA INSULINEMICA', 'Glicemia/Diabete', 45.0, '48-72h', '{"aumento_peso"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('curva-insulinemica-6-determinazioni', 'Curva insulinemica 6 determinazioni', 'Glicemia/Diabete', 60.0, '48-72h', '{"aumento_peso"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('cyfra-21-1', 'CYFRA 21-1', 'Altro', 27.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dao-test', 'DAO TEST', 'Altro', 112.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('d-dimero', 'D-DIMERO', 'Coagulazione', 13.5, 'urgente', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('delta-4-androstenedione', 'DELTA-4-ANDROSTENEDIONE', 'Ormoni', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dengue-igg', 'DENGUE IgG', 'Autoimmunità', 41.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dengue-igm', 'DENGUE IgM', 'Autoimmunità', 41.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dente-di-leone-taraxacum-vulgare-ige-specifiche', 'DENTE DI LEONE (TARAXACUM VULGARE) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dermatofiti-cute-tampone', 'DERMATOFITI CUTE TAMPONE', 'Infettivologia', 55.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dermatophagoides-farinae-ige-specifiche', 'DERMATOPHAGOIDES FARINAE (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dermatophagoides-microceras-ige-specifiche', 'DERMATOPHAGOIDES MICROCERAS (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dermatophagoides-pteronyssinus-ige-specifiche', 'DERMATOPHAGOIDES PTERONYSSINUS (IgE SPECIFICHE)', 'Coagulazione', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('desossipiridinolina-urine-24h', 'DESOSSIPIRIDINOLINA URINE 24H', 'Renale', 45.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dhea-deidroepiandrosterone', 'DHEA (DEIDROEPIANDROSTERONE)', 'Ormoni', 12.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dhea-s-deidroepiandrosterone-solfato', 'DHEA-S (DEIDROEPIANDROSTERONE SOLFATO)', 'Ormoni', 17.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('diagnosi-molecolare-di-emocromatosi-varianti-c282y', 'DIAGNOSI MOLECOLARE DI EMOCROMATOSI (VARIANTI C282Y E H63D NEL GENE HFE)', 'Ematologia', 235.0, '24h', '{"stanchezza", "dimagrimento", "gravidanza", "anemia", "palpitazioni", "infezioni_frequenti"}'::TEXT[], false, NULL, 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('digossina', 'DIGOSSINA', 'Altro', 16.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('diidrotestosterone-dht', 'DIIDROTESTOSTERONE (DHT)', 'Ormoni', 30.0, '48-72h', '{"perdita_capelli", "infertilita", "controllo_prostata"}'::TEXT[], false, NULL, 'uomo-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('disbiosi-test', 'DISBIOSI TEST', 'Altro', 90.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('disomia-uniparentale-upd-family-test', 'DISOMIA UNIPARENTALE (UPD)- FAMILY TEST', 'Altro', 320.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('distrofia-miotonica-dmpk', 'DISTROFIA MIOTONICA- DMPK', 'Altro', 130.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('distrofia-muscolare-dmd-dmb-mpla-test', 'DISTROFIA MUSCOLARE DMD/DMB - MPLA TEST', 'Altro', 200.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dopamina', 'DOPAMINA', 'Altro', 39.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dopamina-urine-24h', 'DOPAMINA URINE 24H', 'Renale', 31.9, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('dosaggio-prolattina', 'DOSAGGIO PROLATTINA', 'Ormoni', 15.0, '48-72h', '{"infertilita"}'::TEXT[], false, 'A riposo, evitare stress', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('drom-test', 'DROM TEST', 'Altro', 37.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('drug-test-2-livello', 'DRUG TEST 2 LIVELLO', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('drug-test', 'DRUG-TEST', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('e-coli-o-157-nelle-feci', 'E. COLI O:157 NELLE FECI', 'Fecale', 35.0, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ebna', 'EBNA', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('echiniococco-igg', 'ECHINIOCOCCO IGG', 'Autoimmunità', 26.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('echinococco-abs-screening', 'ECHINOCOCCO ABS SCREENING', 'Altro', 16.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ecp-proteina-cationica-eosinofila-ecp', 'ECP Proteina Cationica Eosinofila (ECP)', 'Altro', 79.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('egfr-velocit-di-filtrazione-glomerulare', 'eGFR - Velocità di Filtrazione Glomerulare', 'Renale', 5.5, '48-72h', '{"controllo_reni"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('elastasi-1-pancreatica-fecale', 'ELASTASI 1 PANCREATICA FECALE', 'Epatico', 50.0, '48-72h', '{"problemi_digestivi"}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('elettroforesi-emoglobina-hb', 'ELETTROFORESI EMOGLOBINA (Hb)', 'Ematologia', 13.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('elettroforesi-proteica', 'ELETTROFORESI PROTEICA', 'Altro', 10.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('elettroforesi-proteine-urinarie', 'ELETTROFORESI PROTEINE URINARIE', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('emocromatosi', 'EMOCROMATOSI', 'Ematologia', 130.0, '24h', '{"stanchezza", "dimagrimento", "gravidanza", "anemia", "palpitazioni", "infezioni_frequenti"}'::TEXT[], false, NULL, 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('emocromo', 'Emocromo', 'Ematologia', 6.5, '24h', '{"stanchezza", "dimagrimento", "gravidanza", "anemia", "palpitazioni", "infezioni_frequenti"}'::TEXT[], false, NULL, 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('emocromo-in-citrato', 'EMOCROMO IN CITRATO', 'Ematologia', 8.0, '24h', '{"stanchezza", "dimagrimento", "gravidanza", "anemia", "palpitazioni", "infezioni_frequenti"}'::TEXT[], false, NULL, 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('emoglobina-glicata-hba1c', 'EMOGLOBINA GLICATA (HbA1c)', 'Ematologia', 12.0, '48-72h', '{"aumento_peso"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('emopessina', 'EMOPESSINA', 'Altro', 30.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ena-antigene-ssb-la-abs', 'ENA ANTIGENE SSB (LA) ABS', 'Autoimmunità', 21.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ena-profile', 'ENA PROFILE', 'Autoimmunità', 150.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('endobiome-endometrial-microbiome-analysis', 'ENDOBIOME Endometrial microbiome analysis', 'Autoimmunità', 280.0, '48-72h', '{"dolori_articolari"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('endorecept-endobiome', 'Endorecept + Endobiome', 'Coagulazione', 880.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('endorecept-endometrial-receptivity-test', 'Endorecept Endometrial receptivity test', 'Coagulazione', 600.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('enolasi-neuronale-specifica-nse', 'ENOLASI NEURONALE SPECIFICA (NSE)', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('enterovirus-poliovirus-anticorpi', 'ENTEROVIRUS (POLIOVIRUS) ANTICORPI', 'Autoimmunità', 123.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epatite-e-igg', 'EPATITE E IgG', 'Epatico', 58.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epitelio-cane-ige-specifiche', 'EPITELIO CANE (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epitelio-coniglio-ige-specifiche', 'EPITELIO CONIGLIO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epitelio-di-capra-ige-specifiche', 'EPITELIO DI CAPRA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epitelio-di-cavia-ige-specifiche', 'EPITELIO DI CAVIA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epitelio-di-criceto-ige-specifiche', 'EPITELIO DI CRICETO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epitelio-di-maiale-ige-specifiche', 'EPITELIO DI MAIALE (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epitelio-di-pecora', 'EPITELIO DI PECORA', 'Altro', 18.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epitelio-di-ratto-ige-specifiche', 'EPITELIO DI RATTO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epitelio-di-topo-ige-specifiche', 'EPITELIO DI TOPO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epitelio-gatto-ige-specifiche', 'EPITELIO GATTO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epitelio-lana-di-pecora-ige-specifiche', 'EPITELIO/LANA DI PECORA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('epstein-barr-virus-dna', 'EPSTEIN BARR VIRUS DNA', 'Infettivologia', 108.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('erba-canina-cynodon-dactylon-ige-specifiche', 'ERBA CANINA (CYNODON DACTYLON) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('erba-cannuccia-agrostis-alba-ige-specifiche', 'ERBA CANNUCCIA (AGROSTIS ALBA) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('erba-mazzolina-dactylis-glomerata-ige-specifiche', 'ERBA MAZZOLINA (DACTYLIS GLOMERATA) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('erba-parietaria-ige-specifiche', 'ERBA PARIETARIA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('erba-vetriola-parietaria-officinalis-ige-specifich', 'ERBA VETRIOLA (PARIETARIA OFFICINALIS) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('eritropoietina', 'ERITROPOIETINA', 'Altro', 22.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame', 'ESAME', 'Altro', 9.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-chimico-del-calcolo-renale', 'ESAME CHIMICO DEL CALCOLO RENALE', 'Autoimmunità', 35.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-chimico-fisico-delle-urine', 'ESAME CHIMICO FISICO DELLE URINE', 'Renale', 5.95, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-citologico-urine', 'ESAME CITOLOGICO URINE', 'Renale', 60.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-citologico-urine-campione-1', 'ESAME CITOLOGICO URINE CAMPIONE 1', 'Renale', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-citologico-urine-campione-2', 'ESAME CITOLOGICO URINE CAMPIONE 2', 'Renale', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-citologico-urine-campione-3', 'ESAME CITOLOGICO URINE CAMPIONE 3', 'Renale', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-ricerca-clamydia-su-tampone-vagina', 'ESAME COLTURALE  RICERCA CLAMYDIA su TAMPONE VAGINALE', 'Infettivologia', 9.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-clostridium-difficile', 'ESAME COLTURALE CLOSTRIDIUM DIFFICILE', 'Altro', 35.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-del-liquido-articolare', 'ESAME COLTURALE DEL LIQUIDO ARTICOLARE', 'Altro', 70.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-delle-feci-coprocoltura-completo', 'ESAME COLTURALE DELLE FECI (COPROCOLTURA) COMPLETO', 'Fecale', 22.0, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-dell-urina-urinocoltura', 'ESAME COLTURALE DELL''URINA (URINOCOLTURA)', 'Altro', 12.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-materiale-liquido', 'ESAME COLTURALE MATERIALE LIQUIDO', 'Altro', 50.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-pus', 'ESAME COLTURALE PUS', 'Altro', 70.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-squame-cutanee', 'ESAME COLTURALE SQUAME CUTANEE', 'Altro', 9.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-anale', 'ESAME COLTURALE TAMPONE ANALE', 'Autoimmunità', 40.0, '48-72h', '{"dolori_articolari"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-auricolare-destro', 'ESAME COLTURALE TAMPONE AURICOLARE DESTRO', 'Infettivologia', 18.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-auricolare-sinistro', 'ESAME COLTURALE TAMPONE AURICOLARE SINISTRO', 'Infettivologia', 18.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-balano-prepuziale-completo', 'ESAME COLTURALE TAMPONE BALANO PREPUZIALE COMPLETO', 'Infettivologia', 55.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-cervicale', 'ESAME COLTURALE TAMPONE CERVICALE', 'Infettivologia', 8.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-congiuntivale-destro', 'ESAME COLTURALE TAMPONE CONGIUNTIVALE DESTRO', 'Infettivologia', 35.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-congiuntivale-sinistro', 'ESAME COLTURALE TAMPONE CONGIUNTIVALE SINISTRO', 'Infettivologia', 35.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-cutaneo', 'ESAME COLTURALE TAMPONE CUTANEO', 'Infettivologia', 28.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-faringeo', 'ESAME COLTURALE TAMPONE FARINGEO', 'Infettivologia', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-faringeo-completo', 'ESAME COLTURALE TAMPONE FARINGEO COMPLETO', 'Infettivologia', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-faringeo-per-ricerca-micet', 'ESAME COLTURALE TAMPONE FARINGEO per RICERCA MICETI', 'Infettivologia', 18.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-faringeo-per-ricerca-stafi', 'ESAME COLTURALE TAMPONE FARINGEO PER RICERCA STAFILOCOCCO', 'Infettivologia', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-faringeo-per-ricerca-strep', 'ESAME COLTURALE TAMPONE FARINGEO PER RICERCA STREPTOCOCCO', 'Coagulazione', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-gengivale', 'ESAME COLTURALE TAMPONE GENGIVALE', 'Infettivologia', 40.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-linguale', 'ESAME COLTURALE TAMPONE LINGUALE', 'Infettivologia', 35.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-narice-destra', 'ESAME COLTURALE TAMPONE NARICE DESTRA', 'Infettivologia', 30.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-narice-sinistra', 'ESAME COLTURALE TAMPONE NARICE SINISTRA', 'Infettivologia', 30.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-orale', 'ESAME COLTURALE TAMPONE ORALE', 'Infettivologia', 40.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-rinofaringeo', 'ESAME COLTURALE TAMPONE RINOFARINGEO', 'Infettivologia', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-uretrale', 'ESAME COLTURALE TAMPONE URETRALE', 'Infettivologia', 12.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-uretrale-per-ricerca-mycop', 'ESAME COLTURALE TAMPONE URETRALE  PER RICERCA MYCOPLASMA E UREAPLASMA', 'Renale', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-vaginale', 'ESAME COLTURALE TAMPONE VAGINALE', 'Infettivologia', 9.8, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-colturale-tampone-vulvare', 'ESAME COLTURALE TAMPONE VULVARE', 'Infettivologia', 10.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-del-liquido-articolare', 'ESAME DEL LIQUIDO ARTICOLARE', 'Altro', 55.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-delle-urine', 'ESAME DELLE URINE', 'Renale', 5.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-micologico', 'ESAME MICOLOGICO', 'Altro', 9.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-micologico-unghie', 'ESAME MICOLOGICO UNGHIE', 'Altro', 9.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-microbiologico-prp-plasma-ricco-di-piastrine', 'ESAME MICROBIOLOGICO PRP (Plasma Ricco di Piastrine)', 'Ematologia', 40.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esame-microscopico-tampone-vaginale', 'ESAME MICROSCOPICO TAMPONE VAGINALE', 'Infettivologia', 12.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esami-check-up-banco-di-sardegna-donna-dirigenti', 'Esami check up banco di Sardegna Donna dirigenti', 'Autoimmunità', 56.29, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esami-laboratorio-terna', 'Esami Laboratorio Terna', 'Altro', 93.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esami-laboratorio-terna-metalli', 'Esami Laboratorio Terna Metalli', 'Altro', 163.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esami-medicina-del-lavoro-base', 'Esami medicina del lavoro base', 'Altro', 25.48, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esami-prima-visita-torres-professionisti', 'Esami prima visita Torres professionisti', 'Altro', 140.73, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esano-urine-f-t', 'ESANO URINE F.T.', 'Renale', 6.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('escrementi-di-piccione-ige-specifiche', 'ESCREMENTI DI PICCIONE (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esecuzione-tampone-rinofaringeo', 'ESECUZIONE TAMPONE RINOFARINGEO', 'Infettivologia', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('esecuzione-tampone-uretrale', 'ESECUZIONE TAMPONE URETRALE', 'Infettivologia', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('espettorato-esame-colturale', 'ESPETTORATO ESAME COLTURALE', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('estradiolo', 'ESTRADIOLO', 'Ormoni', 8.5, '48-72h', '{"menopausa", "infertilita"}'::TEXT[], false, NULL, 'donna-over40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('estriolo', 'ESTRIOLO', 'Ormoni', 24.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('estriolo-non-coniugato', 'ESTRIOLO NON CONIUGATO', 'Ormoni', 14.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('estrone-e1', 'ESTRONE (E1)', 'Altro', 39.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('etanolo-urinario', 'ETANOLO URINARIO', 'Urinario', 19.3, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('etanolo-urine-f-t', 'ETANOLO URINE F.T.', 'Renale', 19.3, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('etg-matrice-pilifera', 'ETG MATRICE PILIFERA', 'Altro', 200.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('etilglucuronide-matrice-pilifera-etg', 'Etilglucuronide matrice pilifera (ETG)', 'Altro', 180.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('etosuccimide', 'ETOSUCCIMIDE', 'Altro', 45.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('euroglyphus-mayne-acari-minori-ige-specifiche', 'EUROGLYPHUS MAYNE (Acari minori) (IGE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('faggio-fagus-species-ige-specifiche', 'FAGGIO (FAGUS SPECIES) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fagiolini-ige-specifiche', 'FAGIOLINI (IgE SPECIFICHE)', 'Autoimmunità', 20.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fagiolo-ige-specifiche', 'FAGIOLO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fagiolo-rosso-ige-specifiche', 'FAGIOLO ROSSO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('falsa-ambrosia-ambrosia-acanthicarpa-ige-specifich', 'FALSA AMBROSIA (AMBROSIA ACANTHICARPA) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('farina-ige-specifiche', 'FARINA (IgE SPECIFICHE)', 'Autoimmunità', 14.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('farinaccio-chenopodium-album-ige-specifiche', 'FARINACCIO (CHENOPODIUM ALBUM) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fattore-ii-della-coagulazione', 'Fattore II della Coagulazione', 'Altro', 28.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fattore-v-di-leiden-mutazione-g1691a', 'Fattore V di Leiden (mutazione G1691A)', 'Genetica/Molecolare', 50.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fattore-v-di-leiden-fattore-ii-mthfr-c677', 'Fattore V di Leiden + Fattore II + MTHFR C677', 'Altro', 196.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fattore-viii', 'FATTORE VIII', 'Altro', 27.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fattore-x', 'FATTORE X', 'Altro', 51.3, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fattore-xiii', 'FATTORE XIII', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('feci-esame-chimico-fisico-parassitologico', 'FECI ESAME CHIMICO-FISICO-PARASSITOLOGICO', 'Fecale', 11.5, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fenciclidina-matrice-urinaria', 'FENCICLIDINA MATRICE URINARIA', 'Altro', 30.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fenilalanina-plasmatica', 'FENILALANINA Plasmatica', 'Altro', 121.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fenitoina-dintoina-difenilidantoina', 'FENITOINA (DINTOINA) (DIFENILIDANTOINA)', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fenolo-urine-f-t', 'FENOLO URINE F.T.', 'Renale', 22.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ferro-urinario', 'FERRO URINARIO', 'Ematologia', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ferro-urine-24h', 'FERRO URINE 24H', 'Ematologia', 15.9, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ferro-urine-f-t', 'FERRO URINE F.T.', 'Ematologia', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fibrinogeno', 'FIBRINOGENO', 'Coagulazione', 4.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fibrosi-cistica-139-mutazioni-europe', 'FIBROSI CISTICA (139 mutazioni Europe)', 'Genetica/Molecolare', 145.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fibrosi-cistica-152-mutazioni-europe-di-cui-25-ita', 'Fibrosi Cistica (152 mutazioni Europe di cui 25 Italiane) - NGS CE-IVD', 'Genetica/Molecolare', 165.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fibrosi-cistica-sequenziamento-completo', 'Fibrosi Cistica- sequenziamento completo', 'Altro', 315.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fish-advance-sper-aneuploidy-test', 'Fish Advance Sper Aneuploidy Test', 'Altro', 240.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fk506-tacrolimus', 'FK506 (TACROLIMUS)', 'Altro', 110.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('forfora-cane-ige-specifiche', 'FORFORA CANE (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('forfora-cavallo-ige-specifiche', 'FORFORA CAVALLO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('forfora-mucca-ige-specifiche', 'FORFORA MUCCA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('formaggio-fermentato-ige-specifiche', 'FORMAGGIO FERMENTATO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('formaggio-molle-ige-specifiche', 'FORMAGGIO MOLLE (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('formica-solenopsis-invicta-ige-specifiche', 'FORMICA (SOLENOPSIS INVICTA) (IgE SPECIFICHE)', 'Autoimmunità', 25.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fosfatasi-acida-totale', 'FOSFATASI ACIDA TOTALE', 'Altro', 10.0, '48-72h', '{"controllo_fegato"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fosfatasi-alcalina', 'FOSFATASI ALCALINA', 'Epatico', 3.8, '48-72h', '{"controllo_fegato"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fosfatasi-alcalina-ossea-specifica', 'FOSFATASI ALCALINA OSSEA SPECIFICA', 'Epatico', 35.0, '48-72h', '{"controllo_fegato"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fosfatasi-prostatica-pap', 'FOSFATASI PROSTATICA (PAP)', 'Altro', 35.0, '48-72h', '{"controllo_fegato"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fosfaturia-urine-24h', 'FOSFATURIA URINE 24H', 'Renale', 3.8, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fosforo', 'FOSFORO', 'Elettroliti', 2.8, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fragola-ige-specifiche', 'FRAGOLA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('frammentazione-dna', 'FRAMMENTAZIONE DNA', 'Genetica/Molecolare', 250.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('frassino-fraxinus-species-ige-specifiche', 'FRASSINO (FRAXINUS SPECIES) (IgE SPECIFICHE)', 'Autoimmunità', 25.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('free-beta-hcg-per-bitest', 'FREE BETA HCG per BITEST', 'Ormoni', 8.2, '48-72h', '{"gravidanza"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fruttosamina', 'FRUTTOSAMINA', 'Glicemia/Diabete', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('funghi-champignon-ige-specifiche', 'FUNGHI CHAMPIGNON (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('fusarium-moniliforme-ige-specifiche', 'FUSARIUM MONILIFORME (IgE SPECIFICHE)', 'Autoimmunità', 25.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('g6pd-analisi-genetica', 'G6PD ANALISI GENETICA', 'Autoimmunità', 690.0, '7-15gg', '{"dolori_articolari"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gad-65-anticorpi-anti-decarbossilasi-dell-acido-gl', 'GAD 65 (ANTICORPI ANTI-DECARBOSSILASI DELL''ACIDO GLUTAMICO)', 'Autoimmunità', 65.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gal-d1-ige-specifiche-ovomucoide', 'Gal d1 IgE Specifiche (ovomucoide)', 'Autoimmunità', 122.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gal-d2-ige-specifiche-ovoalbumina', 'Gal d2 IgE Specifiche (ovoalbumina)', 'Epatico', 12.5, '48-72h', '{"controllo_fegato", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gambero-ige-specifiche', 'GAMBERO (IgE SPECIFICHE)', 'Autoimmunità', 18.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gamma-glutamiltransferasi', 'GAMMA GLUTAMILTRANSFERASI', 'Altro', 2.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gastrina', 'GASTRINA', 'Epatico', 15.6, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gastropanel', 'GASTROPANEL', 'Epatico', 180.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gelso-bianco-morus-alba-ige-specifiche', 'GELSO BIANCO (MORUS ALBA) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gene-fattore-ii-protrombina-ricerca-della-mutazion', 'GENE FATTORE II (PROTROMBINA): RICERCA DELLA MUTAZIONE G20210A', 'Coagulazione', 98.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gene-jak2-identificazione-qualitativa-di-v617f', 'GENE JAK2 : IDENTIFICAZIONE QUALITATIVA DI V617F', 'Altro', 240.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gene-pai-1-ricerca-della-variazione-4g-5g', 'Gene PAI-1 Ricerca della variazione 4G/5G', 'Altro', 98.3, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('giallone-vespula-species-ige-specifiche', 'GIALLONE (VESPULA SPECIES) (IgE SPECIFICHE)', 'Infiammazione', 12.5, '48-72h', '{"dimagrimento", "dolori_articolari", "allergie", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('giardia-intestinalis-ricerca-antigene-nelle-feci', 'GIARDIA INTESTINALIS RICERCA ANTIGENE NELLE FECI', 'Autoimmunità', 25.0, '48-72h', '{"allergie"}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ginepro-sabina-juniperus-sabinoides-ige-specifiche', 'GINEPRO SABINA (JUNIPERUS SABINOIDES) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('glicosuria', 'GLICOSURIA', 'Altro', 3.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('glucagone', 'GLUCAGONE', 'Altro', 75.4, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('glucosio', 'GLUCOSIO', 'Glicemia/Diabete', 1.99, '24h', '{"aumento_peso", "stanchezza", "dimagrimento", "gravidanza"}'::TEXT[], true, 'A digiuno da 8-12 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('glucosio-0-60-120', 'GLUCOSIO 0''60''120''', 'Glicemia/Diabete', 35.0, '24h', '{"aumento_peso", "stanchezza", "dimagrimento", "gravidanza"}'::TEXT[], true, 'A digiuno da 8-12 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('glucosio-6-fosfatodeidrogenasi-g-6-pdh-eritrocitar', 'GLUCOSIO-6-FOSFATODEIDROGENASI (G-6-PDH) ERITROCITARIA', 'Ematologia', 13.0, '24h', '{"aumento_peso", "stanchezza", "dimagrimento", "gravidanza"}'::TEXT[], true, 'A digiuno da 8-12 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('glutammato-deidrogenasi-clostridium-difficile-gdh', 'GLUTAMMATO DEIDROGENASI (CLOSTRIDIUM  DIFFICILE GDH)', 'Autoimmunità', 21.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('glutatione-perossidasi', 'GLUTATIONE PEROSSIDASI', 'Altro', 73.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('glutatione-sangue-intero', 'GLUTATIONE SANGUE INTERO', 'Altro', 60.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('glutine-ige-specifiche', 'GLUTINE (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('glycyphagus-domesticus-ige-specifiche', 'GLYCYPHAGUS DOMESTICUS (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gramigna-dei-prati-poa-pratensis-ige-specifiche', 'GRAMIGNA DEI PRATI (POA PRATENSIS) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('granchio-ige-specifiche', 'GRANCHIO (IgE SPECIFICHE)', 'Autoimmunità', 18.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('grano-ige-specifiche', 'GRANO (IgE SPECIFICHE)', 'Autoimmunità', 14.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('grano-triticum-sativum-ige-specifiche', 'GRANO (TRITICUM SATIVUM) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('grano-saraceno-ige-specifiche', 'GRANO SARACENO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('gruppo-sanguigno-fattore-rh', 'GRUPPO SANGUIGNO FATTORE RH', 'Altro', 8.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hb-emoglobine-anomale-hbs-hbd-hbh-ecc', 'HB EMOGLOBINE ANOMALE (HBS, HBD, HBH, ECC)', 'Ematologia', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hbsag-test-di-conferma', 'HBsAg - TEST DI CONFERMA', 'Infettivologia', 22.0, '48-72h', '{"gravidanza", "controllo_fegato"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hbsag-antigene-australia', 'HBsAg (ANTIGENE AUSTRALIA)', 'Autoimmunità', 10.0, '48-72h', '{"gravidanza", "controllo_fegato", "allergie"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hbsag-antigene-di-superficie-virus-epatite-b-quant', 'HBSAG (ANTIGENE DI SUPERFICIE VIRUS EPATITE B) QUANTITATIVO', 'Epatico', 41.0, '48-72h', '{"gravidanza", "controllo_fegato", "allergie"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hbsag-ultra', 'HBsAg ULTRA', 'Infettivologia', 25.0, '48-72h', '{"gravidanza", "controllo_fegato"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hbv-dna-genotipo', 'HBV DNA Genotipo', 'Genetica/Molecolare', 245.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hbv-dna-quantitativo', 'HBV DNA QUANTITATIVO', 'Genetica/Molecolare', 75.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hcv-rna-genotipo', 'HCV RNA GENOTIPO', 'Infettivologia', 157.3, '48-72h', '{"controllo_fegato"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('he4-ovarian-cancer-marker', 'HE4 (OVARIAN CANCER MARKER)', 'Tumore/Markers', 95.0, '3-5gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('helicobacter-pylori-ricerca-antigene-nelle-feci', 'HELICOBACTER PYLORI RICERCA ANTIGENE NELLE FECI', 'Autoimmunità', 12.9, '48-72h', '{"problemi_digestivi", "allergie"}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hiv-1-rna-quantitativo', 'HIV 1 RNA QUANTITATIVO', 'Infettivologia', 157.3, '48-72h', '{"gravidanza"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hiv-1-2-riba-test-di-conferma', 'HIV 1/2 RIBA - TEST DI CONFERMA', 'Infettivologia', 144.2, '48-72h', '{"gravidanza"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hiv-anticorpi-antigene-p24', 'HIV ANTICORPI - ANTIGENE P24', 'Autoimmunità', 100.0, '48-72h', '{"gravidanza", "allergie"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hiv-anticorpo-antigene', 'HIV ANTICORPO/ANTIGENE', 'Autoimmunità', 40.0, '48-72h', '{"gravidanza", "allergie"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hla-locus-b51-tipizzazione', 'HLA (locus B51) Tipizzazione', 'Genetica/Molecolare', 85.0, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hla-b27-dna', 'HLA B27 DNA', 'Genetica/Molecolare', 120.0, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hla-classe-1-locus-a-b-c-classe-ii-dq-e-dr', 'HLA CLASSE 1 ( LOCUS A,B,C) CLASSE II DQ E DR', 'Genetica/Molecolare', 400.0, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hla-per-identificazione-dq2-e-dq8', 'HLA PER IDENTIFICAZIONE DQ2 E DQ8', 'Genetica/Molecolare', 138.0, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hla-tipo-c', 'HLA TIPO C', 'Genetica/Molecolare', 120.0, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hollister-stier-labs-ige-specifiche', 'HOLLISTER - STIER LABS. (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hpv-dna-screening-e-tipizzazione-di-ceppi-al-alto-', 'HPV DNA  SCREENING E TIPIZZAZIONE DI CEPPI AL ALTO RISCHIO ONCOGENO', 'Epatico', 90.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hpv-test-su-liquido-seminale', 'Hpv test su liquido seminale', 'Altro', 95.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('hsv-1-2-tampone-vaginale', 'HSV 1-2  Tampone vaginale', 'Infettivologia', 60.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ia2-insulinoma-antigene-2-abs', 'IA2 (Insulinoma Antigene 2) Abs', 'Glicemia/Diabete', 63.0, '48-72h', '{"aumento_peso", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('idrossilasi', 'IDROSSILASI', 'Altro', 95.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('idrossipirene-urinario', 'IDROSSIPIRENE URINARIO', 'Urinario', 50.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('idrossipirene-urine-f-t', 'IDROSSIPIRENE URINE F.T.', 'Renale', 43.6, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('idrossiprolina-urine-24h', 'IDROSSIPROLINA URINE 24H', 'Renale', 24.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('iga-salivari', 'IGA SALIVARI', 'Autoimmunità', 29.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ige-frumento', 'IGE FRUMENTO', 'Autoimmunità', 14.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ige-pannello-allergologico', 'IGE PANNELLO ALLERGOLOGICO', 'Autoimmunità', 170.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ige-totali', 'IgE TOTALI', 'Autoimmunità', 15.2, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('igf-bp-3', 'IGF BP-3', 'Altro', 67.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('immunocomplessi-circolanti-cic', 'IMMUNOCOMPLESSI CIRCOLANTI (CIC)', 'Altro', 15.4, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('immunofissazione-sierica', 'IMMUNOFISSAZIONE SIERICA', 'Altro', 60.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('immunofissazione-urinaria', 'IMMUNOFISSAZIONE URINARIA', 'Altro', 110.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('immunoglobuline-iga', 'IMMUNOGLOBULINE IgA', 'Autoimmunità', 6.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('immunoglobuline-igg', 'IMMUNOGLOBULINE IgG', 'Autoimmunità', 6.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('immunoglobuline-igg4', 'IMMUNOGLOBULINE IGG4', 'Autoimmunità', 32.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('immunoglobuline-igm', 'IMMUNOGLOBULINE IgM', 'Autoimmunità', 6.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('indicano-disbiosi-test', 'INDICANO (Disbiosi TEST)', 'Altro', 45.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('indice-r-o-m-a', 'INDICE R.O.M.A.', 'Altro', 50.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('indice-homa', 'INDICE HOMA', 'Altro', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('influenza-rapid-test', 'Influenza RAPID TEST', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('inibina-b', 'INIBINA B', 'Altro', 98.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('insulinemia', 'INSULINEMIA', 'Glicemia/Diabete', 5.5, '48-72h', '{"aumento_peso"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('interleuchina-6', 'INTERLEUCHINA 6', 'Infiammazione', 235.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('intolleranza-al-nichel-ricerca-di-mutazioni-su-tnf', 'Intolleranza al nichel (ricerca di mutazioni su TNF e FLG)', 'Infiammazione', 90.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('intolleranza-genetica-al-lattosio-e-predisposizion', 'INTOLLERANZA GENETICA AL LATTOSIO E PREDISPOSIZIONE ALLA MALATTIA CELIACA', 'Altro', 155.0, '7-15gg', '{"problemi_digestivi"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('iodio-sierico-totale', 'IODIO SIERICO TOTALE', 'Altro', 230.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('iodio-urine-24h', 'IODIO URINE 24H', 'Renale', 230.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('isocianato-hdi-ige-specifiche', 'ISOCIANATO HDI (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('isocianato-mdi-ige-specifiche', 'ISOCIANATO MDI (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('isocianato-tdi-ige-specifiche', 'ISOCIANATO TDI (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('isoenzimi-ck-creatinchinasi', 'Isoenzimi CK(Creatinchinasi)', 'Renale', 65.0, '24h', '{"controllo_reni"}'::TEXT[], false, NULL, 'renale', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('istamina', 'ISTAMINA', 'Altro', 96.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('istamina-urine-24h', 'ISTAMINA URINE 24H', 'Renale', 124.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('istologia-apparato-urogenitale-polipectomia-endoce', 'ISTOLOGIA APPARATO UROGENITALE - POLIPECTOMIA ENDOCERVICALE', 'Altro', 150.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('istologia-cute-e-o-tessuti-molli-biopsia-escission', 'ISTOLOGIA CUTE E/O TESSUTI MOLLI - BIOPSIA ESCISSIONALE', 'Altro', 50.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('jack-2', 'JACK-2', 'Altro', 130.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('jak-2', 'Jak-2', 'Altro', 130.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('kir-affinitymap', 'KIR Affinitymap', 'Altro', 235.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('kir-affinitymap-hla-c', 'KIR Affinitymap + HLA-C', 'Genetica/Molecolare', 400.0, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('kiwi-ige-specifiche', 'KIWI (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('kwikpen-2-5-mg-mj-pack-obesita', 'KWIKPEN 2.5 MG MJ PACK OBESITA''', 'Altro', 346.58, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lac-lupus-anticoagulant', 'LAC (LUPUS ANTICOAGULANT)', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lamotrigina', 'LAMOTRIGINA', 'Altro', 23.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lanciuola-plantago-lanceolata-ige-specifiche', 'LANCIUOLA (PLANTAGO LANCEOLATA) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('latte-bollito-ige-specifiche', 'LATTE BOLLITO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('latte-vaccino-ige-specifiche', 'LATTE Vaccino (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lattice-ige-specifiche', 'LATTICE (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('latticodeidrogenasi-ldh', 'LATTICODEIDROGENASI (LDH)', 'Epatico', 2.1, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lattoalbumina-di-mucca-ige-specifiche', 'LATTOALBUMINA DI MUCCA (igE specifiche)', 'Epatico', 15.0, '48-72h', '{"controllo_fegato", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lattoferrina-fecale', 'LATTOFERRINA FECALE', 'Fecale', 65.9, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lattuga-ige-specifiche', 'LATTUGA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ldl-ossidate', 'LDL OSSIDATE', 'Lipidico', 95.0, '48-72h', '{"controllo_cuore"}'::TEXT[], false, NULL, 'cardio', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lenticchia-ige-specifiche', 'LENTICCHIA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lepidoglyphus-destructor-ige-specifiche', 'LEPIDOGLYPHUS DESTRUCTOR (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('leptina', 'LEPTINA', 'Coagulazione', 100.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('levetiracetam-keppra', 'LEVETIRACETAM (KEPPRA)', 'Altro', 65.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lievito-acido-naturale-ige-specifiche', 'LIEVITO ACIDO NATURALE (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ligustro-ligustrum-vulgare-ige-specifiche', 'LIGUSTRO (LIGUSTRUM VULGARE) (IgE SPECIFICHE)', 'Autoimmunità', 14.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('limone-ige-specifiche', 'LIMONE (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lipasi', 'LIPASI', 'Altro', 4.6, '48-72h', '{"problemi_digestivi"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lipoproteina-a', 'LIPOPROTEINA A', 'Lipidico', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lipoproteine-profilo-lipoprint', 'Lipoproteine Profilo LIPOPRINT', 'Lipidico', 260.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('lisozima', 'LISOZIMA', 'Altro', 60.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('litio', 'LITIO', 'Altro', 8.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('loglierella-lolium-perenne-ige-specifiche', 'LOGLIERELLA (LOLIUM PERENNE) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('macroprolattina', 'MACROPROLATTINA', 'Ormoni', 250.0, '48-72h', '{"infertilita"}'::TEXT[], false, 'A riposo, evitare stress', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mad-x-fox', 'MAD X FOX', 'Altro', 350.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('magnesio', 'MAGNESIO', 'Elettroliti', 3.7, '48-72h', '{"insonnia", "ansia_stress", "palpitazioni"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('magnesio-eritrocitario', 'MAGNESIO ERITROCITARIO', 'Ematologia', 18.0, '48-72h', '{"insonnia", "ansia_stress", "palpitazioni"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('magnesio-urine-24h', 'MAGNESIO URINE 24H', 'Renale', 6.3, '24h', '{"gravidanza", "palpitazioni", "insonnia", "controllo_reni", "ansia_stress"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mais-ige-specifiche', 'MAIS (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('malattia-del-rene-policistico-autonomia-recessiva', 'MALATTIA DEL RENE POLICISTICO (autonomia recessiva)', 'Altro', 690.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('malattie-genetiche-14-ricerca-fibrosi-cistica-beta', 'MALATTIE GENETICHE (14)- Ricerca Fibrosi Cistica, Beta Talassemia, Anemia Falciforme', 'Altro', 250.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('malto-ige-specifiche', 'MALTO (IgE SPECIFICHE)', 'Epatico', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mandarino-ige-specifiche', 'MANDARINO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mandorla-ige-specifiche', 'MANDORLA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('manganese-plasmatico', 'MANGANESE PLASMATICO', 'Altro', 21.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('manganese-urine-f-t', 'MANGANESE URINE F.T.', 'Renale', 27.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('manganese-urine-i-t', 'MANGANESE URINE I.T.', 'Renale', 21.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('margherita-dei-prati-chrysantemum-leucanthemum-ige', 'MARGHERITA DEI PRATI (CHRYSANTEMUM LEUCANTHEMUM) (IgE SPECIFICHE)', 'Autoimmunità', 14.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mela-ige-specifiche', 'MELA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('melanzana-ige-specifiche', 'MELANZANA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('melone-ige-specifiche', 'MELONE (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mercurio-urine-f-t', 'MERCURIO URINE F.T.', 'Renale', 27.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mercurio-urine-i-t', 'MERCURIO URINE I.T.', 'Renale', 27.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('merluzzo-ige-specifiche', 'MERLUZZO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('metabolismo-degli-zuccheri', 'METABOLISMO DEGLI ZUCCHERI', 'Altro', 37.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('metaboliti-reattivi-dell-ossigeno-derivati-dei-rad', 'METABOLITI REATTIVI DELL''OSSIGENO (DERIVATI DEI RADICALI LIBERI)', 'Autoimmunità', 40.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('metadone-test-di-conferma', 'METADONE - TEST DI CONFERMA', 'Altro', 168.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('metaemoglobina', 'METAEMOGLOBINA', 'Ematologia', 12.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('metanefrine-plasmatiche-libere', 'METANEFRINE PLASMATICHE LIBERE', 'Altro', 40.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('metanefrine-urine-24h', 'METANEFRINE URINE 24H', 'Renale', 35.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('metanolo-urine-f-t', 'METANOLO URINE F.T.', 'Renale', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('metiletilchetone-mek-urine-f-t', 'METILETILCHETONE (MEK) URINE F.T.', 'Renale', 20.2, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('metiletilchetone-mek-urine-i-t', 'METILETILCHETONE (MEK) URINE I.T.', 'Renale', 20.2, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('metilisobutilchetone-mibk-urine-f-t', 'METILISOBUTILCHETONE (MIBK) URINE F.T.', 'Renale', 50.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('microalbuminuria', 'MICROALBUMINURIA', 'Epatico', 6.8, '48-72h', '{"controllo_fegato", "controllo_reni"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('microalbuminuria-urine-24h', 'MICROALBUMINURIA URINE 24H', 'Epatico', 6.8, '24h', '{"gravidanza", "controllo_fegato", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('miele-ige-specifiche', 'MIELE (IgE SPECIFICHE)', 'Autoimmunità', 20.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mioglobina', 'MIOGLOBINA', 'Cardiologico', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mirtillo-ige-specifiche', 'MIRTILLO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('misurazione-pressione-arteriosa', 'MISURAZIONE PRESSIONE ARTERIOSA', 'Altro', 5.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mitili-ige-specifiche', 'MITILI (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mix-graminacee', 'MIX GRAMINACEE', 'Allergologia', 22.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('modulo-03-esami-del-sangue-unisalute', 'MODULO 03 ESAMI DEL SANGUE  UNISALUTE', 'Altro', 44.42, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('modulo-25-gruppo-14-esami-del-sangue-unisalute', 'MODULO 25 (GRUPPO 14 ESAMI DEL SANGUE) UNISALUTE', 'Altro', 40.51, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('monometilformammide-mmf-urine-f-t', 'MONOMETILFORMAMMIDE (MMF) URINE F.T.', 'Renale', 22.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mono-test', 'MONO-TEST', 'Altro', 18.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mounjaro-7-5-mg-start-pack-progetto-slim-care-part', 'Mounjaro 7,5 mg -Start Pack - progetto Slim Care - parte di prestazione sanitaria complessa', 'Altro', 395.45, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mthfr1-c677t', 'MTHFR1 C677T', 'Altro', 50.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mucopolisaccaridosi-tipo-i-mps-i-analisi-del-gene-', 'MUCOPOLISACCARIDOSI tipo I (MPS I) Analisi del gene IDUA', 'Autoimmunità', 690.0, '48-72h', '{"dolori_articolari"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mucopolisaccaridosi-tipo-iii-b-analisi-del-gene-na', 'MUCOPOLISACCARIDOSI tipo III B - Analisi del gene NAGLU', 'Autoimmunità', 690.0, '48-72h', '{"dolori_articolari"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mucor-racemosus-ige-specifiche', 'MUCOR RACEMOSUS (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('muffe-ige-specifiche', 'MUFFE (IgE SPECIFICHE)', 'Autoimmunità', 18.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mutazione-g20210a-del-fattore-ii', 'Mutazione G20210A del Fattore II', 'Genetica/Molecolare', 90.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mybiome-analisi-molecolare-del-microbiota-intestin', 'MYBIOME - ANALISI MOLECOLARE DEL MICROBIOTA INTESTINALE', 'Autoimmunità', 450.0, '7-15gg', '{"dolori_articolari"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mycobacterium-tuberculosis-dna', 'MYCOBACTERIUM TUBERCULOSIS DNA', 'Genetica/Molecolare', 176.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('mycoplasma-genitalium-dna', 'MYCOPLASMA GENITALIUM DNA', 'Genetica/Molecolare', 80.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('neisseria-gonorrhoeae-esame-colturale-ricerca-su-l', 'NEISSERIA GONORRHOEAE ESAME COLTURALE (ricerca su Liquido seminale)', 'Altro', 15.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('neisseria-gonorrhoeae-esame-colturale-urina', 'NEISSERIA GONORRHOEAE ESAME COLTURALE (URINA)', 'Altro', 12.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('netilmicina', 'NETILMICINA', 'Altro', 58.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('nichel-sierico', 'NICHEL SIERICO', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('nichel-urinario-fine-turno', 'NICHEL URINARIO fine turno', 'Urinario', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('nichel-urinario-inizio-turno', 'NICHEL URINARIO inizio turno', 'Urinario', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('nickel-urine-f-t', 'NICKEL URINE F.T.', 'Renale', 15.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('nickel-urine-i-t', 'NICKEL URINE I.T.', 'Renale', 15.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('n-metilacetammide-urine-f-t', 'N-METILACETAMMIDE URINE F.T.', 'Renale', 21.6, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('nocciola-ige-specifiche', 'NOCCIOLA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('nocciolo-corylus-avellana-ige-specifiche', 'NOCCIOLO (CORYLUS AVELLANA) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('noce-ige-specifiche', 'NOCE (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('noce-brasiliana-ige-specifiche', 'NOCE BRASILIANA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('noce-di-california-juglans-californica-ige-specifi', 'NOCE DI CALIFORNIA (JUGLANS CALIFORNICA) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('noce-di-cocco-ige-specifiche', 'NOCE DI COCCO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('normetanefrine-urine-24h', 'NORMETANEFRINE URINE 24H', 'Renale', 35.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('numero-di-dibucaina', 'NUMERO DI DIBUCAINA', 'Altro', 6.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ogtt-curva-glicemica-in-gravidanza', 'OGTT  - CURVA GLICEMICA IN GRAVIDANZA', 'Glicemia/Diabete', 35.0, '48-72h', '{}'::TEXT[], true, 'A digiuno da 8-12 ore', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ogtt-curva-glicemica-in-gravidanza-arancia', 'OGTT  - CURVA GLICEMICA IN GRAVIDANZA (ARANCIA)', 'Glicemia/Diabete', 55.0, '48-72h', '{}'::TEXT[], true, 'A digiuno da 8-12 ore', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('olivo-olea-europea-ige-specifiche', 'OLIVO (OLEA EUROPEA) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('olmo-ulmus-campestris-ige-specifiche', 'OLMO (ULMUS CAMPESTRIS) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('omocisteina', 'OMOCISTEINA', 'Cardiologico', 28.5, '48-72h', '{"controllo_cuore"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('omocisteina-dna-mthfr-c677t-a1298c', 'OMOCISTEINA DNA (MTHFR) C677T + A1298C', 'Cardiologico', 100.0, '48-72h', '{"controllo_cuore"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('onco-advance-brca-pap-test', 'Onco Advance  BRCA + PAP TEST', 'Altro', 520.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('onco-advance-plus-brca-pap-test', 'Onco Advance Plus BRCA + Pap Test', 'Altro', 620.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('onco-advance-risk-breast-pap-test', 'ONCO ADVANCE RISK BREAST + PAP TEST', 'Epatico', 820.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('onco-advance-risk-lynch-pap-test', 'ONCO ADVANCE RISK LYNCH + PAP TEST', 'Altro', 690.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('onco-advance-risk-ovarian-pap-test', 'ONCO ADVANCE RISK OVARIAN + PAP TEST', 'Altro', 820.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('oncoadvance-risk-brca-analisi-dei-geni-brca1-e-brc', 'OncoAdvance Risk BRCA - Analisi dei geni BRCA1 e BRCA2', 'Tumore/Markers', 520.0, '48-72h', '{"dolori_articolari"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ontano-alnus-incana-ige-specifiche', 'ONTANO (ALNUS INCANA) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('oppiacei-test-di-conferma', 'OPPIACEI - TEST DI CONFERMA', 'Altro', 168.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('origano-ige-specifiche', 'ORIGANO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ormone-anti-mulleriano-amh', 'ORMONE ANTI-MULLERIANO (AMH)', 'Altro', 55.0, '48-72h', '{"infertilita"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ormone-follicolo-stimolante-fsh', 'ORMONE FOLLICOLO STIMOLANTE (FSH)', 'Ormoni', 16.9, '48-72h', '{"menopausa", "infertilita"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ormone-luteinizzante-lh', 'ORMONE LUTEINIZZANTE (LH)', 'Ormoni', 9.0, '48-72h', '{"menopausa", "infertilita"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ormone-somatotropo-hgh', 'ORMONE SOMATOTROPO (HGH)', 'Altro', 16.8, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ormone-tireotropo-tsh', 'ORMONE TIREOTROPO (TSH)', 'Tiroide', 10.0, '48h', '{"aumento_peso", "stanchezza", "perdita_capelli", "dimagrimento", "menopausa", "gravidanza", "palpitazioni", "insonnia", "infertilita", "ansia_stress"}'::TEXT[], false, NULL, 'donna-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ornitina-su-plasma', 'ORNITINA SU PLASMA', 'Altro', 110.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ornitina-urinaria', 'ORNITINA URINARIA', 'Altro', 110.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ortica-urtica-dioica-ige-specifiche', 'ORTICA (URTICA DIOICA) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('orto-cresolo-urine-f-t', 'ORTO-CRESOLO URINE F.T.', 'Renale', 20.1, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('orto-cresolo-urine-i-t', 'ORTO-CRESOLO URINE I.T.', 'Renale', 20.1, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('orzo-ige-specifiche', 'ORZO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('osmolarita-plasmatica', 'OSMOLARITA'' PLASMATICA', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ossalati-urine', 'OSSALATI URINE', 'Renale', 30.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('osteocalcina', 'OSTEOCALCINA', 'Altro', 36.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ostrica-ige-specifiche', 'OSTRICA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('oxcarbazepina', 'OXCARBAZEPINA', 'Altro', 19.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pack-cardio-plus', 'PACK CARDIO PLUS', 'Altro', 85.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pack-donna-under-40', 'Pack donna under 40', 'Altro', 106.42, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pack-esami-percorso-obesit', 'Pack Esami percorso Obesità', 'Altro', 70.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pack-obesita-under-18', 'PACK OBESITA UNDER 18', 'Altro', 130.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pack-smart-base', 'PACK SMART BASE', 'Altro', 22.47, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pack-ultra-base', 'Pack ultra base', 'Altro', 46.79, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('paleino-odoroso-anthoxanthum-odoratum-ige-specific', 'PALEINO ODOROSO (ANTHOXANTHUM ODORATUM) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('paleo-bromus-inermis-ige-specifiche', 'PALEO (BROMUS INERMIS) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('paleo-dei-prati-festuca-elatior-ige-specifiche', 'PALEO DEI PRATI (FESTUCA ELATIOR) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pannello-les-ss-lupus-eritematoso-sistemico-sindro', 'PANNELLO LES/SS (LUPUS ERITEMATOSO SISTEMICO)/(SINDROME DI SJÖGREN)', 'Altro', 120.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('papaia-ige-specifiche', 'PAPAIA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('papp-a-per-bitest', 'PAPP-A per BITEST', 'Altro', 8.3, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('parassita-malarico-ricerca-antigenica', 'PARASSITA MALARICO RICERCA ANTIGENICA', 'Autoimmunità', 125.1, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('parmigiano-ige-specifiche', 'PARMIGIANO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('paroxetina', 'PAROXETINA', 'Altro', 229.6, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('parvovirus-b19-dna', 'PARVOVIRUS B19 DNA', 'Genetica/Molecolare', 100.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('patata-ige-specifiche', 'PATATA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pcr-alta-sensibilita', 'PCR ALTA SENSIBILITA''', 'Epatico', 22.0, '48-72h', '{"dolori_articolari", "controllo_cuore", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('penicillina-g-ige-specifiche', 'PENICILLINA G - IGE Specifiche', 'Autoimmunità', 25.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('penicillina-v-ige-specifiche', 'PENICILLINA V - IGE Specifiche', 'Autoimmunità', 25.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('penicillium-notatum-ige-specifiche', 'PENICILLIUM NOTATUM (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pepe-nero-ige-specifiche', 'PEPE NERO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pepe-verde-ige-specifiche', 'PEPE VERDE (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('peperone-ige-specifiche', 'PEPERONE (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pera-ige-specifiche', 'PERA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('percentuale-di-saturazione-di-transferrina', 'PERCENTUALE DI SATURAZIONE DI TRANSFERRINA', 'Ematologia', 3.0, '48-72h', '{"anemia"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('percloroetilene-ematico', 'PERCLOROETILENE EMATICO', 'Elettroliti', 19.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('percloroetilene-urine-f-t', 'PERCLOROETILENE URINE F.T.', 'Renale', 19.9, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('percloroetilene-urine-i-t', 'PERCLOROETILENE URINE I.T.', 'Renale', 19.9, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pesca-ige-specifiche', 'PESCA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ph-ematico', 'PH EMATICO', 'Altro', 11.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('phenobarbital-gardenale', 'PHENOBARBITAL (GARDENALE)', 'Autoimmunità', 22.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pino-pinus-strobus-ige-specifiche', 'PINO (PINUS STROBUS) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pinolo-ige-specifiche', 'PINOLO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('piombemia', 'PIOMBEMIA', 'Altro', 22.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('piombo-urine-f-t', 'PIOMBO URINE F.T.', 'Renale', 11.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('piombo-urine-i-t', 'PIOMBO URINE I.T.', 'Renale', 11.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pioppo-populos-deltoides-ige-specifiche', 'PIOPPO (POPULOS DELTOIDES) (IgE SPECIFICHE)', 'Autoimmunità', 14.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('piruvatochinasi-eritrocitaria', 'PIRUVATOCHINASI ERITROCITARIA', 'Ematologia', 67.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pisello-ige-specifiche', 'PISELLO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pistacchio-ige-specifiche', 'PISTACCHIO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('piume-d-anatra-ige-specifiche', 'PIUME D''ANATRA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('piume-di-canarino-ige-specifiche', 'PIUME DI CANARINO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"dolori_articolari", "allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('piume-di-gallina-ige-specifiche', 'PIUME DI GALLINA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('piume-d-oca-ige-specifiche', 'PIUME D''OCA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('plasminogeno', 'PLASMINOGENO', 'Altro', 30.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('platano-platanus-acerifolia-ige-specifiche', 'PLATANO (PLATANUS ACERIFOLIA) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('platessa-ige-specifiche', 'PLATESSA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pol-d5-polistes-dominulus', 'POL D5 POLISTES DOMINULUS', 'Altro', 19.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('polipeptide-pancreatico', 'POLIPEPTIDE PANCREATICO', 'Coagulazione', 115.4, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('polpo-ige-specifiche', 'POLPO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('polvere-di-casa-ige-specifiche', 'POLVERE DI CASA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('polvere-di-grano-ige-specifiche', 'POLVERE DI GRANO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pomodoro-ige-specifiche', 'POMODORO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pompelmo-ige-specifiche', 'POMPELMO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('porfirine-totali-urine-24h', 'PORFIRINE TOTALI URINE 24H', 'Renale', 48.2, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('potassio', 'POTASSIO', 'Elettroliti', 4.8, '48-72h', '{"palpitazioni"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('potassio-urine-24h', 'POTASSIO URINE 24H', 'Renale', 3.7, '24h', '{"gravidanza", "controllo_reni", "palpitazioni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('potenziale-biologico-antiossidante-bap', 'POTENZIALE BIOLOGICO ANTIOSSIDANTE (BAP)', 'Altro', 35.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('prealbumina', 'PREALBUMINA', 'Epatico', 9.0, '48-72h', '{"controllo_fegato"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('prelievo-a-domicilio', 'Prelievo a domicilio', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('prelievo-microbiologico', 'PRELIEVO MICROBIOLOGICO', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('prelievo-venoso', 'PRELIEVO VENOSO', 'Altro', 3.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('prezzemolo-ige-specifiche', 'PREZZEMOLO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('primidone', 'PRIMIDONE', 'Altro', 17.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('probnp', 'ProBNP', 'Cardiologico', 51.0, '48-72h', '{"controllo_cuore", "palpitazioni"}'::TEXT[], false, NULL, 'cardio', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('procalcitonina', 'PROCALCITONINA', 'Tiroide', 34.0, '48-72h', '{}'::TEXT[], false, NULL, 'tiroide-plus', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('prodotti-degradazione-fibrinogeno-fdp', 'PRODOTTI DEGRADAZIONE FIBRINOGENO (FDP)', 'Coagulazione', 100.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('profilo-anticorpi-anti-msa-anticorpi-miosite-speci', 'PROFILO ANTICORPI ANTI MSA (Anticorpi miosite specifici)', 'Autoimmunità', 145.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('profilo-glicemico', 'PROFILO GLICEMICO', 'Altro', 3.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('profilo-remautologico', 'PROFILO REMAUTOLOGICO', 'Altro', 102.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('profilo-trombofilico-autoanticorpi', 'Profilo Trombofilico Autoanticorpi', 'Autoimmunità', 411.3, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('progesterone', 'PROGESTERONE', 'Ormoni', 8.5, '48-72h', '{"infertilita"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('prolattina', 'PROLATTINA', 'Ormoni', 10.0, '48-72h', '{"infertilita"}'::TEXT[], false, 'A riposo, evitare stress', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('prolattina-curva', 'PROLATTINA CURVA', 'Ormoni', 7.5, '48-72h', '{"infertilita"}'::TEXT[], false, 'A riposo, evitare stress', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('propeptide-amino-terminale-del-procollagene-tipo-1', 'PROPEPTIDE AMINO-TERMINALE DEL PROCOLLAGENE TIPO 1 (P1NP)', 'Coagulazione', 45.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('proteina-c-coagulativa', 'proteina C COAGULATIVA', 'Altro', 11.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('proteina-c-funzionale', 'PROTEINA C FUNZIONALE', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('proteina-c-reattiva-pcr', 'PROTEINA C REATTIVA (PCR)', 'Infiammazione', 4.6, '48-72h', '{"dolori_articolari", "controllo_cuore", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('proteina-legante-il-retinolo', 'Proteina Legante il Retinolo', 'Altro', 22.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('proteina-s-libera', 'PROTEINA S LIBERA', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('proteine-totali', 'PROTEINE TOTALI', 'Altro', 5.4, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('proteine-totali-urine-24h', 'PROTEINE TOTALI URINE 24H', 'Renale', 3.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('proteinuria-di-bence-jones', 'PROTEINURIA DI BENCE-JONES', 'Altro', 28.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('prugna-ige-specifiche', 'PRUGNA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('psa-libero-free-psa', 'PSA LIBERO (FREE-PSA)', 'Tumore/Markers', 12.0, '48-72h', '{"controllo_prostata"}'::TEXT[], false, NULL, 'uomo-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('psa-reflex', 'PSA REFLEX', 'Tumore/Markers', 22.0, '48-72h', '{"controllo_prostata"}'::TEXT[], false, NULL, 'uomo-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('pth-intatto-paratormone', 'PTH INTATTO (PARATORMONE)', 'Coagulazione', 12.0, '48-72h', '{}'::TEXT[], false, NULL, 'donna-over40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('quantiferon', 'QUANTIFERON', 'Altro', 130.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('quercia-bianca-quercus-alba-ige-specifiche', 'QUERCIA BIANCA (QUERCUS ALBA) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('rame-urine-24-ore', 'RAME URINE 24 ORE', 'Renale', 12.9, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('rame-urine-f-t', 'RAME URINE F.T.', 'Renale', 9.9, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('raschiamento-ungueale-dito-del-piede', 'RASCHIAMENTO UNGUEALE (dito del piede)', 'Altro', 30.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('raschiamento-ungueale-dito-mano-dx', 'RASCHIAMENTO UNGUEALE (dito mano DX)', 'Altro', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('rast-toxocara-toxocara-canis', 'RAST TOXOCARA (TOXOCARA CANIS)', 'Epatico', 18.5, '48-72h', '{"gravidanza", "allergie"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('reagente-lactate-dehydrogenase-ldh', 'REAGENTE LACTATE DEHYDROGENASE (LDH)', 'Epatico', 4.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('recettore-solubile-della-transferrina', 'RECETTORE SOLUBILE DELLA TRANSFERRINA', 'Ematologia', 43.0, '48-72h', '{"anemia"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('recettori-interleuchina-2', 'RECETTORI INTERLEUCHINA 2', 'Infiammazione', 155.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('renina-ortostatismo', 'RENINA (ORTOSTATISMO)', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('resistenza-alla-proteina-c-attivata-apc-r', 'RESISTENZA ALLA PROTEINA C ATTIVATA (APC-R)', 'Altro', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('resistenza-osmotica-eritrocitaria-simmel', 'RESISTENZA OSMOTICA  ERITROCITARIA (SIMMEL)', 'Ematologia', 28.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('resistenza-osmotica-eritrocitaria-globulare-r-o-e-', 'RESISTENZA OSMOTICA ERITROCITARIA/GLOBULARE (R.O.E./R.O.G.)', 'Ematologia', 27.6, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('reticolociti', 'RETICOLOCITI', 'Altro', 12.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('reuma-test-fattore-reumatoide', 'REUMA TEST (FATTORE REUMATOIDE)', 'Autoimmunità', 7.2, '48-72h', '{"dolori_articolari"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-mycoplasmi-e-ureaplasmi-tampone-vaginale', 'RICERCA  MYCOPLASMI E UREAPLASMI TAMPONE VAGINALE', 'Renale', 18.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-ag-chlamydia', 'RICERCA Ag CHLAMYDIA', 'Genetica/Molecolare', 8.5, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-antigene-legionella', 'Ricerca antigene Legionella', 'Autoimmunità', 62.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-asbesto-e-siderociti', 'RICERCA ASBESTO E SIDEROCITI', 'Altro', 36.4, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-campylobacter-su-feci', 'Ricerca Campylobacter su feci', 'Fecale', 22.0, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-candida-nelle-feci', 'RICERCA CANDIDA NELLE FECI', 'Fecale', 25.0, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-dna-chlamydia-trachomatis-su-liquido-semin', 'RICERCA DNA CHLAMYDIA TRACHOMATIS SU LIQUIDO SEMINALE', 'Genetica/Molecolare', 70.0, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-dna-chlamydia-trachomatis-su-tampone-cervi', 'RICERCA DNA CHLAMYDIA TRACHOMATIS SU TAMPONE CERVICALE', 'Infettivologia', 70.0, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-dna-chlamydia-trachomatis-su-tampone-uretr', 'RICERCA DNA CHLAMYDIA TRACHOMATIS SU TAMPONE URETRALE', 'Infettivologia', 70.0, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-dna-chlamydia-trachomatis-su-tampone-vagin', 'RICERCA DNA CHLAMYDIA TRACHOMATIS SU TAMPONE VAGINALE', 'Infettivologia', 70.0, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-dna-chlamydia-trachomatis-su-urine', 'RICERCA DNA CHLAMYDIA TRACHOMATIS SU URINE', 'Renale', 70.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-dna-neisseria-gonorrhoeae', 'RICERCA DNA NEISSERIA GONORRHOEAE', 'Genetica/Molecolare', 70.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-gardnerella-vaginalis-in-liquido-seminale', 'RICERCA Gardnerella vaginalis in Liquido Seminale', 'Altro', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-hsv-1-2-tampone-labiale', 'RICERCA HSV 1-2  Tampone labiale', 'Infettivologia', 50.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-micoplasmi-liquido-seminale', 'RICERCA MICOPLASMI LIQUIDO SEMINALE', 'Altro', 40.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-micoplasmi-nelle-urine', 'RICERCA MICOPLASMI NELLE URINE', 'Renale', 35.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-micoplasmi-tampone-uretrale', 'RICERCA MICOPLASMI TAMPONE URETRALE', 'Infettivologia', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-mycoplasma-e-ureaplasma-tampone-endometria', 'RICERCA MYCOPLASMA E UREAPLASMA TAMPONE ENDOMETRIALE', 'Renale', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-mycoplasmi-e-ureaplasmi-in-liquido-seminal', 'RICERCA MYCOPLASMI e UREAPLASMI in Liquido Seminale', 'Renale', 40.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-mycoplasmi-e-ureaplasmi-tampone-cervicale', 'RICERCA MYCOPLASMI e UREAPLASMI TAMPONE CERVICALE', 'Renale', 18.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-mycoplasmi-e-ureaplasmi-urine', 'RICERCA MYCOPLASMI e UREAPLASMI URINE', 'Renale', 20.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-neisseria-gonorrhoeae-esame-colturale-tamp', 'RICERCA NEISSERIA GONORRHOEAE ESAME COLTURALE TAMP. CERVICALE', 'Altro', 15.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-neisseria-gonorrhoeae-tamp-uretrale', 'RICERCA NEISSERIA GONORRHOEAE TAMP. URETRALE', 'Altro', 12.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-parassiti-e-uova', 'RICERCA PARASSITI E UOVA', 'Fecale', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-parassiti-e-uova-campione-1', 'RICERCA PARASSITI E UOVA CAMPIONE 1', 'Fecale', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-parassiti-e-uova-campione-2', 'RICERCA PARASSITI E UOVA CAMPIONE 2', 'Fecale', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-parassiti-e-uova-campione-3', 'RICERCA PARASSITI E UOVA CAMPIONE 3', 'Fecale', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-sangue-occulto-feci', 'RICERCA SANGUE OCCULTO FECI', 'Fecale', 4.6, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-sangue-occulto-feci-campione-1', 'RICERCA SANGUE OCCULTO FECI CAMPIONE 1', 'Fecale', 3.9, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-sangue-occulto-feci-campione-2', 'RICERCA SANGUE OCCULTO FECI CAMPIONE 2', 'Fecale', 3.9, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-sangue-occulto-feci-campione-3', 'RICERCA SANGUE OCCULTO FECI CAMPIONE 3', 'Fecale', 3.9, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-stafilococco-aureo-nelle-feci', 'RICERCA STAFILOCOCCO AUREO NELLE FECI', 'Fecale', 30.0, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-streptococco-gr-b-streptococcus-agalactiae', 'RICERCA STREPTOCOCCO GR. B (Streptococcus agalactiae) TAMPONE RETTALE', 'Coagulazione', 8.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-trichomonas-uretrale', 'RICERCA TRICHOMONAS URETRALE', 'Altro', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ricerca-trichomonas-vaginalis', 'RICERCA TRICHOMONAS VAGINALIS', 'Altro', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('rickettsia-conori-igg-igm', 'RICKETTSIA CONORI IGG - IGM', 'Autoimmunità', 33.0, '48-72h', '{"infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('rilevazione-ph-vaginale', 'RILEVAZIONE pH VAGINALE', 'Altro', 10.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('riso-ige-specifiche', 'RISO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('rosolia-test-di-avidita-igg', 'ROSOLIA - TEST DI AVIDITA'' IgG', 'Autoimmunità', 54.0, '48-72h', '{"gravidanza", "infezioni_frequenti"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('rotavirus-ricerca-antigene-nelle-feci', 'ROTAVIRUS RICERCA ANTIGENE NELLE FECI', 'Autoimmunità', 11.0, '48-72h', '{"allergie"}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('salice-salix-caprea-ige-specifiche', 'SALICE (SALIX CAPREA) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('salmone-ige-specifiche', 'SALMONE (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('sardina-ige-specifiche', 'SARDINA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('scarafaggio-blatella-germanica-ige-specifiche', 'SCARAFAGGIO (BLATELLA GERMANICA) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('scatolo-disbiosi-test', 'SCATOLO ( Disbiosi test )', 'Altro', 45.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('scotch-test-ricerca-ossiuri', 'SCOTCH-TEST RICERCA OSSIURI', 'Altro', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('screening-assetto-lipidico', 'screening assetto lipidico', 'Altro', 25.0, '48-72h', '{}'::TEXT[], true, 'A digiuno da 12 ore', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('screening-cardiovascolare-base', 'SCREENING CARDIOVASCOLARE BASE', 'Altro', 10.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('screening-diabete', 'Screening diabete', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('sedano-ige-specifiche', 'SEDANO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('segale-secale-cereale-ige-specifiche', 'SEGALE (SECALE CEREALE) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('selenio-sierico', 'SELENIO SIERICO', 'Vitamina/Minerali', 23.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('selenio-urine-f-t', 'SELENIO URINE F.T.', 'Renale', 21.6, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('semi-di-sesamo-ige-specifiche', 'SEMI DI SESAMO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('senape-ige-specifiche', 'SENAPE (IgE SPECIFICHE)', 'Autoimmunità', 14.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('serotonina', 'SEROTONINA', 'Altro', 23.7, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('serotonina-urine-24h', 'SEROTONINA URINE 24H', 'Renale', 21.9, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('sgombro-ige-specifiche', 'SGOMBRO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('shbg-sex-hormone-binding-globulin', 'SHBG (SEX HORMONE BINDING GLOBULIN)', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('sideremia', 'SIDEREMIA', 'Ematologia', 2.0, '48-72h', '{"stanchezza", "perdita_capelli", "anemia"}'::TEXT[], false, NULL, 'donna-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('siero-amiloide-a', 'SIERO AMILOIDE A', 'Altro', 26.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('siero-di-latte-ige-specifiche', 'SIERO DI LATTE (IgE SPECIFICHE)', 'Autoimmunità', 20.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('sindrome-dell-x-fragile', 'SINDROME DELL X FRAGILE', 'Altro', 220.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('sindrome-di-gilbert', 'SINDROME DI GILBERT', 'Altro', 300.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('small-dense-ldl-cholesterol-sd-ldl', 'SMALL DENSE LDL CHOLESTEROL (SD LDL)', 'Lipidico', 295.0, '48-72h', '{"controllo_cuore"}'::TEXT[], false, NULL, 'cardio', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('smet', 'SMET', 'Altro', 9.63, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('sodio', 'SODIO', 'Elettroliti', 4.7, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('sodio-urine-24h', 'SODIO URINE 24H', 'Renale', 3.3, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('sogliola-ige-specifiche', 'SOGLIOLA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('soia-ige-specifiche', 'SOIA (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('somatomedina-c-igf-1', 'SOMATOMEDINA C (IGF-1)', 'Altro', 38.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('sordita-congenita-gjb2-cx26-intero-gene', 'SORDITA'' CONGENITA (GJB2/CX26) - INTERO GENE', 'Altro', 190.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('sordita-congenita-gjb2-cx26-principali-mutazioni', 'SORDITA'' CONGENITA (GJB2/CX26) - PRINCIPALI MUTAZIONI', 'Genetica/Molecolare', 90.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('sordita-congenita-gjb2-cx30-intero-gene', 'SORDITA'' CONGENITA (GJB2/CX30) - INTERO GENE', 'Altro', 190.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('spermiocoltura-completa', 'SPERMIOCOLTURA COMPLETA', 'Altro', 50.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('spermiocoltura-germi-comuni', 'SPERMIOCOLTURA GERMI COMUNI', 'Altro', 22.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('spermiogramma-esame-del-liquido-seminale', 'SPERMIOGRAMMA (esame del liquido seminale)', 'Altro', 90.0, '48-72h', '{"infertilita"}'::TEXT[], false, 'Astinenza 3-5 giorni', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('spinaci-ige-specifiche', 'SPINACI (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('strep-a-rapid-test', 'STREP A Rapid test', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('streptococcus-pneumoniae-ag-urinario', 'STREPTOCOCCUS PNEUMONIAE AG URINARIO', 'Coagulazione', 98.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('streptozyme', 'STREPTOZYME', 'Coagulazione', 37.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tafano-tabanus-species-ige-specifiche', 'TAFANO (TABANUS SPECIES) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('talassemia-beta-screening-23-mutazioni-italiane', 'TALASSEMIA BETA - SCREENING 23 MUTAZIONI ITALIANE', 'Genetica/Molecolare', 140.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('talassemia-beta-intero-gene', 'TALASSEMIA BETA- INTERO GENE', 'Altro', 190.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tampone-antigenico-sars-cov-2', 'TAMPONE ANTIGENICO SARS-COV-2', 'Autoimmunità', 10.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tampone-balano-prepuziale', 'TAMPONE BALANO - PREPUZIALE', 'Infettivologia', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tampone-colturale-endometrio', 'TAMPONE COLTURALE ENDOMETRIO', 'Infettivologia', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tampone-rapido', 'TAMPONE RAPIDO', 'Infettivologia', 10.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tampone-rettale-ricerca-gonorrhoeae', 'TAMPONE RETTALE - Ricerca Gonorrhoeae', 'Infettivologia', 15.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tampone-rettale-ricerca-miceti', 'TAMPONE RETTALE - Ricerca miceti', 'Infettivologia', 8.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tampone-rettale-ricerca-salmonella-shigella', 'TAMPONE RETTALE - Ricerca Salmonella, Shigella', 'Autoimmunità', 13.8, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tampone-uretrale-in-provetta-sterile-con-terreno-d', 'TAMPONE URETRALE IN PROVETTA STERILE CON TERRENO DI TRASPORTO STUART', 'Infettivologia', 20.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tampone-vaginale-real-time-pcr-dna-ricerca-trichom', 'TAMPONE VAGINALE REAL-TIME PCR DNA RICERCA TRICHOMONAS VAGINALIS', 'Infiammazione', 68.0, '48-72h', '{"dolori_articolari", "controllo_cuore", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tamponi-cervico-vaginali-completi', 'Tamponi cervico vaginali completi', 'Altro', 66.3, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tamponi-vaginali-completi-vaginali', 'Tamponi Vaginali (completi vaginali)', 'Altro', 49.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tbg-tiroxine-binding-globuline', 'TBG (TIROXINE BINDING GLOBULINE)', 'Altro', 22.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('telopeptide-ctx-plasmatico', 'TELOPEPTIDE (CTX) PLASMATICO', 'Coagulazione', 60.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tempo-di-protrombina-pt', 'TEMPO DI PROTROMBINA (PT)', 'Coagulazione', 4.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tempo-di-tromboplastina-aptt', 'TEMPO DI TROMBOPLASTINA (aPTT)', 'Epatico', 4.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('teofillina', 'TEOFILLINA', 'Altro', 16.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('test-capacitazione', 'Test Capacitazione', 'Altro', 250.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('test-conferma-toxoplasma-anticorpi-igg', 'TEST CONFERMA TOXOPLASMA ANTICORPI IgG', 'Autoimmunità', 40.0, '48-72h', '{"gravidanza", "infezioni_frequenti"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('test-conferma-toxoplasma-anticorpi-igm', 'TEST CONFERMA TOXOPLASMA ANTICORPI IgM', 'Autoimmunità', 40.0, '48-72h', '{"gravidanza", "infezioni_frequenti"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('test-di-capacitazione', 'TEST DI CAPACITAZIONE', 'Altro', 90.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('test-di-coombs-diretto', 'TEST DI COOMBS DIRETTO', 'Altro', 15.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('test-di-coombs-indiretto', 'TEST DI COOMBS INDIRETTO', 'Altro', 10.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('test-di-gravidanza-su-urine', 'TEST DI GRAVIDANZA SU URINE', 'Renale', 7.5, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('test-di-paternit', 'Test di paternità', 'Altro', 220.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('test-indagine-di-consanguineit-con-relazione-medic', 'Test indagine di consanguineità con relazione medico legale', 'Altro', 750.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('testosterone', 'TESTOSTERONE', 'Ormoni', 10.0, '48-72h', '{"perdita_capelli", "infertilita", "controllo_prostata"}'::TEXT[], false, NULL, 'uomo-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('testosterone-biodisponibile', 'TESTOSTERONE BIODISPONIBILE', 'Ormoni', 45.0, '48-72h', '{"perdita_capelli", "infertilita", "controllo_prostata"}'::TEXT[], false, NULL, 'uomo-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('testosterone-libero', 'TESTOSTERONE LIBERO', 'Ormoni', 21.0, '48-72h', '{"perdita_capelli", "infertilita", "controllo_prostata"}'::TEXT[], false, NULL, 'uomo-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('the-ige-specifiche', 'THE'' (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tibc-capacita-ferro-legante', 'TIBC - CAPACITA'' FERRO LEGANTE', 'Ematologia', 7.4, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tiglio-tiglia-cordata-ige-specifiche', 'TIGLIO (TIGLIA CORDATA) (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tiocianati-urine-f-t', 'TIOCIANATI URINE F.T.', 'Renale', 30.3, '24h', '{"gravidanza", "dolori_articolari", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tiocianati-urine-i-t', 'TIOCIANATI URINE I.T.', 'Renale', 30.3, '24h', '{"gravidanza", "dolori_articolari", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tipizzazione-linfocitaria-completa', 'TIPIZZAZIONE LINFOCITARIA COMPLETA', 'Altro', 350.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tipizzazione-linfocitaria-singola-t-natural-killer', 'Tipizzazione linfocitaria singola T Natural Killer', 'Altro', 60.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tipizzazione-thla-b27', 'TIPIZZAZIONE THLA-B27', 'Genetica/Molecolare', 118.0, '7-15gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tireoglobulina', 'TIREOGLOBULINA', 'Tiroide', 18.8, '48-72h', '{}'::TEXT[], false, NULL, 'tiroide-plus', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tiroxina-t4', 'TIROXINA (T4)', 'Tiroide', 10.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tiroxina-libera-ft4', 'TIROXINA LIBERA (FT4)', 'Tiroide', 10.0, '48-72h', '{"aumento_peso", "stanchezza", "perdita_capelli", "dimagrimento", "palpitazioni"}'::TEXT[], false, NULL, 'donna-over40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('titolo-antistafilolisinico-taf', 'TITOLO ANTISTAFILOLISINICO (TAF)', 'Altro', 35.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('titolo-antistreptolisinico-tas', 'TITOLO ANTISTREPTOLISINICO (TAS)', 'Coagulazione', 7.9, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tnf-tumor-necrosis-factor', 'TNF (TUMOR NECROSIS FACTOR)', 'Infiammazione', 85.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('toluene-urine-f-t', 'TOLUENE URINE F.T.', 'Renale', 20.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tonno-ige-specifiche', 'TONNO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('toxoplasma-test-di-avidita-igg', 'TOXOPLASMA - TEST DI AVIDITA'' IgG', 'Autoimmunità', 27.0, '48-72h', '{"gravidanza", "infezioni_frequenti"}'::TEXT[], false, NULL, 'pregravidanza', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tpha', 'TPHA', 'Altro', 5.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('transaminasi-g-o-t-ast', 'TRANSAMINASI G.O.T.(AST)', 'Epatico', 2.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('transaminasi-g-p-t-alt', 'TRANSAMINASI G.P.T.(ALT)', 'Epatico', 2.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('transferrina', 'TRANSFERRINA', 'Ematologia', 5.0, '48-72h', '{"anemia"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('transferrina-insatura', 'TRANSFERRINA INSATURA', 'Ematologia', 6.0, '48-72h', '{"anemia"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('treponema-pallidum-anticorpi-med-emoa', 'TREPONEMA PALLIDUM ANTICORPI MED EMOA', 'Autoimmunità', 80.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('trichomonas-urine', 'TRICHOMONAS URINE', 'Renale', 10.0, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('trichomonas-vaginalis-dna', 'Trichomonas vaginalis DNA', 'Genetica/Molecolare', 70.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tricloroetanolo-tce-urine-f-t', 'TRICLOROETANOLO (TCE) URINE F.T.', 'Renale', 14.3, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tricloroetanolo-tce-urine-i-t', 'TRICLOROETANOLO (TCE) URINE I.T.', 'Renale', 14.3, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('triiodotironina-libera-ft3', 'TRIIODOTIRONINA LIBERA (FT3)', 'Tiroide', 9.0, '48-72h', '{"aumento_peso", "stanchezza", "perdita_capelli", "dimagrimento", "palpitazioni"}'::TEXT[], false, NULL, 'donna-over40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('triptasi', 'TRIPTASI', 'Coagulazione', 95.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('trombofilia-15-mutazioni', 'Trombofilia-15 mutazioni', 'Genetica/Molecolare', 150.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('troponina-t-alta-sensibilita', 'TROPONINA T  ALTA SENSIBILITA''', 'Epatico', 19.4, 'urgente', '{"controllo_cuore", "palpitazioni"}'::TEXT[], false, NULL, 'cardio', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('trota-ige-specifiche', 'TROTA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tsh-reflex', 'TSH REFLEX', 'Tiroide', 25.0, '48h', '{"aumento_peso", "stanchezza", "perdita_capelli", "dimagrimento", "menopausa", "gravidanza", "palpitazioni", "insonnia", "infertilita", "ansia_stress"}'::TEXT[], false, NULL, 'donna-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tunel-test-test-di-frammentazione-del-dna-spermati', 'TUNEL TEST (Test di frammentazione del DNA spermatico)', 'Genetica/Molecolare', 180.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tuorlo-ige-specifiche', 'TUORLO (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('tyrophagus-putrescentiae-acari-minori-ige-specific', 'TYROPHAGUS PUTRESCENTIAE (Acari minori) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ureaplasma-parvum-dna', 'Ureaplasma parvum DNA', 'Renale', 75.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('ureaplasma-urealyticum-dna', 'Ureaplasma urealyticum DNA', 'Renale', 70.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('uricuria-urine-24h', 'URICURIA URINE 24H', 'Renale', 3.99, '24h', '{"gravidanza", "controllo_reni"}'::TEXT[], false, 'Raccolta urine 24 ore', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('urina-di-ratto-ige-specifiche', 'URINA DI RATTO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('urina-di-topo-ige-specifiche', 'URINA DI TOPO (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('uva-ige-specifiche', 'UVA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vanadio-urine-f-t', 'VANADIO URINE F.T.', 'Renale', 21.6, '24h', '{"gravidanza", "dolori_articolari", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vanadio-urine-i-t', 'VANADIO URINE I.T.', 'Renale', 21.6, '24h', '{"gravidanza", "dolori_articolari", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vaniglia-ige-specifiche', 'VANIGLIA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vdrl', 'VDRL', 'Altro', 8.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vespa-polistes-species-ige-specifiche', 'VESPA (POLISTES SPECIES) (IgE SPECIFICHE)', 'Infiammazione', 19.0, '48-72h', '{"dimagrimento", "dolori_articolari", "allergie", "infezioni_frequenti"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('virus-epatite-b-hbv-reflex', 'VIRUS EPATITE B (HBV REFLEX)', 'Epatico', 45.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('virus-epatite-c-immunoblotting-r-i-b-a', 'VIRUS EPATITE C IMMUNOBLOTTING (R.I.B.A.)', 'Epatico', 400.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('virus-respiratorio-sincinziale-vrs', 'VIRUS RESPIRATORIO SINCINZIALE (VRS)', 'Altro', 12.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('visite-di-secondo-controllo-torres', 'Visite di secondo controllo Torres', 'Altro', 192.93, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vit-k', 'VIT K', 'Altro', 323.2, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-a', 'VITAMINA A', 'Vitamina/Minerali', 35.0, '3-5gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-b1', 'VITAMINA B1', 'Vitamina/Minerali', 27.0, '3-5gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-b12', 'VITAMINA B12', 'Vitamina/Minerali', 15.5, '3-5gg', '{"stanchezza", "ansia_stress", "anemia"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-b2-ematica', 'Vitamina B2 ematica', 'Vitamina/Minerali', 18.0, '3-5gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-b3-nicotinamide', 'VITAMINA B3 (NICOTINAMIDE)', 'Vitamina/Minerali', 235.0, '3-5gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-b6', 'VITAMINA B6', 'Vitamina/Minerali', 31.0, '3-5gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-b9', 'VITAMINA B9', 'Vitamina/Minerali', 65.0, '3-5gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-c', 'VITAMINA C', 'Vitamina/Minerali', 75.0, '3-5gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-d-25-oh', 'VITAMINA D (25 OH)', 'Vitamina/Minerali', 16.0, '3-5gg', '{"menopausa", "stanchezza", "dolori_articolari", "perdita_capelli", "ansia_stress", "infezioni_frequenti"}'::TEXT[], false, NULL, 'donna-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-d-1-25-diidrossi', 'VITAMINA D 1-25 DIIDROSSI', 'Vitamina/Minerali', 92.0, '3-5gg', '{"menopausa", "stanchezza", "dolori_articolari", "perdita_capelli", "ansia_stress", "infezioni_frequenti"}'::TEXT[], false, NULL, 'donna-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-d-3-vitamina-d-25-oh-liposolubile', 'VITAMINA D 3 - VITAMINA D (25 OH) (LIPOSOLUBILE)', 'Vitamina/Minerali', 38.0, '3-5gg', '{"menopausa", "stanchezza", "dolori_articolari", "perdita_capelli", "ansia_stress", "infezioni_frequenti"}'::TEXT[], false, NULL, 'donna-under40', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-e', 'VITAMINA E', 'Vitamina/Minerali', 30.0, '3-5gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-h', 'VITAMINA H', 'Vitamina/Minerali', 100.0, '3-5gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vitamina-k', 'VITAMINA K', 'Vitamina/Minerali', 324.0, '3-5gg', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('von-willebrand-attivita', 'VON WILLEBRAND ATTIVITA''', 'Altro', 25.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('vongola-ige-specifiche', 'VONGOLA (IgE SPECIFICHE)', 'Autoimmunità', 19.0, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('weil-felix-anticorpi-anti-rickettsia-proteus', 'WEIL-FELIX (ANTICORPI ANTI-RICKETTSIA/PROTEUS)', 'Autoimmunità', 18.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('widal-wright', 'WIDAL-WRIGHT', 'Altro', 14.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('x-fragile-ricerca-gene-fmr1-fraxa', 'X Fragile - RICERCA gene FMR1 (FRAXA)', 'Altro', 90.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('x-fragile-gene-fmr1-livello-ii', 'X Fragile gene FMR1 (Livello II)', 'Altro', 170.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('x-fragile-fraxa', 'X-FRAGILE (FRAXA)', 'Altro', 100.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('xilosio', 'XILOSIO', 'Altro', 53.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('yersinia-nelle-feci', 'YERSINIA NELLE FECI', 'Fecale', 18.0, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('zanzara-aedes-communis-ige-specifiche', 'ZANZARA (AEDES COMMUNIS) (IgE SPECIFICHE)', 'Autoimmunità', 12.5, '48-72h', '{"allergie"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('zinco', 'ZINCO', 'Vitamina/Minerali', 22.0, '48-72h', '{"perdita_capelli"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('zinco-urine-f-t', 'ZINCO URINE F.T.', 'Renale', 20.0, '24h', '{"gravidanza", "perdita_capelli", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('zinco-urine-i-t', 'ZINCO URINE I.T.', 'Renale', 20.0, '24h', '{"gravidanza", "perdita_capelli", "controllo_reni"}'::TEXT[], false, 'Urine del mattino, mitto intermedio', 'base', 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('zincoprotoporfirina', 'ZINCOPROTOPORFIRINA', 'Vitamina/Minerali', 55.0, '48-72h', '{"perdita_capelli"}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('znt8-abs', 'ZnT8 Abs', 'Altro', 120.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('zntb-a', 'ZNTB A', 'Altro', 120.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('zonulina-fecale', 'ZONULINA FECALE', 'Fecale', 175.0, '48-72h', '{}'::TEXT[], false, 'Campione feci fresco', NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('zonulina-sierica', 'ZONULINA SIERICA', 'Altro', 95.5, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();

INSERT INTO lab_tests (id, name, category, price, turnaround_time, symptoms, fasting_required, preparation_notes, upsell_pack, status)
VALUES ('zucca-ihe-specifiche', 'ZUCCA (IhE SPECIFICHE)', 'Altro', 19.0, '48-72h', '{}'::TEXT[], false, NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, turnaround_time = EXCLUDED.turnaround_time, updated_at = NOW();


-- Total lab tests inserted: 1145


-- ============================================
-- Packs (from packs.json)
-- ============================================

INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  'checkup-base',
  'Check-up Base',
  'checkup-base',
  'checkup'::pack_type,
  'prevenzione',
  'Tutti gli adulti',
  '{"controllo annuale", "screening generale"}'::TEXT[],
  'Valutazione generale dello stato di salute con esami essenziali',
  'Esami fondamentali per screening di anemia, funzione renale, infiammazione e metabolismo glucidico',
  '7 esami essenziali per un controllo completo',
  '{"emocromo-completo", "glicemia", "creatinina", "azotemia", "colesterolo-totale", "esame-urine-completo", "ves"}'::TEXT[],
  7,
  15,
  '{"fasting_required": true, "fasting_hours": 8, "morning_only": true, "special_notes": "Portare campione urine del primo mitto mattutino"}'::JSONB,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();

INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  'checkup-completo',
  'Check-up Completo',
  'checkup-completo',
  'checkup'::pack_type,
  'prevenzione',
  'Adulti che desiderano un controllo approfondito',
  '{"prevenzione completa", "screening approfondito"}'::TEXT[],
  'Valutazione completa di tutti gli organi e apparati principali',
  'Include funzione epatica, renale, tiroidea, profilo lipidico completo, indici infiammatori e vitamine essenziali',
  '19 esami per una valutazione completa a 360°',
  '{"emocromo-completo", "glicemia", "emoglobina-glicata", "creatinina", "azotemia", "colesterolo-totale", "colesterolo-hdl", "colesterolo-ldl", "trigliceridi", "ast-got", "alt-gpt", "gamma-gt", "tsh-ultrasensibile", "ft4", "vitamina-d", "ferritina", "esame-urine-completo", "ves", "pcr"}'::TEXT[],
  19,
  25,
  '{"fasting_required": true, "fasting_hours": 12, "morning_only": true, "special_notes": "Digiuno 12 ore, evitare alcol 24h prima, portare urine primo mitto"}'::JSONB,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();

INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  'checkup-tiroide',
  'Profilo Tiroide Completo',
  'checkup-tiroide',
  'checkup'::pack_type,
  'endocrinologia',
  'Persone con sintomi tiroidei o familiarità',
  '{"ipotiroidismo", "ipertiroidismo", "tiroidite", "noduli tiroidei"}'::TEXT[],
  'Valutazione completa della funzione tiroidea e autoimmunità',
  'Include tutti gli ormoni tiroidei e gli anticorpi per diagnosi differenziale di patologie tiroidee',
  'Profilo tiroideo completo con screening autoimmunità',
  '{"tsh-ultrasensibile", "ft3", "ft4", "anti-tpo"}'::TEXT[],
  4,
  20,
  '{"fasting_required": false, "fasting_hours": 0, "morning_only": true, "special_notes": "Prelievo mattutino preferibile per valori più stabili"}'::JSONB,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();

INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  'checkup-cardiovascolare',
  'Check-up Cardiovascolare',
  'checkup-cardiovascolare',
  'checkup'::pack_type,
  'cardiologia',
  'Persone con fattori di rischio cardiovascolare',
  '{"ipertensione", "dislipidemia", "diabete", "familiarità cardiovascolare"}'::TEXT[],
  'Valutazione completa del rischio cardiovascolare',
  'Profilo lipidico completo, glicemia, PCR ad alta sensibilità per stratificazione del rischio',
  'Profilo lipidico + marker infiammatori per il tuo cuore',
  '{"colesterolo-totale", "colesterolo-hdl", "colesterolo-ldl", "trigliceridi", "glicemia", "pcr"}'::TEXT[],
  6,
  18,
  '{"fasting_required": true, "fasting_hours": 12, "morning_only": true, "special_notes": "Digiuno 12 ore, evitare alcol 24h prima"}'::JSONB,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();

INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  'checkup-diabete',
  'Profilo Diabete',
  'checkup-diabete',
  'checkup'::pack_type,
  'metabolismo',
  'Diabetici o persone a rischio',
  '{"diabete tipo 2", "prediabete", "obesità", "familiarità diabete"}'::TEXT[],
  'Monitoraggio completo del compenso glicemico',
  'Glicemia a digiuno ed emoglobina glicata per diagnosi e monitoraggio del diabete',
  'Controllo glicemico a breve e lungo termine',
  '{"glicemia", "emoglobina-glicata"}'::TEXT[],
  2,
  10,
  '{"fasting_required": true, "fasting_hours": 8, "morning_only": true, "special_notes": "Digiuno almeno 8 ore"}'::JSONB,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();

INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  'checkup-epatico',
  'Profilo Epatico',
  'checkup-epatico',
  'checkup'::pack_type,
  'epatologia',
  'Persone con sospetta epatopatia o uso farmaci',
  '{"steatosi", "epatite", "cirrosi", "farmaci epatotossici"}'::TEXT[],
  'Valutazione completa della funzione epatica',
  'Transaminasi e GGT per screening e monitoraggio di patologie epatiche',
  'Controllo completo della salute del fegato',
  '{"ast-got", "alt-gpt", "gamma-gt"}'::TEXT[],
  3,
  15,
  '{"fasting_required": true, "fasting_hours": 8, "morning_only": false, "special_notes": "Evitare alcol 24 ore prima"}'::JSONB,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();

INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  'checkup-renale',
  'Profilo Renale',
  'checkup-renale',
  'checkup'::pack_type,
  'nefrologia',
  'Persone con ipertensione, diabete o familiarità',
  '{"insufficienza renale", "nefropatia diabetica", "ipertensione"}'::TEXT[],
  'Valutazione completa della funzione renale',
  'Creatinina, azotemia e esame urine per screening nefropatia',
  'Controllo completo della funzione renale',
  '{"creatinina", "azotemia", "esame-urine-completo"}'::TEXT[],
  3,
  12,
  '{"fasting_required": false, "fasting_hours": 0, "morning_only": true, "special_notes": "Portare campione urine primo mitto mattutino"}'::JSONB,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();

INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  'checkup-donna-over40',
  'Check-up Donna Over 40',
  'checkup-donna-over40',
  'checkup'::pack_type,
  'prevenzione',
  'Donne oltre i 40 anni',
  '{"menopausa", "osteoporosi", "anemia", "tiroide"}'::TEXT[],
  'Screening mirato per le esigenze della donna dopo i 40 anni',
  'Include tiroide, ferro, vitamina D e parametri metabolici specifici per la donna',
  '7 esami mirati per la salute femminile dopo i 40',
  '{"emocromo-completo", "tsh-ultrasensibile", "ferritina", "vitamina-d", "colesterolo-totale", "colesterolo-hdl", "glicemia"}'::TEXT[],
  7,
  22,
  '{"fasting_required": true, "fasting_hours": 8, "morning_only": true, "special_notes": "Prelievo mattutino a digiuno"}'::JSONB,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();

INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  'checkup-uomo-over40',
  'Check-up Uomo Over 40',
  'checkup-uomo-over40',
  'checkup'::pack_type,
  'prevenzione',
  'Uomini oltre i 40 anni',
  '{"prostata", "cardiovascolare", "metabolico"}'::TEXT[],
  'Screening mirato per le esigenze dell''uomo dopo i 40 anni',
  'Include PSA per prostata, profilo lipidico e metabolico per prevenzione cardiovascolare',
  '7 esami mirati per la salute maschile dopo i 40',
  '{"emocromo-completo", "psa-totale", "colesterolo-totale", "colesterolo-hdl", "colesterolo-ldl", "trigliceridi", "glicemia"}'::TEXT[],
  7,
  22,
  '{"fasting_required": true, "fasting_hours": 12, "morning_only": true, "special_notes": "Digiuno 12 ore, evitare rapporti sessuali e bicicletta 48h prima"}'::JSONB,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();

INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  'checkup-anemia',
  'Profilo Anemia',
  'checkup-anemia',
  'checkup'::pack_type,
  'ematologia',
  'Persone con stanchezza, pallore o mestruazioni abbondanti',
  '{"anemia sideropenica", "carenza ferro", "stanchezza cronica"}'::TEXT[],
  'Diagnosi completa delle cause di anemia',
  'Emocromo e assetto marziale per diagnosi differenziale dell''anemia',
  'Diagnosi completa di anemia e carenza di ferro',
  '{"emocromo-completo", "ferritina"}'::TEXT[],
  2,
  10,
  '{"fasting_required": true, "fasting_hours": 8, "morning_only": true, "special_notes": "Prelievo mattutino a digiuno"}'::JSONB,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();

INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  'checkup-prostata',
  'Profilo Prostata',
  'checkup-prostata',
  'checkup'::pack_type,
  'urologia',
  'Uomini oltre i 50 anni o con familiarità',
  '{"ipertrofia prostatica", "tumore prostata", "PSA elevato"}'::TEXT[],
  'Screening completo della salute prostatica',
  'PSA totale per screening tumore prostatico',
  'Screening precoce per la salute della prostata',
  '{"psa-totale"}'::TEXT[],
  1,
  0,
  '{"fasting_required": false, "fasting_hours": 0, "morning_only": false, "special_notes": "Evitare rapporti sessuali, bicicletta, esplorazione rettale 48h prima"}'::JSONB,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();

INSERT INTO packs (
  id, name, slug, type, category, target_audience, target_conditions,
  clinical_benefit, clinical_rationale, value_proposition,
  exams_included, exams_count, savings_pct, preparation_summary, status
) VALUES (
  'checkup-osteoporosi',
  'Profilo Osteoporosi',
  'checkup-osteoporosi',
  'checkup'::pack_type,
  'metabolismo',
  'Donne in menopausa o persone con fattori di rischio',
  '{"osteoporosi", "osteopenia", "fratture da fragilità"}'::TEXT[],
  'Valutazione del metabolismo osseo',
  'Vitamina D e calcio per valutazione rischio osteoporosi',
  'Controllo della vitamina D per la salute delle ossa',
  '{"vitamina-d"}'::TEXT[],
  1,
  0,
  '{"fasting_required": false, "fasting_hours": 0, "morning_only": false, "special_notes": "Nessuna preparazione richiesta"}'::JSONB,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  exams_included = EXCLUDED.exams_included,
  exams_count = EXCLUDED.exams_count,
  updated_at = NOW();


-- ============================================
-- Pathways (from pathways.json)
-- ============================================

INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  'slim-care',
  'Slim Care - Percorso Dimagrimento',
  'Slim Care',
  'slim-care',
  'clinical_pathway'::pathway_type,
  'Percorso medico di 3 mesi con Wegovy o Mounjaro. Perdita media 12-18 kg.',
  'Percorso medico strutturato per il dimagrimento con farmaci di ultima generazione (Wegovy/Mounjaro), monitoraggio VisBody 3D, supporto nutrizionale e certificato medico sportivo.',
  'Perdita di peso sicura e monitorata con farmaci GLP-1/GIP approvati',
  'BMI ≥30, o BMI ≥27 con comorbidità (diabete, ipertensione, dislipidemia)',
  '3 mesi',
  '12-18 kg di perdita peso',
  true,
  10,
  '{"dimagrimento", "perdere peso", "wegovy", "mounjaro", "semaglutide", "tirzepatide"}'::TEXT[],
  '{"dimagrire", "peso", "obesità", "sovrappeso", "grasso", "pancia", "fame"}'::TEXT[],
  'scale',
  '{"procedures": ["visita-endocrinologica", "visita-nutrizionale", "visbody-scan", "certificato-sportivo"], "tests": ["emocromo", "glicemia", "profilo-lipidico", "tsh", "ft4", "creatinina", "transaminasi"], "physicians": ["francesco-tolu", "irene-aini", "antonella-galatino", "alessandro-pandolfi", "giorgio-chiarelli"]}'::JSONB,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();

INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  'slim-care-donna',
  'Slim Care Donna',
  'Slim Care Donna',
  'slim-care-donna',
  'clinical_pathway'::pathway_type,
  'Percorso dimagrante specifico per donne con PCOS o in menopausa.',
  'Integrazione endocrino-ginecologica per la gestione del peso femminile. Include valutazione ormonale, gestione PCOS, supporto menopausa.',
  'Approccio integrato endocrino-ginecologico per il peso femminile',
  'Donne con PCOS, perimenopausa, menopausa, difficoltà a perdere peso',
  '3 mesi',
  'Perdita peso + riequilibrio ormonale',
  true,
  9,
  '{"dimagrimento donna", "menopausa peso", "pcos dimagrire"}'::TEXT[],
  '{"menopausa", "pcos", "ovaio policistico", "ciclo irregolare", "peso donna"}'::TEXT[],
  'female',
  '{"procedures": ["visita-ginecologica", "visita-endocrinologica", "visita-nutrizionale", "ecografia-pelvica"], "tests": ["profilo-ormonale-femminile", "tsh", "ft4", "insulina", "glicemia"], "physicians": ["francesco-dessole", "irene-aini", "antonella-galatino", "giorgio-chiarelli"]}'::JSONB,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();

INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  'pma-fertilita',
  'PMA - Procreazione Medicalmente Assistita',
  'PMA / Fertilità',
  'pma-fertilita',
  'clinical_pathway'::pathway_type,
  'Percorso completo per la fertilità di coppia con monitoraggio 7/7.',
  'Centro di riferimento per la procreazione medicalmente assistita. Diagnostica avanzata (Endobiome, Endorecept, TUNEL), monitoraggio follicolare 7 giorni su 7, diagnostica prenatale.',
  'Supporto completo alla coppia nel percorso verso la genitorialità',
  'Coppie con infertilità >12 mesi, età materna >35, PCOS, endometriosi, fattore maschile',
  'Variabile',
  'Gravidanza',
  true,
  9,
  '{"fertilità", "infertilità", "fecondazione", "procreazione assistita", "avere figli"}'::TEXT[],
  '{"fertilità", "infertilità", "gravidanza", "concepimento", "ovulazione", "spermatozoi"}'::TEXT[],
  'baby',
  '{"procedures": ["visita-ginecologica", "monitoraggio-follicolare", "isteroscopia", "consulenza-coppia"], "tests": ["spermiogramma", "endobiome", "endorecept", "tunel", "profilo-ormonale", "prenatal-advance"], "physicians": ["salvatore-dessole", "francesco-dessole", "marco-petrillo", "angelica-fois", "cinzia-guarino"]}'::JSONB,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();

INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  'checkup-tiroide',
  'Check-up Tiroide Completo',
  'Check-up Tiroide',
  'checkup-tiroide',
  'clinical_pathway'::pathway_type,
  'Valutazione completa della funzionalità tiroidea: visita + ecografia + 5 esami.',
  'Percorso diagnostico completo per la tiroide che include visita endocrinologica, ecografia tiroidea e pannello ematico completo (TSH, FT3, FT4, Anti-TPO, Anti-TG).',
  'Diagnosi precoce di ipotiroidismo, ipertiroidismo, tiroiditi autoimmuni',
  'Donne over 35, familiarità tiroidea, sintomi sospetti, screening preventivo',
  '1-2 settimane',
  'Quadro completo funzionalità tiroidea',
  false,
  8,
  '{"controllo tiroide", "esami tiroide", "tiroide completo"}'::TEXT[],
  '{"tiroide", "stanchezza", "affaticamento", "peso inspiegabile", "freddo", "caldo", "nervosismo"}'::TEXT[],
  'thyroid',
  '{"procedures": ["visita-endocrinologica", "ecografia-tiroidea"], "tests": ["tsh", "ft3", "ft4", "anti-tpo", "anti-tg"], "physicians": ["francesco-tolu", "irene-aini"]}'::JSONB,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();

INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  'checkup-cardiovascolare',
  'Check-up Cardiovascolare',
  'Check-up Cuore',
  'checkup-cardiovascolare',
  'clinical_pathway'::pathway_type,
  'Screening cardiovascolare completo: visita + ECG + ecocardiogramma + esami.',
  'Percorso di prevenzione cardiovascolare che include visita cardiologica, elettrocardiogramma, ecocardiogramma color doppler e profilo lipidico completo.',
  'Prevenzione di eventi cardiovascolari, diagnosi precoce cardiopatie',
  'Over 40, familiarità cardiovascolare, ipertensione, diabete, fumatori',
  '1 giorno',
  'Valutazione rischio cardiovascolare',
  false,
  8,
  '{"controllo cuore", "check cuore", "prevenzione infarto"}'::TEXT[],
  '{"cuore", "palpitazioni", "affanno", "dolore petto", "fiato corto", "pressione alta"}'::TEXT[],
  'heart',
  '{"procedures": ["visita-cardiologica", "ecg", "ecocardiogramma"], "tests": ["profilo-lipidico", "glicemia", "creatinina", "emocromo"], "physicians": ["tonino-bullitta", "sara-uras", "giuliana-guagnozzi", "paolo-pischedda", "paolo-franca"]}'::JSONB,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();

INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  'checkup-donna-under40',
  'Check-up Donna Under 40',
  'Check-up Donna <40',
  'checkup-donna-under40',
  'clinical_pathway'::pathway_type,
  'Screening preventivo per donna under 40: esami sangue + pap test + eco pelvica.',
  'Pacchetto di prevenzione femminile per donne sotto i 40 anni. Include emocromo, profilo metabolico, funzionalità tiroidea, pap test e ecografia pelvica.',
  'Prevenzione oncologica e metabolica femminile',
  'Donne 25-39 anni, screening annuale',
  '1-2 settimane',
  'Quadro preventivo completo',
  false,
  7,
  '{"check donna giovane", "prevenzione donna"}'::TEXT[],
  '{"prevenzione donna", "controllo donna", "screening donna"}'::TEXT[],
  'female',
  '{"procedures": ["visita-ginecologica", "ecografia-pelvica", "pap-test"], "tests": ["emocromo", "glicemia", "profilo-lipidico", "tsh", "ft4", "ferro", "ferritina", "vitamina-d"], "physicians": ["margherita-dessole", "maddalena-pola", "antonella-pruneddu"]}'::JSONB,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();

INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  'checkup-donna-over40',
  'Check-up Donna Over 40',
  'Check-up Donna >40',
  'checkup-donna-over40',
  'clinical_pathway'::pathway_type,
  'Screening completo per donna over 40: esami + eco mammaria + MOC + pap test.',
  'Pacchetto di prevenzione avanzata per donne over 40. Include tutti gli esami del pacchetto under 40 più ecografia mammaria, MOC e marcatori tumorali.',
  'Prevenzione oncologica, osteoporosi, menopausa',
  'Donne over 40, perimenopausa, menopausa',
  '1-2 settimane',
  'Screening preventivo completo',
  false,
  7,
  '{"check donna matura", "prevenzione menopausa"}'::TEXT[],
  '{"prevenzione donna", "menopausa", "osteoporosi", "mammografia"}'::TEXT[],
  'female',
  '{"procedures": ["visita-ginecologica", "ecografia-mammaria", "ecografia-pelvica", "pap-test", "moc"], "tests": ["emocromo", "profilo-lipidico", "tsh", "ft4", "ca125", "vitamina-d", "calcio", "fosforo"], "physicians": ["salvatore-dessole", "francesco-dessole", "margherita-dessole"]}'::JSONB,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();

INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  'checkup-uomo',
  'Check-up Uomo',
  'Check-up Uomo',
  'checkup-uomo',
  'clinical_pathway'::pathway_type,
  'Screening maschile completo: esami sangue + PSA + ecografia prostatica.',
  'Pacchetto di prevenzione maschile. Include emocromo, profilo metabolico, funzionalità tiroidea, PSA totale e libero, ecografia prostatica.',
  'Prevenzione oncologica prostatica e cardiovascolare',
  'Uomini over 45, familiarità prostatica',
  '1-2 settimane',
  'Screening preventivo maschile',
  false,
  7,
  '{"check uomo", "prevenzione uomo", "prostata"}'::TEXT[],
  '{"prevenzione uomo", "prostata", "psa", "controllo uomo"}'::TEXT[],
  'male',
  '{"procedures": ["ecografia-prostatica"], "tests": ["emocromo", "glicemia", "profilo-lipidico", "tsh", "psa-totale", "psa-libero", "creatinina", "transaminasi"], "physicians": []}'::JSONB,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();

INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  'checkup-base',
  'Check-up Base',
  'Check-up Base',
  'checkup-base',
  'clinical_pathway'::pathway_type,
  'Pannello base di esami del sangue per il controllo generale della salute.',
  'Pacchetto essenziale che include emocromo completo, glicemia, profilo lipidico, funzionalità epatica e renale, esame urine.',
  'Valutazione generale stato di salute',
  'Tutti, screening annuale',
  '24-48h',
  'Quadro ematochimico base',
  false,
  6,
  '{"analisi base", "esami base", "controllo generale"}'::TEXT[],
  '{"analisi", "controllo", "esami sangue", "check generale"}'::TEXT[],
  'check',
  '{"procedures": [], "tests": ["emocromo", "glicemia", "profilo-lipidico", "transaminasi", "creatinina", "azotemia", "esame-urine"], "physicians": []}'::JSONB,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();

INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  'profilo-tiroideo',
  'Profilo Tiroideo',
  'Profilo Tiroideo',
  'profilo-tiroideo',
  'clinical_pathway'::pathway_type,
  'Pannello completo esami tiroidei: TSH, FT3, FT4, Anti-TPO, Anti-TG.',
  'Pacchetto di esami ematici per la valutazione completa della funzionalità tiroidea e screening tiroiditi autoimmuni.',
  'Diagnosi disfunzioni tiroidee',
  'Sospetto ipo/ipertiroidismo, familiarità, screening',
  '24h',
  'Quadro tiroideo completo',
  false,
  7,
  '{"esami tiroide", "pannello tiroide"}'::TEXT[],
  '{"tiroide", "tsh", "ipotiroidismo", "ipertiroidismo"}'::TEXT[],
  'thyroid',
  '{"procedures": [], "tests": ["tsh", "ft3", "ft4", "anti-tpo", "anti-tg"], "physicians": []}'::JSONB,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();

INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  'screening-allergologico',
  'Screening Allergologico',
  'Screening Allergie',
  'screening-allergologico',
  'clinical_pathway'::pathway_type,
  'Pannello completo IgE specifiche per allergeni inalanti e alimentari.',
  'Test allergologico completo con dosaggio IgE specifiche per i principali allergeni inalanti (pollini, acari, muffe) e alimentari (latte, uova, frutta secca).',
  'Identificazione allergeni responsabili',
  'Sintomi allergici, rinite, asma, orticaria, dermatite',
  '5-7 giorni',
  'Mappa allergeni',
  false,
  6,
  '{"test allergie", "allergie", "intolleranze"}'::TEXT[],
  '{"allergia", "allergie", "prurito", "orticaria", "asma", "rinite", "intolleranza"}'::TEXT[],
  'allergy',
  '{"procedures": [], "tests": ["ige-totali", "ige-inalanti-panel", "ige-alimentari-panel", "eosinofili"], "physicians": []}'::JSONB,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();

INSERT INTO pathways (
  id, name, name_short, slug, type, description_short, description_long,
  clinical_benefit, target_audience, duration, expected_outcome,
  is_flagship, priority_score, aliases, symptom_keywords, icon,
  includes, page_url, status
) VALUES (
  'checkup-pregravidanza',
  'Check-up Pre-Gravidanza',
  'Check-up Pre-Gravidanza',
  'checkup-pregravidanza',
  'clinical_pathway'::pathway_type,
  'Screening completo per la coppia che desidera una gravidanza.',
  'Pacchetto di esami preconcezionali per lei e per lui. Include gruppo sanguigno, test infettivologici (toxoplasmosi, rosolia, CMV, HIV, HBV, HCV), emocromo, sideremia.',
  'Preparazione ottimale alla gravidanza',
  'Coppie che desiderano una gravidanza',
  '1 settimana',
  'Idoneità alla gravidanza',
  false,
  7,
  '{"esami pre concepimento", "preconcezionale", "prima della gravidanza"}'::TEXT[],
  '{"gravidanza", "concepimento", "avere figli", "rimanere incinta"}'::TEXT[],
  'baby',
  '{"procedures": ["visita-ginecologica"], "tests": ["gruppo-sanguigno", "toxoplasmosi", "rosolia", "citomegalovirus", "hiv", "hbsag", "hcv", "emocromo", "sideremia"], "physicians": ["francesco-dessole", "margherita-dessole"]}'::JSONB,
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_short = EXCLUDED.description_short,
  is_flagship = EXCLUDED.is_flagship,
  includes = EXCLUDED.includes,
  updated_at = NOW();


-- ============================================
-- Relationship Tables (M:N)
-- ============================================

-- physician_procedures

INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('francesco-dessole', 'visita-ginecologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('salvatore-dessole', 'visita-ginecologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('maddalena-pola', 'visita-ginecologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('maddalena-pola', 'pap-test', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('marco-petrillo', 'visita-ginecologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('marco-petrillo', 'isteroscopia', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('antonella-pruneddu', 'visita-ginecologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('antonella-pruneddu', 'pap-test', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('sonia-bove', 'visita-ginecologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('sonia-bove', 'ecografia-mammaria', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('margherita-dessole', 'visita-ginecologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('margherita-dessole', 'pap-test', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('margherita-dessole', 'colposcopia', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('tonino-bullitta', 'visita-cardiologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('tonino-bullitta', 'ecg', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('tonino-bullitta', 'ecocardiogramma', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('tonino-bullitta', 'holter-ecg', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('tonino-bullitta', 'holter-pressorio', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('sara-uras', 'visita-cardiologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('sara-uras', 'ecg', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('sara-uras', 'ecocardiogramma', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('sara-uras', 'holter-ecg', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('paolo-pischedda', 'visita-cardiologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('paolo-pischedda', 'ecg', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('paolo-pischedda', 'ecocardiogramma', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('paolo-franca', 'visita-cardiologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('paolo-franca', 'ecg', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('paolo-franca', 'ecocardiogramma', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('giovanna-costa', 'visita-dermatologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('alessandra-musinu', 'visita-dermatologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('speranza-anedda', 'visita-dermatologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('carlo-burrai', 'visita-endocrinologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('carlo-burrai', 'ecografia-tiroidea', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('fabrizia-caucci', 'visita-diabetologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('fabrizia-caucci', 'visita-endocrinologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('fabrizia-caucci', 'ecografia-tiroidea', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('francesco-tolu', 'visita-endocrinologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('francesco-tolu', 'ecografia-tiroidea', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('francesco-tolu', 'visita-diabetologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('irene-aini', 'visita-endocrinologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('irene-aini', 'ecografia-tiroidea', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('guido-marongiu', 'visita-neurologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('guido-marongiu', 'elettromiografia', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('sebastiano-traccis', 'visita-neurologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('sebastiano-traccis', 'elettromiografia', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('maria-pina-pintus', 'visita-oculistica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('francesco-santoru', 'visita-oculistica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('matteo-zucca', 'visita-oculistica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('andrea-donato', 'visita-ortopedica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('pietro-lisai', 'visita-ortopedica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('pietro-lisai', 'ecografia-muscolo-tendinea', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('pietro-pirina', 'spirometria', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('antonio-michele-cavazzuti', 'ecografia-muscolo-tendinea', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('antonio-michele-cavazzuti', 'ecografia-tiroidea', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('giuliana-guagnozzi', 'visita-cardiologica', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('giuliana-guagnozzi', 'ecg', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('giuliana-guagnozzi', 'ecocardiogramma', 'primary') ON CONFLICT DO NOTHING;
INSERT INTO physician_procedures (physician_id, procedure_id, role) VALUES ('antonella-galatino', 'visita-nutrizionale', 'primary') ON CONFLICT DO NOTHING;

-- physician_pathways

INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('francesco-dessole', 'slim-care-donna', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('francesco-dessole', 'pma-fertilita', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('salvatore-dessole', 'pma-fertilita', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('marco-petrillo', 'pma-fertilita', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('angelica-fois', 'pma-fertilita', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('tonino-bullitta', 'checkup-cardiovascolare', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('sara-uras', 'checkup-cardiovascolare', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('paolo-pischedda', 'checkup-cardiovascolare', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('paolo-franca', 'checkup-cardiovascolare', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('fabrizia-caucci', 'slim-care', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('francesco-tolu', 'slim-care', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('francesco-tolu', 'slim-care-donna', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('francesco-tolu', 'checkup-tiroide', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('irene-aini', 'slim-care', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('irene-aini', 'slim-care-donna', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('irene-aini', 'checkup-tiroide', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('giorgio-chiarelli', 'slim-care', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('giorgio-chiarelli', 'slim-care-donna', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('alessia-piras', 'slim-care', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('alessia-piras', 'slim-care-donna', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('alessandro-pandolfi', 'slim-care', 'team_member') ON CONFLICT DO NOTHING;
INSERT INTO physician_pathways (physician_id, pathway_id, role) VALUES ('antonella-galatino', 'slim-care', 'team_member') ON CONFLICT DO NOTHING;

-- procedure_pathways

INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('visita-ginecologica', 'pma-fertilita') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('visita-ginecologica', 'slim-care-donna') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('ecografia-transvaginale', 'pma-fertilita') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('ecografia-mammaria', 'slim-care-donna') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('visita-cardiologica', 'checkup-cardiovascolare') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('visita-endocrinologica', 'slim-care') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('visita-endocrinologica', 'slim-care-donna') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('ecografia-tiroidea', 'checkup-tiroide') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('visita-diabetologica', 'slim-care') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('visita-nutrizionale', 'slim-care') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('visita-nutrizionale', 'slim-care-donna') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('bioimpedenziometria', 'slim-care') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('bioimpedenziometria', 'slim-care-donna') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('consulto-pma', 'pma-fertilita') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('spermiogramma', 'pma-fertilita') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('caressflow', 'slim-care-donna') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('radiofrequenza-vaginale', 'slim-care-donna') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('isteroscopia', 'pma-fertilita') ON CONFLICT DO NOTHING;
INSERT INTO procedure_pathways (procedure_id, pathway_id) VALUES ('isterosalpingografia', 'pma-fertilita') ON CONFLICT DO NOTHING;

-- test_packs

INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('emocromo-completo', 'checkup-base', 0) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('glicemia', 'checkup-base', 1) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('creatinina', 'checkup-base', 2) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('azotemia', 'checkup-base', 3) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('colesterolo-totale', 'checkup-base', 4) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('esame-urine-completo', 'checkup-base', 5) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('ves', 'checkup-base', 6) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('emocromo-completo', 'checkup-completo', 0) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('glicemia', 'checkup-completo', 1) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('emoglobina-glicata', 'checkup-completo', 2) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('creatinina', 'checkup-completo', 3) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('azotemia', 'checkup-completo', 4) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('colesterolo-totale', 'checkup-completo', 5) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('colesterolo-hdl', 'checkup-completo', 6) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('colesterolo-ldl', 'checkup-completo', 7) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('trigliceridi', 'checkup-completo', 8) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('ast-got', 'checkup-completo', 9) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('alt-gpt', 'checkup-completo', 10) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('gamma-gt', 'checkup-completo', 11) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('tsh-ultrasensibile', 'checkup-completo', 12) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('ft4', 'checkup-completo', 13) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('vitamina-d', 'checkup-completo', 14) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('ferritina', 'checkup-completo', 15) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('esame-urine-completo', 'checkup-completo', 16) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('ves', 'checkup-completo', 17) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('pcr', 'checkup-completo', 18) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('tsh-ultrasensibile', 'checkup-tiroide', 0) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('ft3', 'checkup-tiroide', 1) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('ft4', 'checkup-tiroide', 2) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('anti-tpo', 'checkup-tiroide', 3) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('colesterolo-totale', 'checkup-cardiovascolare', 0) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('colesterolo-hdl', 'checkup-cardiovascolare', 1) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('colesterolo-ldl', 'checkup-cardiovascolare', 2) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('trigliceridi', 'checkup-cardiovascolare', 3) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('glicemia', 'checkup-cardiovascolare', 4) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('pcr', 'checkup-cardiovascolare', 5) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('glicemia', 'checkup-diabete', 0) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('emoglobina-glicata', 'checkup-diabete', 1) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('ast-got', 'checkup-epatico', 0) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('alt-gpt', 'checkup-epatico', 1) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('gamma-gt', 'checkup-epatico', 2) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('creatinina', 'checkup-renale', 0) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('azotemia', 'checkup-renale', 1) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('esame-urine-completo', 'checkup-renale', 2) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('emocromo-completo', 'checkup-donna-over40', 0) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('tsh-ultrasensibile', 'checkup-donna-over40', 1) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('ferritina', 'checkup-donna-over40', 2) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('vitamina-d', 'checkup-donna-over40', 3) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('colesterolo-totale', 'checkup-donna-over40', 4) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('colesterolo-hdl', 'checkup-donna-over40', 5) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('glicemia', 'checkup-donna-over40', 6) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('emocromo-completo', 'checkup-uomo-over40', 0) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('psa-totale', 'checkup-uomo-over40', 1) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('colesterolo-totale', 'checkup-uomo-over40', 2) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('colesterolo-hdl', 'checkup-uomo-over40', 3) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('colesterolo-ldl', 'checkup-uomo-over40', 4) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('trigliceridi', 'checkup-uomo-over40', 5) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('glicemia', 'checkup-uomo-over40', 6) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('emocromo-completo', 'checkup-anemia', 0) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('ferritina', 'checkup-anemia', 1) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('psa-totale', 'checkup-prostata', 0) ON CONFLICT DO NOTHING;
INSERT INTO test_packs (test_id, pack_id, sort_order) VALUES ('vitamina-d', 'checkup-osteoporosi', 0) ON CONFLICT DO NOTHING;

-- test_pathways

INSERT INTO test_pathways (test_id, pathway_id) VALUES ('emocromo', 'slim-care') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('glicemia', 'slim-care') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('profilo-lipidico', 'slim-care') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('tsh', 'slim-care') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ft4', 'slim-care') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('creatinina', 'slim-care') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('transaminasi', 'slim-care') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('profilo-ormonale-femminile', 'slim-care-donna') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('tsh', 'slim-care-donna') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ft4', 'slim-care-donna') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('insulina', 'slim-care-donna') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('glicemia', 'slim-care-donna') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('spermiogramma', 'pma-fertilita') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('endobiome', 'pma-fertilita') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('endorecept', 'pma-fertilita') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('tunel', 'pma-fertilita') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('profilo-ormonale', 'pma-fertilita') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('prenatal-advance', 'pma-fertilita') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('tsh', 'checkup-tiroide') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ft3', 'checkup-tiroide') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ft4', 'checkup-tiroide') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('anti-tpo', 'checkup-tiroide') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('anti-tg', 'checkup-tiroide') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('profilo-lipidico', 'checkup-cardiovascolare') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('glicemia', 'checkup-cardiovascolare') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('creatinina', 'checkup-cardiovascolare') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('emocromo', 'checkup-cardiovascolare') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('emocromo', 'checkup-donna-under40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('glicemia', 'checkup-donna-under40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('profilo-lipidico', 'checkup-donna-under40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('tsh', 'checkup-donna-under40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ft4', 'checkup-donna-under40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ferro', 'checkup-donna-under40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ferritina', 'checkup-donna-under40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('vitamina-d', 'checkup-donna-under40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('emocromo', 'checkup-donna-over40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('profilo-lipidico', 'checkup-donna-over40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('tsh', 'checkup-donna-over40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ft4', 'checkup-donna-over40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ca125', 'checkup-donna-over40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('vitamina-d', 'checkup-donna-over40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('calcio', 'checkup-donna-over40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('fosforo', 'checkup-donna-over40') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('emocromo', 'checkup-uomo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('glicemia', 'checkup-uomo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('profilo-lipidico', 'checkup-uomo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('tsh', 'checkup-uomo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('psa-totale', 'checkup-uomo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('psa-libero', 'checkup-uomo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('creatinina', 'checkup-uomo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('transaminasi', 'checkup-uomo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('emocromo', 'checkup-base') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('glicemia', 'checkup-base') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('profilo-lipidico', 'checkup-base') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('transaminasi', 'checkup-base') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('creatinina', 'checkup-base') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('azotemia', 'checkup-base') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('esame-urine', 'checkup-base') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('tsh', 'profilo-tiroideo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ft3', 'profilo-tiroideo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ft4', 'profilo-tiroideo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('anti-tpo', 'profilo-tiroideo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('anti-tg', 'profilo-tiroideo') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ige-totali', 'screening-allergologico') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ige-inalanti-panel', 'screening-allergologico') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('ige-alimentari-panel', 'screening-allergologico') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('eosinofili', 'screening-allergologico') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('gruppo-sanguigno', 'checkup-pregravidanza') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('toxoplasmosi', 'checkup-pregravidanza') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('rosolia', 'checkup-pregravidanza') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('citomegalovirus', 'checkup-pregravidanza') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('hiv', 'checkup-pregravidanza') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('hbsag', 'checkup-pregravidanza') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('hcv', 'checkup-pregravidanza') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('emocromo', 'checkup-pregravidanza') ON CONFLICT DO NOTHING;
INSERT INTO test_pathways (test_id, pathway_id) VALUES ('sideremia', 'checkup-pregravidanza') ON CONFLICT DO NOTHING;


-- ============================================
-- Initial Settings
-- ============================================

INSERT INTO settings (key, value, category, description) VALUES ('site_name', '{"it": "Bio-Clinic Sassari", "en": "Bio-Clinic Sassari"}'::JSONB, 'general', 'Nome del sito') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO settings (key, value, category, description) VALUES ('site_phone', '"+39 079 956 1332"'::JSONB, 'contacts', 'Telefono principale') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO settings (key, value, category, description) VALUES ('site_email', '"gestione@bio-clinic.it"'::JSONB, 'contacts', 'Email principale') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO settings (key, value, category, description) VALUES ('site_address', '{"street": "Via Renzo Mossa, 23", "city": "Sassari", "province": "SS", "zip": "07100", "country": "IT"}'::JSONB, 'contacts', 'Indirizzo sede operativa') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO settings (key, value, category, description) VALUES ('opening_hours', '{"mon_fri": "07:00-21:00", "sat": "08:00-14:00", "sun": "chiuso"}'::JSONB, 'contacts', 'Orari di apertura') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO settings (key, value, category, description) VALUES ('social_facebook', '"https://www.facebook.com/bioclinicss"'::JSONB, 'social', 'Pagina Facebook') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO settings (key, value, category, description) VALUES ('social_instagram', '"https://www.instagram.com/bioclinicss/"'::JSONB, 'social', 'Profilo Instagram') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO settings (key, value, category, description) VALUES ('legal_company', '"Bio Pharma S.r.l."'::JSONB, 'legal', 'Ragione sociale') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO settings (key, value, category, description) VALUES ('legal_vat', '"02869450904"'::JSONB, 'legal', 'Partita IVA') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO settings (key, value, category, description) VALUES ('legal_rea', '"SS-211220"'::JSONB, 'legal', 'Numero REA') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO settings (key, value, category, description) VALUES ('seo_default_title', '"Bio-Clinic Sassari | Poliambulatorio Medico"'::JSONB, 'seo', 'Title tag di default') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO settings (key, value, category, description) VALUES ('header_nav_items', '[{"label": "Home", "url": "/", "order": 1}, {"label": "Slim Care Medical", "url": "/slim-care/", "order": 2, "children": [{"label": "Slim Care", "url": "/slim-care/"}, {"label": "Slim Care Donna", "url": "/slim-care-donna/"}, {"label": "Screening INPS", "url": "/screening-inps/", "badge": "NEW"}, {"label": "Convenzioni Fondi", "url": "/convenzioni/"}]}, {"label": "Laboratorio", "url": "/laboratorio/", "order": 3}, {"label": "Aziende", "url": "/medicina-del-lavoro/", "order": 4}, {"label": "Specialisti", "url": "/equipe/", "order": 5}, {"label": "Contatti", "url": "/contatti/", "order": 6}]'::JSONB, 'navigation', 'Menu principale header') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO settings (key, value, category, description) VALUES ('footer_config', '{"description": "Poliambulatorio con 31 specialità, 67 medici e oltre 1.840 prestazioni.", "quick_links": [{"label": "Slim Care", "url": "/slim-care/"}, {"label": "PMA/Fertilità", "url": "/pma-fertilita/"}, {"label": "Chi Siamo", "url": "/chi-siamo/"}], "copyright": "© 2026 Bio Pharma S.r.l."}'::JSONB, 'navigation', 'Configurazione footer') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();



-- Re-enable audit triggers
ALTER TABLE specialties ENABLE TRIGGER tr_specialties_audit;
ALTER TABLE physicians ENABLE TRIGGER tr_physicians_audit;
ALTER TABLE procedures ENABLE TRIGGER tr_procedures_audit;
ALTER TABLE lab_tests ENABLE TRIGGER tr_lab_tests_audit;
ALTER TABLE packs ENABLE TRIGGER tr_packs_audit;
ALTER TABLE pathways ENABLE TRIGGER tr_pathways_audit;

-- Force search vector update on all rows
UPDATE specialties SET updated_at = NOW();
UPDATE physicians SET updated_at = NOW();
UPDATE procedures SET updated_at = NOW();
UPDATE lab_tests SET updated_at = NOW();

COMMIT;

-- ============================================================================
-- Migration Summary
-- ============================================================================
-- Specialties: 11
-- Physicians: 50
-- Procedures: 38
-- Lab Tests (structured): 23
-- Lab Tests (listino): 1136
-- Packs: 12
-- Pathways: 12
-- Settings: 14
-- Relationships: auto-generated from source data
-- ============================================================================
