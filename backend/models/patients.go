package models

import (
	"time"

	"gorm.io/gorm"
)

// Patient решает проблему P-007 (Единая точка входа)
type Patient struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	DoctorID  uint           `json:"doctor_id"` // Привязка к конкретному врачу
	FullName  string         `json:"full_name"`
	Age       int            `json:"age"`
	Phone     string         `json:"phone"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Record решает проблему P-003 (История) и P-001 (Автозаполнение)
type Record struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	PatientID uint      `json:"patient_id"`
	DoctorID  uint      `json:"doctor_id"`
	Complaints string   `json:"complaints"`
	Anamnesis string    `json:"anamnesis"`
	Diagnosis string    `json:"diagnosis"`
	Plan      string    `json:"plan"`
	CreatedAt time.Time `json:"created_at"`
}

// Template решает проблему P-002 (Шаблонизатор)
type Template struct {
	ID       uint   `gorm:"primarykey" json:"id"`
	DoctorID uint   `json:"doctor_id"`
	Category string `json:"category"` // diagnosis, plan, anamnesis
	Title    string `json:"title"`
	Content  string `json:"content"`
}
