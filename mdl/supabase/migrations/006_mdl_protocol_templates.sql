-- ============================================================================
-- 006: MDL Protocollli Sanitari Standard (catalogo template)
-- Libreria di protocolli standard, indipendenti dall'azienda, che il Medico
-- Competente può selezionare e applicare a una mansione (clonandoli in
-- mdl_protocols + mdl_protocol_exams per la specifica azienda).
-- ============================================================================

CREATE TABLE IF NOT EXISTS mdl_protocol_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(60) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  risk_factors TEXT[] DEFAULT '{}',
  visit_periodicity mdl_exam_periodicity NOT NULL DEFAULT 'annuale',
  legal_reference VARCHAR(120),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mdl_protocol_template_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES mdl_protocol_templates(id) ON DELETE CASCADE,
  exam_code VARCHAR(50) NOT NULL,
  exam_name VARCHAR(200) NOT NULL,
  exam_category VARCHAR(50),     -- ematochimico | strumentale | specialistico | tossicologico
  periodicity mdl_exam_periodicity NOT NULL DEFAULT 'annuale',
  is_mandatory BOOLEAN DEFAULT true,
  applicable_visit_types mdl_visit_type[] DEFAULT '{preventiva,periodica}',
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mdl_prot_tpl_exams_tpl ON mdl_protocol_template_exams(template_id);

ALTER TABLE mdl_protocol_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_protocol_template_exams ENABLE ROW LEVEL SECURITY;

-- Catalogo leggibile da tutto lo staff MDL (le scritture passano dal backend con service role)
CREATE POLICY mdl_prot_tpl_select ON mdl_protocol_templates FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin','medico_competente','medico_collaboratore','segreteria_mdl')
);
CREATE POLICY mdl_prot_tpl_exams_select ON mdl_protocol_template_exams FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin','medico_competente','medico_collaboratore','segreteria_mdl')
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED — 5 protocolli standard
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO mdl_protocol_templates (code, name, description, risk_factors, visit_periodicity, legal_reference) VALUES
  ('metalmeccanico_cnc', 'Operatore Metalmeccanico / CNC',
   'Mansione metalmeccanica con esposizione a rumore, vibrazioni, MMC, oli minerali e polveri.',
   ARRAY['rumore','vibrazioni','mmc','chimico','polveri'], 'annuale', 'D.Lgs. 81/2008 Titoli VI/VIII'),
  ('saldatore', 'Saldatore',
   'Esposizione a fumi di saldatura, radiazioni ottiche, rumore e polveri.',
   ARRAY['chimico','radiazioni','rumore','polveri','cancerogeno'], 'annuale', 'D.Lgs. 81/2008 Titoli VIII/IX'),
  ('magazziniere_carrellista', 'Magazziniere / Carrellista',
   'Movimentazione manuale carichi e conduzione carrelli elevatori.',
   ARRAY['mmc','vibrazioni'], 'annuale', 'D.Lgs. 81/2008 Titolo VI'),
  ('videoterminalista', 'Videoterminalista (VDT)',
   'Addetto a videoterminale > 20 ore settimanali.',
   ARRAY['vdt'], 'quinquennale', 'D.Lgs. 81/2008 Titolo VII (artt. 173-179)'),
  ('manutentore', 'Manutentore Industriale',
   'Manutenzione con rischio elettrico, lavori in quota e spazi confinati.',
   ARRAY['rischio_elettrico','lavori_quota','chimico','rumore'], 'annuale', 'D.Lgs. 81/2008 Titoli III/IV')
ON CONFLICT (code) DO NOTHING;

-- ── Esami: Operatore Metalmeccanico / CNC ──────────────────────────────────
INSERT INTO mdl_protocol_template_exams (template_id, exam_code, exam_name, exam_category, periodicity, is_mandatory, sort_order)
SELECT id, v.code, v.name, v.cat, v.per::mdl_exam_periodicity, v.mand, v.ord
FROM mdl_protocol_templates t,
(VALUES
  ('EMA001','Emocromo completo','ematochimico','annuale',true,1),
  ('EMA002','Glicemia','ematochimico','annuale',true,2),
  ('EMA003','Creatininemia','ematochimico','annuale',false,3),
  ('EMA004','Transaminasi (AST/ALT/GGT)','ematochimico','annuale',false,4),
  ('STR001','Esame audiometrico','strumentale','annuale',true,5),
  ('STR002','Spirometria','strumentale','annuale',true,6),
  ('STR003','Elettrocardiogramma (ECG)','strumentale','biennale',false,7),
  ('SPE001','Visita medica del lavoro','specialistico','annuale',true,8),
  ('SPE002','Valutazione del rachide','specialistico','annuale',false,9),
  ('TOX001','Test alcolemia','tossicologico','annuale',true,10),
  ('TOX002','Screening sostanze stupefacenti','tossicologico','annuale',true,11)
) AS v(code,name,cat,per,mand,ord)
WHERE t.code = 'metalmeccanico_cnc'
ON CONFLICT DO NOTHING;

