-- ============================================================================
-- 007: Popolamento protocolli azienda DEMO "Meccanica Rossi S.r.l."
-- Riempie i protocolli già esistenti delle 5 mansioni demo con gli esami dei
-- modelli standard (migration 006). Idempotente: inserisce gli esami solo se
-- il protocollo non ne ha già.
--   Azienda: 9f7adab6-ddb2-43cc-8ebc-0505aa9ba48f
-- ============================================================================

-- Mappa protocollo demo → codice template standard
DO $$
DECLARE
  m RECORD;
  pairs CONSTANT jsonb := '[
    {"protocol":"887dfc96-44ee-4eca-b0d5-0ef770419ef7","template":"metalmeccanico_cnc"},
    {"protocol":"a1b2c3d4-1111-4000-a000-000000000001","template":"saldatore"},
    {"protocol":"a1b2c3d4-2222-4000-a000-000000000002","template":"magazziniere_carrellista"},
    {"protocol":"a1b2c3d4-3333-4000-a000-000000000003","template":"videoterminalista"},
    {"protocol":"a1b2c3d4-4444-4000-a000-000000000004","template":"manutentore"}
  ]'::jsonb;
BEGIN
  FOR m IN SELECT * FROM jsonb_array_elements(pairs) AS x(obj)
  LOOP
    -- salta se il protocollo non esiste o ha già esami
    IF NOT EXISTS (SELECT 1 FROM mdl_protocols WHERE id = (m.obj->>'protocol')::uuid) THEN
      RAISE NOTICE 'Protocollo % inesistente, salto', m.obj->>'protocol';
      CONTINUE;
    END IF;
    IF EXISTS (SELECT 1 FROM mdl_protocol_exams WHERE protocol_id = (m.obj->>'protocol')::uuid) THEN
      RAISE NOTICE 'Protocollo % ha già esami, salto', m.obj->>'protocol';
      CONTINUE;
    END IF;

    INSERT INTO mdl_protocol_exams
      (protocol_id, exam_code, exam_name, exam_category, periodicity, is_mandatory, applicable_visit_types, notes, sort_order)
    SELECT
      (m.obj->>'protocol')::uuid,
      te.exam_code, te.exam_name, te.exam_category, te.periodicity, te.is_mandatory,
      te.applicable_visit_types, te.notes, te.sort_order
    FROM mdl_protocol_template_exams te
    JOIN mdl_protocol_templates t ON t.id = te.template_id
    WHERE t.code = m.obj->>'template';

    -- allinea la periodicità visita del protocollo a quella del template
    UPDATE mdl_protocols p
       SET visit_periodicity = t.visit_periodicity
      FROM mdl_protocol_templates t
     WHERE p.id = (m.obj->>'protocol')::uuid
       AND t.code = m.obj->>'template';
  END LOOP;
END $$;
