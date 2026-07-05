DROP INDEX IF EXISTS idx_templates_doctor_id;
DROP INDEX IF EXISTS idx_records_doctor_id;
DROP INDEX IF EXISTS idx_records_patient_id;
DROP INDEX IF EXISTS idx_patients_doctor_id;

DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS records;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;
