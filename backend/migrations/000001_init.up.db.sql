-- Создание таблицы пользователей (врачей)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'doctor'
);

-- Создание таблицы пациентов
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Создание таблицы медицинских записей (приемов)
CREATE TABLE IF NOT EXISTS records (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    complaints TEXT NOT NULL,
    anamnesis TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    plan TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_record_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_record_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Создание таблицы текстовых шаблонов
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    doctor_id INT DEFAULT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    CONSTRAINT fk_template_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создание индексов для ускорения выборок по внешним ключам
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_records_patient_id ON records(patient_id);
CREATE INDEX IF NOT EXISTS idx_records_doctor_id ON records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_templates_doctor_id ON templates(doctor_id) WHERE doctor_id IS NOT NULL;
