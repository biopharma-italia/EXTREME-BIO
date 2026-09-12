-- Ultimo prelievo feriale alle 20:30 (decisione direzione 2026-09-12).
-- La struttura resta aperta fino alle 21:00; il generatore slot usa end_time
-- ESCLUSIVO, quindi end_time = '20:45' => ultimo slot prenotabile 20:30.
-- Sabato invariato: 08:00-14:00 => ultimo slot 13:45.
--
-- Applicare con:
--   npx wrangler d1 execute bio-clinic-booking --remote --file=migrations/2026-09-12-ultimo-prelievo-2030.sql
-- Verifica:
--   curl -s "https://bio-clinic.it/api/booking/slots?date=<lunedi>&service_id=prelievo-standard" | grep -o '"20:[0-9]*"'
--   atteso: ultimo valore "20:30"

UPDATE schedule_rules
   SET end_time = '20:45'
 WHERE department = 'laboratorio'
   AND day_of_week IN (1,2,3,4,5)
   AND end_time = '21:00';