-- ── Esami: Saldatore ───────────────────────────────────────────────────────
INSERT INTO mdl_protocol_template_exams (template_id, exam_code, exam_name, exam_category, periodicity, is_mandatory, sort_order)
SELECT id, v.code, v.name, v.cat, v.per::mdl_exam_periodicity, v.mand, v.ord
FROM mdl_protocol_templates t,
(VALUES
  ('EMA001','Emocromo completo','ematochimico','annuale',true,1),
  ('EMA004','Transaminasi (AST/ALT/GGT)','ematochimico','annuale',true,2),
  ('EMA003','Creatininemia','ematochimico','annuale',false,3),
  ('STR002','Spirometria','strumentale','annuale',true,4),
  ('STR004','RX torace','strumentale','triennale',false,5),
  ('STR001','Esame audiometrico','strumentale','annuale',true,6),
  ('STR003','Elettrocardiogramma (ECG)','strumentale','biennale',false,7),
  ('SPE001','Visita medica del lavoro','specialistico','annuale',true,8),
  ('SPE003','Visita oculistica','specialistico','annuale',false,9),
  ('TOX003','Monitoraggio biologico metalli (Mn/Cr/Ni urinari)','tossicologico','annuale',true,10),
  ('TOX001','Test alcolemia','tossicologico','annuale',true,11)
) AS v(code,name,cat,per,mand,ord)
WHERE t.code = 'saldatore'
ON CONFLICT DO NOTHING;

-- ── Esami: Magazziniere / Carrellista ──────────────────────────────────────
INSERT INTO mdl_protocol_template_exams (template_id, exam_code, exam_name, exam_category, periodicity, is_mandatory, sort_order)
SELECT id, v.code, v.name, v.cat, v.per::mdl_exam_periodicity, v.mand, v.ord
FROM mdl_protocol_templates t,
(VALUES
  ('EMA001','Emocromo completo','ematochimico','annuale',true,1),
  ('EMA002','Glicemia','ematochimico','annuale',true,2),
  ('STR003','Elettrocardiogramma (ECG)','strumentale','biennale',false,3),
  ('STR001','Esame audiometrico','strumentale','biennale',false,4),
  ('STR005','Esame dell''equilibrio (vestibolare)','strumentale','annuale',false,5),
  ('SPE001','Visita medica del lavoro','specialistico','annuale',true,6),
  ('SPE002','Valutazione del rachide','specialistico','annuale',true,7),
  ('SPE003','Visita oculistica (acuità visiva)','specialistico','biennale',false,8),
  ('TOX001','Test alcolemia','tossicologico','annuale',true,9),
  ('TOX002','Screening sostanze stupefacenti (mansione a rischio)','tossicologico','annuale',true,10)
) AS v(code,name,cat,per,mand,ord)
WHERE t.code = 'magazziniere_carrellista'
ON CONFLICT DO NOTHING;

-- ── Esami: Videoterminalista (VDT) ─────────────────────────────────────────
INSERT INTO mdl_protocol_template_exams (template_id, exam_code, exam_name, exam_category, periodicity, is_mandatory, sort_order)
SELECT id, v.code, v.name, v.cat, v.per::mdl_exam_periodicity, v.mand, v.ord
FROM mdl_protocol_templates t,
(VALUES
  ('SPE001','Visita medica del lavoro','specialistico','quinquennale',true,1),
  ('SPE004','Esame del visus / acuità visiva','specialistico','quinquennale',true,2),
  ('SPE003','Visita oculistica (se indicata)','specialistico','quinquennale',false,3),
  ('EMA002','Glicemia','ematochimico','quinquennale',false,4)
) AS v(code,name,cat,per,mand,ord)
WHERE t.code = 'videoterminalista'
ON CONFLICT DO NOTHING;

-- ── Esami: Manutentore Industriale ─────────────────────────────────────────
INSERT INTO mdl_protocol_template_exams (template_id, exam_code, exam_name, exam_category, periodicity, is_mandatory, sort_order)
SELECT id, v.code, v.name, v.cat, v.per::mdl_exam_periodicity, v.mand, v.ord
FROM mdl_protocol_templates t,
(VALUES
  ('EMA001','Emocromo completo','ematochimico','annuale',true,1),
  ('EMA002','Glicemia','ematochimico','annuale',true,2),
  ('EMA005','Profilo lipidico','ematochimico','annuale',false,3),
  ('EMA004','Transaminasi (AST/ALT/GGT)','ematochimico','annuale',false,4),
  ('STR003','Elettrocardiogramma (ECG)','strumentale','annuale',true,5),
  ('STR001','Esame audiometrico','strumentale','annuale',false,6),
  ('STR002','Spirometria','strumentale','annuale',false,7),
  ('STR005','Esame dell''equilibrio (lavori in quota)','strumentale','annuale',true,8),
  ('SPE001','Visita medica del lavoro','specialistico','annuale',true,9),
  ('SPE005','Visita cardiologica (lavori in quota)','specialistico','annuale',false,10),
  ('TOX001','Test alcolemia','tossicologico','annuale',true,11),
  ('TOX002','Screening sostanze stupefacenti','tossicologico','annuale',true,12)
) AS v(code,name,cat,per,mand,ord)
WHERE t.code = 'manutentore'
ON CONFLICT DO NOTHING;
