package handler

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/LLergibt/Ophthalmologist-Workflow/models"
	"github.com/gin-gonic/gin"
)

type PatientHandler struct {
	DB *sql.DB
}

type CreateTemplateInput struct {
	Category string `json:"category" binding:"required"`
	Title    string `json:"title" binding:"required"`
	Content  string `json:"content" binding:"required"`
}

func getDoctorID(c *gin.Context) uint {
	// Значение устанавливается в AuthMiddleware
	id, exists := c.Get("userID")
	if !exists {
		return 0
	}
	fmt.Print("id doctor ID")
	// Приведение типов зависит от того, как ID сохраняется в middleware
	if floatVal, ok := id.(float64); ok {
			return uint(floatVal)
	}

		// Обработка явных целочисленных типов (если ID задается вручную)
	if uintVal, ok := id.(uint); ok {
		return uintVal
	}
	if intVal, ok := id.(int); ok {
		return uint(intVal)
	}
	return 0
	}

// Получение списка пациентов врача
func (h *PatientHandler) ListPatients(c *gin.Context) {
	doctorID := getDoctorID(c)

	rows, err := h.DB.Query(`SELECT id, doctor_id, full_name, age, phone, created_at, updated_at FROM patients WHERE doctor_id = $1`, doctorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка выполнения запроса"})
		return
	}
	defer rows.Close()

	patients := make([]models.Patient, 0)
	for rows.Next() {
		var p models.Patient
		if err := rows.Scan(&p.ID, &p.DoctorID, &p.FullName, &p.Age, &p.Phone, &p.CreatedAt, &p.UpdatedAt); err != nil {
			continue
		}
		patients = append(patients, p)
	}

	c.JSON(http.StatusOK, patients)
}

func (h *PatientHandler) CreateTemplate(c *gin.Context) {
	doctorID := getDoctorID(c)
	if doctorID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Ошибка аутентификации врача"})
		return
	}

	var input CreateTemplateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var templateID uint
	query := `
		INSERT INTO templates (doctor_id, category, title, content)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	err := h.DB.QueryRow(query, doctorID, input.Category, input.Title, input.Content).Scan(&templateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании шаблона: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":      templateID,
		"message": "Шаблон успешно создан",
	})
}
// Добавление пациента
func (h *PatientHandler) CreatePatient(c *gin.Context) {
	var input models.Patient
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.DoctorID = getDoctorID(c)
	fmt.Print(input.DoctorID)
	input.CreatedAt = time.Now()
	input.UpdatedAt = time.Now()

	query := `INSERT INTO patients (doctor_id, full_name, age, phone, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`

	err := h.DB.QueryRow(query, input.DoctorID, input.FullName, input.Age, input.Phone, input.CreatedAt, input.UpdatedAt).Scan(&input.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения пациента"})
		return
	}

	c.JSON(http.StatusCreated, input)
}
// Единая карта пациента с историей приемов (P-007, P-003)
func (h *PatientHandler) GetPatientProfile(c *gin.Context) {
	doctorID := getDoctorID(c)
	patientID := c.Param("id")

	var patient models.Patient
	patientQuery := `SELECT id, doctor_id, full_name, age, phone, created_at, updated_at FROM patients WHERE id = $1 AND doctor_id = $2`

	err := h.DB.QueryRow(patientQuery, patientID, doctorID).Scan(
		&patient.ID, &patient.DoctorID, &patient.FullName, &patient.Age, &patient.Phone, &patient.CreatedAt, &patient.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Пациент не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения данных пациента"})
		}
		return
	}

	recordsQuery := `SELECT id, patient_id, doctor_id, complaints, anamnesis, diagnosis, plan, created_at FROM records WHERE patient_id = $1 ORDER BY created_at DESC`
	rows, err := h.DB.Query(recordsQuery, patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения истории приемов"})
		return
	}
	defer rows.Close()

	records := make([]models.Record, 0)
	for rows.Next() {
		var r models.Record
		if err := rows.Scan(&r.ID, &r.PatientID, &r.DoctorID, &r.Complaints, &r.Anamnesis, &r.Diagnosis, &r.Plan, &r.CreatedAt); err == nil {
			records = append(records, r)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"patient": patient,
		"history": records,
	})
}

// Создание приема (P-001)
func (h *PatientHandler) CreateRecord(c *gin.Context) {
	var input models.Record
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.DoctorID = getDoctorID(c)
	input.CreatedAt = time.Now()

	query := `INSERT INTO records (patient_id, doctor_id, complaints, anamnesis, diagnosis, plan, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`

	err := h.DB.QueryRow(query, input.PatientID, input.DoctorID, input.Complaints, input.Anamnesis, input.Diagnosis, input.Plan, input.CreatedAt).Scan(&input.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения приема"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// func (h *RecordHandler) CreateRecord(c *gin.Context) {
// 	// 1. Извлечение patient_id из URL параметра :id
// 	patientIDStr := c.Param("id")
// 	patientID, err := strconv.ParseUint(patientIDStr, 10, 64)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный ID пациента в URL"})
// 		return
// 	}

// 	// 2. Извлечение doctor_id из контекста (переданного через middleware)
// 	doctorID := getDoctorID(c) // Использует исправленную ранее функцию (работающую с userID)
// 	if doctorID == 0 {
// 		c.JSON(http.StatusUnauthorized, gin.H{"error": "Ошибка аутентификации врача"})
// 		return
// 	}

// 	// 3. Валидация JSON из тела запроса
// 	var input CreateRecordInput
// 	if err := c.ShouldBindJSON(&input); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}

// 	// 4. Запись в базу данных
// 	var recordID uint
// 	query := `
// 		INSERT INTO records (patient_id, doctor_id, complaints, anamnesis, diagnosis, plan, created_at)
// 		VALUES ($1, $2, $3, $4, $5, $6, NOW())
// 		RETURNING id`

// 	err = h.DB.QueryRow(query, patientID, doctorID, input.Complaints, input.Anamnesis, input.Diagnosis, input.Plan).Scan(&recordID)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении записи: " + err.Error()})
// 		return
// 	}

// 	c.JSON(http.StatusCreated, gin.H{
// 		"id":         recordID,
// 		"patient_id": patientID,
// 		"message":    "Запись приема успешно добавлена",
// 	})
// }

// Получение шаблонов (P-002)
func (h *PatientHandler) GetTemplates(c *gin.Context) {
	doctorID := getDoctorID(c)

	query := `SELECT id, doctor_id, category, title, content FROM templates WHERE doctor_id = $1 OR doctor_id = 0`
	rows, err := h.DB.Query(query, doctorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения шаблонов"})
		return
	}
	defer rows.Close()

	templates := make([]models.Template, 0)
	for rows.Next() {
		var t models.Template
		if err := rows.Scan(&t.ID, &t.DoctorID, &t.Category, &t.Title, &t.Content); err == nil {
			templates = append(templates, t)
		}
	}

	c.JSON(http.StatusOK, templates)
}
